import { NotificationService, NotificationData } from './notification-service';
import { JobQueue } from './job-queue';

export class NotificationEvents {
  private static notificationService = NotificationService.getInstance();
  private static jobQueue = JobQueue.getInstance();

  /**
   * Send scan completion notification
   */
  static async onScanCompleted(params: {
    userId: string;
    scanId: string;
    scanName: string;
    totalFiles: number;
    vulnerabilitiesCount: number;
    criticalCount: number;
    highCount: number;
    duration: string;
    reportUrl: string;
  }): Promise<void> {
    const notification: NotificationData = {
      userId: params.userId,
      event: 'scan_completed',
      type: 'scan_completion',
      title: `Scan Completed - ${params.scanName}`,
      message: `Your security scan "${params.scanName}" has completed successfully with ${params.vulnerabilitiesCount} vulnerabilities found.`,
      metadata: {
        scanId: params.scanId,
        scanName: params.scanName,
        totalFiles: params.totalFiles,
        vulnerabilitiesCount: params.vulnerabilitiesCount,
        criticalCount: params.criticalCount,
        highCount: params.highCount,
        duration: params.duration,
        reportUrl: params.reportUrl,
        completedAt: new Date().toISOString(),
      },
    };

    await this.jobQueue.addNotificationJob(notification);
  }

  /**
   * Send vulnerability detection notification
   */
  static async onVulnerabilityDetected(params: {
    userId: string;
    scanId: string;
    scanName: string;
    vulnerabilityId: string;
    vulnerabilityType: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    fileName: string;
    lineNumber: number;
    cvssScore: number;
    description: string;
    recommendation: string;
    vulnerabilityUrl: string;
  }): Promise<void> {
    const notification: NotificationData = {
      userId: params.userId,
      event: 'vulnerability_detected',
      type: 'security_alert',
      title: `${params.severity.toUpperCase()} Vulnerability Detected`,
      message: `A ${params.severity} severity ${params.vulnerabilityType} vulnerability was found in ${params.fileName}.`,
      metadata: {
        scanId: params.scanId,
        scanName: params.scanName,
        vulnerabilityId: params.vulnerabilityId,
        vulnerabilityType: params.vulnerabilityType,
        severity: params.severity,
        fileName: params.fileName,
        lineNumber: params.lineNumber,
        cvssScore: params.cvssScore,
        description: params.description,
        recommendation: params.recommendation,
        vulnerabilityUrl: params.vulnerabilityUrl,
        detectedAt: new Date().toISOString(),
      },
    };

    // For critical vulnerabilities, send immediately
    if (params.severity === 'critical') {
      await this.notificationService.sendNotification(notification);
    } else {
      await this.jobQueue.addNotificationJob(notification);
    }
  }

  /**
   * Send report generation notification
   */
  static async onReportGenerated(params: {
    userId: string;
    reportId: string;
    reportName: string;
    reportType: string;
    dateRange: string;
    totalScans: number;
    fileSize: string;
    downloadUrl: string;
    csvUrl?: string;
    dataSource: string;
  }): Promise<void> {
    const notification: NotificationData = {
      userId: params.userId,
      event: 'report_generated',
      type: 'report_ready',
      title: `Report Ready - ${params.reportName}`,
      message: `Your ${params.reportType} report "${params.reportName}" is ready for download.`,
      metadata: {
        reportId: params.reportId,
        reportName: params.reportName,
        reportType: params.reportType,
        dateRange: params.dateRange,
        totalScans: params.totalScans,
        fileSize: params.fileSize,
        downloadUrl: params.downloadUrl,
        csvUrl: params.csvUrl,
        dataSource: params.dataSource,
        generatedAt: new Date().toISOString(),
      },
    };

    await this.jobQueue.addNotificationJob(notification);
  }

  /**
   * Send team invitation notification
   */
  static async onTeamInvitation(params: {
    userId: string;
    organizationId: string;
    organizationName: string;
    invitedBy: string;
    role: string;
    message?: string;
    acceptUrl: string;
    declineUrl: string;
    expiresAt: string;
  }): Promise<void> {
    const notification: NotificationData = {
      userId: params.userId,
      event: 'team_invitation',
      type: 'team_invitation',
      title: `Team Invitation - ${params.organizationName}`,
      message: `${params.invitedBy} has invited you to join ${params.organizationName} as a ${params.role}.`,
      metadata: {
        organizationId: params.organizationId,
        organizationName: params.organizationName,
        invitedBy: params.invitedBy,
        role: params.role,
        message: params.message,
        acceptUrl: params.acceptUrl,
        declineUrl: params.declineUrl,
        expiresAt: params.expiresAt,
        sentAt: new Date().toISOString(),
      },
    };

    // Team invitations should be sent immediately
    await this.notificationService.sendNotification(notification);
  }

