import { emailService } from './email-service';
import { redis } from '@/lib/redis/client';
import { db } from '@/lib/db/drizzle';
import { notifications, users, organizations } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

// Notification types
export enum NotificationType {
  EMAIL = 'email',
  SMS = 'sms',
  WEBHOOK = 'webhook',
  IN_APP = 'in_app',
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  RETRYING = 'retrying',
}

export enum NotificationEvent {
  SCAN_COMPLETED = 'scan_completed',
  SCAN_FAILED = 'scan_failed',
  HIGH_RISK_DETECTED = 'high_risk_detected',
  CRITICAL_VULNERABILITY = 'critical_vulnerability',
  SYSTEM_ALERT = 'system_alert',
  USER_INVITED = 'user_invited',
  PASSWORD_RESET = 'password_reset',
  WELCOME = 'welcome',
  REPORT_READY = 'report_ready',
  QUOTA_EXCEEDED = 'quota_exceeded',
  SUBSCRIPTION_EXPIRING = 'subscription_expiring',
}

export interface NotificationData {
  id?: string;
  userId: number;
  organizationId?: number;
  type: NotificationType;
  event: NotificationEvent;
  priority: NotificationPriority;
  title: string;
  message: string;
  data?: Record<string, any>;
  scheduledAt?: Date;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

export interface NotificationPreferences {
  userId: number;
  email: {
    enabled: boolean;
    events: NotificationEvent[];
    frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
  };
  sms: {
    enabled: boolean;
    phoneNumber?: string;
    events: NotificationEvent[];
    frequency: 'immediate' | 'daily';
  };
  webhook: {
    enabled: boolean;
    url?: string;
    events: NotificationEvent[];
    secret?: string;
  };
  inApp: {
    enabled: boolean;
    events: NotificationEvent[];
  };
}

export interface DeliveryResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider?: string;
  deliveredAt?: Date;
  metadata?: Record<string, any>;
}

// SMS Service Interface
export interface SMSProvider {
  send(phoneNumber: string, message: string, metadata?: Record<string, any>): Promise<DeliveryResult>;
  getDeliveryStatus(messageId: string): Promise<DeliveryResult>;
}

// Webhook Service Interface
export interface WebhookProvider {
  send(url: string, payload: any, secret?: string): Promise<DeliveryResult>;
}

// Main Notification Service
export class NotificationService {
  private smsProvider?: SMSProvider;
  private webhookProvider: WebhookProvider;
  private readonly RETRY_ATTEMPTS = 3;
  private readonly RETRY_DELAYS = [60, 300, 900]; // 1min, 5min, 15min

  constructor() {
    this.webhookProvider = new DefaultWebhookProvider();
    // Initialize SMS provider based on environment
    this.initializeSMSProvider();
  }

  private initializeSMSProvider() {
    const provider = process.env.SMS_PROVIDER || 'twilio';
    
    switch (provider.toLowerCase()) {
      case 'twilio':
        this.smsProvider = new TwilioSMSProvider();
        break;
      case 'aws':
        this.smsProvider = new AWSSMSProvider();
        break;
      default:
        console.warn(`SMS provider '${provider}' not supported, SMS notifications disabled`);
    }
  }

  // Send notification based on user preferences
  async sendNotification(notification: NotificationData): Promise<string[]> {
    const deliveryIds: string[] = [];
    
    try {
      // Get user preferences
      const preferences = await this.getUserPreferences(notification.userId);
      
      // Check if user wants this type of notification
      if (!this.shouldSendNotification(notification, preferences)) {
        console.log(`Notification blocked by user preferences: ${notification.event}`);
        return deliveryIds;
      }

      // Send via enabled channels
      if (preferences.email.enabled && preferences.email.events.includes(notification.event)) {
        const emailId = await this.sendEmailNotification(notification, preferences);
        if (emailId) deliveryIds.push(emailId);
      }

      if (preferences.sms.enabled && preferences.sms.events.includes(notification.event) && preferences.sms.phoneNumber) {
        const smsId = await this.sendSMSNotification(notification, preferences);
        if (smsId) deliveryIds.push(smsId);
      }

      if (preferences.webhook.enabled && preferences.webhook.events.includes(notification.event) && preferences.webhook.url) {
        const webhookId = await this.sendWebhookNotification(notification, preferences);
        if (webhookId) deliveryIds.push(webhookId);
      }

      if (preferences.inApp.enabled && preferences.inApp.events.includes(notification.event)) {
        const inAppId = await this.sendInAppNotification(notification);
        if (inAppId) deliveryIds.push(inAppId);
      }

      return deliveryIds;
      
    } catch (error) {
      console.error('Failed to send notification:', error);
      throw error;
    }
  }

  // Send email notification
  private async sendEmailNotification(
    notification: NotificationData, 
    preferences: NotificationPreferences
  ): Promise<string | null> {
    try {
      const user = await this.getUser(notification.userId);
      if (!user?.email) return null;

      const template = this.getEmailTemplate(notification.event);
      const templateData = {
        ...notification.data,
        userName: user.name || user.email,
        title: notification.title,
        message: notification.message,
        organizationName: notification.organizationId ? 
          await this.getOrganizationName(notification.organizationId) : undefined,
      };

      await emailService.sendEmail({
        to: user.email,
        subject: notification.title,
        template,
        data: templateData,
      });

      // Store notification record
      const notificationId = await this.storeNotification({
        ...notification,
        type: NotificationType.EMAIL,
        status: NotificationStatus.SENT,
      });

      return notificationId;
      
    } catch (error) {
      console.error('Email notification failed:', error);
      await this.storeNotification({
        ...notification,
        type: NotificationType.EMAIL,
        status: NotificationStatus.FAILED,
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' },
      });
      return null;
    }
  }

  // Send SMS notification
  private async sendSMSNotification(
    notification: NotificationData,
    preferences: NotificationPreferences
  ): Promise<string | null> {
    if (!this.smsProvider || !preferences.sms.phoneNumber) {
      return null;
    }

    try {
      const message = this.formatSMSMessage(notification);
      const result = await this.smsProvider.send(
        preferences.sms.phoneNumber,
        message,
        { event: notification.event, priority: notification.priority }
      );

      const status = result.success ? NotificationStatus.SENT : NotificationStatus.FAILED;
      
      const notificationId = await this.storeNotification({
        ...notification,
        type: NotificationType.SMS,
        status,
        metadata: { 
          messageId: result.messageId,
          provider: result.provider,
          error: result.error 
        },
      });

      return notificationId;
      
    } catch (error) {
      console.error('SMS notification failed:', error);
      await this.storeNotification({
        ...notification,
        type: NotificationType.SMS,
        status: NotificationStatus.FAILED,
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' },
      });
      return null;
    }
  }

  // Send webhook notification
  private async sendWebhookNotification(
    notification: NotificationData,
    preferences: NotificationPreferences
  ): Promise<string | null> {
    if (!preferences.webhook.url) return null;

    try {
      const payload = {
        event: notification.event,
        type: notification.type,
        priority: notification.priority,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        userId: notification.userId,
        organizationId: notification.organizationId,
        timestamp: new Date().toISOString(),
      };

      const result = await this.webhookProvider.send(
        preferences.webhook.url,
        payload,
        preferences.webhook.secret
      );

      const status = result.success ? NotificationStatus.SENT : NotificationStatus.FAILED;
      
      const notificationId = await this.storeNotification({
        ...notification,
        type: NotificationType.WEBHOOK,
        status,
        metadata: {
          url: preferences.webhook.url,
          error: result.error,
          statusCode: result.metadata?.statusCode,
        },
      });

      return notificationId;
      
    } catch (error) {
      console.error('Webhook notification failed:', error);
      await this.storeNotification({
        ...notification,
        type: NotificationType.WEBHOOK,
        status: NotificationStatus.FAILED,
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' },
      });
      return null;
    }
  }

  // Send in-app notification
  private async sendInAppNotification(notification: NotificationData): Promise<string> {
    const notificationId = await this.storeNotification({
      ...notification,
      type: NotificationType.IN_APP,
      status: NotificationStatus.SENT,
    });

    // Cache for real-time retrieval
    await this.cacheInAppNotification(notification.userId, {
      id: notificationId,
      ...notification,
      createdAt: new Date(),
    });

    return notificationId;
  }

  // Bulk notification sending
  async sendBulkNotification(
    userIds: number[],
    notification: Omit<NotificationData, 'userId'>
  ): Promise<Record<number, string[]>> {
    const results: Record<number, string[]> = {};
    
    for (const userId of userIds) {
      try {
        const deliveryIds = await this.sendNotification({
          ...notification,
          userId,
        });
        results[userId] = deliveryIds;
      } catch (error) {
        console.error(`Failed to send notification to user ${userId}:`, error);
        results[userId] = [];
      }
    }
    
    return results;
  }