  /**
   * Send password reset notification
   */
  static async onPasswordResetRequest(params: {
    userId: string;
    resetUrl: string;
    expiresIn: string;
  }): Promise<void> {
    const notification: NotificationData = {
      userId: params.userId,
      event: 'password_reset',
      type: 'security_action',
      title: 'Password Reset Request',
      message: 'A password reset was requested for your account.',
      metadata: {
        resetUrl: params.resetUrl,
        expiresIn: params.expiresIn,
        requestedAt: new Date().toISOString(),
      },
    };

    // Password reset should be sent immediately
    await this.notificationService.sendNotification(notification);
  }

  /**
   * Send system maintenance notification
   */
  static async onSystemMaintenance(params: {
    userIds: string[];
    title: string;
    message: string;
    scheduledAt: string;
    estimatedDuration: string;
    affectedServices: string[];
  }): Promise<void> {
    const notifications: NotificationData[] = params.userIds.map(userId => ({
      userId,
      event: 'system_maintenance',
      type: 'system_announcement',
      title: params.title,
      message: params.message,
      metadata: {
        scheduledAt: params.scheduledAt,
        estimatedDuration: params.estimatedDuration,
        affectedServices: params.affectedServices,
        announcedAt: new Date().toISOString(),
      },
    }));

    await this.jobQueue.addBulkNotificationJob(notifications);
  }

  /**
   * Send security alert for suspicious activity
   */
  static async onSecurityAlert(params: {
    userId: string;
    alertType: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    ipAddress?: string;
    userAgent?: string;
    actionUrl?: string;
  }): Promise<void> {
    const notification: NotificationData = {
      userId: params.userId,
      event: 'security_alert',
      type: 'security_alert',
      title: `Security Alert - ${params.alertType}`,
      message: params.description,
      metadata: {
        alertType: params.alertType,
        severity: params.severity,
        description: params.description,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        actionUrl: params.actionUrl,
        detectedAt: new Date().toISOString(),
      },
    };

    // Critical security alerts should be sent immediately
    if (params.severity === 'critical') {
      await this.notificationService.sendNotification(notification);
    } else {
      await this.jobQueue.addNotificationJob(notification);
    }
  }

  /**
   * Send quota/usage notification
   */
  static async onQuotaAlert(params: {
    userId: string;
    quotaType: string;
    currentUsage: number;
    limit: number;
    percentage: number;
    upgradeUrl?: string;
  }): Promise<void> {
    const isOverLimit = params.currentUsage >= params.limit;
    const notification: NotificationData = {
      userId: params.userId,
      event: 'quota_alert',
      type: 'usage_alert',
      title: isOverLimit ? `Quota Exceeded - ${params.quotaType}` : `Quota Warning - ${params.quotaType}`,
      message: isOverLimit 
        ? `You've exceeded your ${params.quotaType} quota (${params.currentUsage}/${params.limit}).`
        : `You're approaching your ${params.quotaType} quota (${params.percentage}% used).`,
      metadata: {
        quotaType: params.quotaType,
        currentUsage: params.currentUsage,
        limit: params.limit,
        percentage: params.percentage,
        isOverLimit,
        upgradeUrl: params.upgradeUrl,
        checkedAt: new Date().toISOString(),
      },
    };

    await this.jobQueue.addNotificationJob(notification);
  }

  /**
   * Send scheduled scan reminder
   */
  static async onScheduledScanReminder(params: {
    userId: string;
    scanName: string;
    scheduledAt: string;
    scanUrl: string;
  }): Promise<void> {
    const notification: NotificationData = {
      userId: params.userId,
      event: 'scheduled_scan_reminder',
      type: 'reminder',
      title: `Scheduled Scan Reminder - ${params.scanName}`,
      message: `Your scheduled scan "${params.scanName}" is set to run at ${params.scheduledAt}.`,
      metadata: {
        scanName: params.scanName,
        scheduledAt: params.scheduledAt,
        scanUrl: params.scanUrl,
        reminderSentAt: new Date().toISOString(),
      },
    };

    await this.jobQueue.addNotificationJob(notification);
  }

  /**
   * Send bulk notifications to multiple users
   */
  static async sendBulkNotification(params: {
    userIds: string[];
    event: string;
    type: string;
    title: string;
    message: string;
    metadata?: Record<string, any>;
    scheduleAt?: Date;
  }): Promise<void> {
    const notifications: NotificationData[] = params.userIds.map(userId => ({
      userId,
      event: params.event,
      type: params.type,
      title: params.title,
      message: params.message,
      metadata: params.metadata || {},
    }));

    if (params.scheduleAt) {
      // Schedule bulk notifications
      for (const notification of notifications) {
        await this.jobQueue.scheduleNotification(notification, params.scheduleAt);
      }
    } else {
      await this.jobQueue.addBulkNotificationJob(notifications);
    }
  }
}