  // Event-based notification helpers
  async notifyScanCompleted(userId: number, scanData: any): Promise<string[]> {
    return this.sendNotification({
      userId,
      type: NotificationType.EMAIL,
      event: NotificationEvent.SCAN_COMPLETED,
      priority: NotificationPriority.NORMAL,
      title: 'Scan Completed Successfully',
      message: `Your compatibility scan "${scanData.fileName}" has completed with ${scanData.riskScore}/100 risk score.`,
      data: scanData,
    });
  }

  async notifyHighRiskDetected(userId: number, riskData: any): Promise<string[]> {
    return this.sendNotification({
      userId,
      type: NotificationType.EMAIL,
      event: NotificationEvent.HIGH_RISK_DETECTED,
      priority: NotificationPriority.HIGH,
      title: 'High Risk Detected',
      message: `Critical security issues found in your scan. Immediate attention required.`,
      data: riskData,
    });
  }

  async notifySystemAlert(userIds: number[], alertData: any): Promise<Record<number, string[]>> {
    return this.sendBulkNotification(userIds, {
      type: NotificationType.EMAIL,
      event: NotificationEvent.SYSTEM_ALERT,
      priority: NotificationPriority.CRITICAL,
      title: 'System Alert',
      message: alertData.message,
      data: alertData,
    });
  }

  // User preference management
  async getUserPreferences(userId: number): Promise<NotificationPreferences> {
    const cacheKey = `notification_prefs:${userId}`;
    
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      console.error('Failed to get cached preferences:', error);
    }

    // Default preferences
    const defaultPreferences: NotificationPreferences = {
      userId,
      email: {
        enabled: true,
        events: [
          NotificationEvent.SCAN_COMPLETED,
          NotificationEvent.HIGH_RISK_DETECTED,
          NotificationEvent.CRITICAL_VULNERABILITY,
          NotificationEvent.WELCOME,
          NotificationEvent.PASSWORD_RESET,
        ],
        frequency: 'immediate',
      },
      sms: {
        enabled: false,
        events: [
          NotificationEvent.CRITICAL_VULNERABILITY,
          NotificationEvent.SYSTEM_ALERT,
        ],
        frequency: 'immediate',
      },
      webhook: {
        enabled: false,
        events: Object.values(NotificationEvent),
      },
      inApp: {
        enabled: true,
        events: Object.values(NotificationEvent),
      },
    };

    // Cache for 1 hour
    try {
      await redis.setex(cacheKey, 3600, JSON.stringify(defaultPreferences));
    } catch (error) {
      console.error('Failed to cache preferences:', error);
    }

    return defaultPreferences;
  }

  async updateUserPreferences(userId: number, preferences: Partial<NotificationPreferences>): Promise<void> {
    const current = await this.getUserPreferences(userId);
    const updated = { ...current, ...preferences };
    
    const cacheKey = `notification_prefs:${userId}`;
    
    try {
      await redis.setex(cacheKey, 3600, JSON.stringify(updated));
      
      // In a real implementation, you would also store in database
      console.log(`Updated notification preferences for user ${userId}`);
    } catch (error) {
      console.error('Failed to update preferences:', error);
      throw error;
    }
  }

  // Helper methods
  private shouldSendNotification(
    notification: NotificationData,
    preferences: NotificationPreferences
  ): boolean {
    // Check if event is in any enabled channel
    const channels = [preferences.email, preferences.sms, preferences.webhook, preferences.inApp];
    return channels.some(channel => 
      channel.enabled && channel.events.includes(notification.event)
    );
  }

  private getEmailTemplate(event: NotificationEvent): string {
    const templateMap: Record<NotificationEvent, string> = {
      [NotificationEvent.SCAN_COMPLETED]: 'scan-completed',
      [NotificationEvent.SCAN_FAILED]: 'scan-failed',
      [NotificationEvent.HIGH_RISK_DETECTED]: 'high-risk-alert',
      [NotificationEvent.CRITICAL_VULNERABILITY]: 'critical-vulnerability',
      [NotificationEvent.SYSTEM_ALERT]: 'system-alert',
      [NotificationEvent.USER_INVITED]: 'organization-invitation',
      [NotificationEvent.PASSWORD_RESET]: 'password-reset',
      [NotificationEvent.WELCOME]: 'welcome',
      [NotificationEvent.REPORT_READY]: 'report-ready',
      [NotificationEvent.QUOTA_EXCEEDED]: 'quota-exceeded',
      [NotificationEvent.SUBSCRIPTION_EXPIRING]: 'subscription-expiring',
    };

    return templateMap[event] || 'default';
  }

  private formatSMSMessage(notification: NotificationData): string {
    const maxLength = 160; // Standard SMS length
    let message = `${notification.title}: ${notification.message}`;
    
    if (message.length > maxLength) {
      message = message.substring(0, maxLength - 3) + '...';
    }
    
    return message;
  }

  private async getUser(userId: number) {
    try {
      const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      return user[0] || null;
    } catch (error) {
      console.error('Failed to get user:', error);
      return null;
    }
  }

  private async getOrganizationName(organizationId: number): Promise<string | undefined> {
    try {
      const org = await db.select({ name: organizations.name })
        .from(organizations)
        .where(eq(organizations.id, organizationId))
        .limit(1);
      return org[0]?.name;
    } catch (error) {
      console.error('Failed to get organization name:', error);
      return undefined;
    }
  }

  private async storeNotification(notification: NotificationData & { status: NotificationStatus }): Promise<string> {
    try {
      const result = await db.insert(notifications).values({
        userId: notification.userId,
        organizationId: notification.organizationId,
        type: notification.type,
        channel: notification.type, // Map type to channel
        title: notification.title,
        message: notification.message,
        status: notification.status,
        metadata: notification.metadata ? JSON.stringify(notification.metadata) : null,
        createdAt: new Date(),
      }).returning({ id: notifications.id });

      return result[0].id.toString();
    } catch (error) {
      console.error('Failed to store notification:', error);
      throw error;
    }
  }

  private async cacheInAppNotification(userId: number, notification: any): Promise<void> {
    const cacheKey = `in_app_notifications:${userId}`;
    
    try {
      // Get existing notifications
      const existing = await redis.lrange(cacheKey, 0, -1);
      const notifications = existing.map(n => JSON.parse(n));
      
      // Add new notification at the beginning
      notifications.unshift(notification);
      
      // Keep only latest 50 notifications
      const latest = notifications.slice(0, 50);
      
      // Update cache
      await redis.del(cacheKey);
      if (latest.length > 0) {
        await redis.lpush(cacheKey, ...latest.map(n => JSON.stringify(n)));
        await redis.expire(cacheKey, 30 * 24 * 60 * 60); // 30 days
      }
    } catch (error) {
      console.error('Failed to cache in-app notification:', error);
    }
  }
}

// SMS Provider Implementations
class TwilioSMSProvider implements SMSProvider {
  async send(phoneNumber: string, message: string, metadata?: Record<string, any>): Promise<DeliveryResult> {
    // In a real implementation, use Twilio SDK
    console.log(`[TWILIO SMS] To: ${phoneNumber}, Message: ${message}`);
    
    return {
      success: true,
      messageId: `twilio_${Date.now()}`,
      provider: 'twilio',
      deliveredAt: new Date(),
      metadata: { phoneNumber },
    };
  }

  async getDeliveryStatus(messageId: string): Promise<DeliveryResult> {
    return {
      success: true,
      messageId,
      provider: 'twilio',
      deliveredAt: new Date(),
    };
  }
}

class AWSSMSProvider implements SMSProvider {
  async send(phoneNumber: string, message: string, metadata?: Record<string, any>): Promise<DeliveryResult> {
    // In a real implementation, use AWS SNS SDK
    console.log(`[AWS SNS] To: ${phoneNumber}, Message: ${message}`);
    
    return {
      success: true,
      messageId: `aws_${Date.now()}`,
      provider: 'aws_sns',
      deliveredAt: new Date(),
      metadata: { phoneNumber },
    };
  }

  async getDeliveryStatus(messageId: string): Promise<DeliveryResult> {
    return {
      success: true,
      messageId,
      provider: 'aws_sns',
      deliveredAt: new Date(),
    };
  }
}

// Webhook Provider Implementation
class DefaultWebhookProvider implements WebhookProvider {
  async send(url: string, payload: any, secret?: string): Promise<DeliveryResult> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'AppCompatCheck-Webhook/1.0',
      };

      if (secret) {
        // In a real implementation, generate HMAC signature
        headers['X-Webhook-Signature'] = `sha256=${secret}`;
      }

      // In a real implementation, use fetch or http client
      console.log(`[WEBHOOK] URL: ${url}, Payload:`, JSON.stringify(payload, null, 2));
      
      return {
        success: true,
        messageId: `webhook_${Date.now()}`,
        deliveredAt: new Date(),
        metadata: { url, statusCode: 200 },
      };
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();