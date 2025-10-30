/**
 * Security Event Logger
 * 
 * Comprehensive logging for security-related events including
 * authentication, authorization, and suspicious activities.
 */

import { db } from '@/lib/db';
import { activityLogs } from '@/lib/db/schema';
import { securityEventTypes } from '@/lib/auth/config';

export interface SecurityEvent {
  type: string;
  userId?: string;
  email?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Log a security event to the database
 */
export async function logSecurityEvent(event: SecurityEvent): Promise<void> {
  try {
    const severity = event.severity || getSeverityForEventType(event.type);
    
    await db.insert(activityLogs).values({
      userId: event.userId || null,
      action: event.type,
      entityType: 'security',
      entityId: event.email || event.userId || 'anonymous',
      organizationId: null,
      description: formatEventDescription(event),
      metadata: {
        ...event.metadata,
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
        severity,
        timestamp: new Date().toISOString(),
      },
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      timestamp: new Date(),
    });
    
    // Also log to console for immediate visibility
    const logLevel = severity === 'critical' || severity === 'high' ? 'error' : 'info';
    console[logLevel](`[SECURITY] ${event.type}:`, {
      userId: event.userId,
      email: event.email,
      ipAddress: event.ipAddress,
      severity,
    });
  } catch (error) {
    console.error('Failed to log security event:', error);
    // Don't throw - logging failures should not break the application
  }
}

/**
 * Get severity level based on event type
 */
function getSeverityForEventType(eventType: string): 'low' | 'medium' | 'high' | 'critical' {
  const severityMap: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
    [securityEventTypes.LOGIN_SUCCESS]: 'low',
    [securityEventTypes.LOGIN_FAILURE]: 'medium',
    [securityEventTypes.LOGOUT]: 'low',
    [securityEventTypes.PASSWORD_CHANGE]: 'medium',
    [securityEventTypes.PASSWORD_RESET_REQUEST]: 'medium',
    [securityEventTypes.PASSWORD_RESET_SUCCESS]: 'high',
    [securityEventTypes.ACCOUNT_LOCKED]: 'high',
    [securityEventTypes.ACCOUNT_UNLOCKED]: 'medium',
    [securityEventTypes.MFA_ENABLED]: 'medium',
    [securityEventTypes.MFA_DISABLED]: 'high',
    [securityEventTypes.MFA_SUCCESS]: 'low',
    [securityEventTypes.MFA_FAILURE]: 'medium',
    [securityEventTypes.API_KEY_CREATED]: 'medium',
    [securityEventTypes.API_KEY_DELETED]: 'medium',
    [securityEventTypes.PERMISSION_DENIED]: 'high',
    [securityEventTypes.SUSPICIOUS_ACTIVITY]: 'critical',
  };
  
  return severityMap[eventType] || 'medium';
}

/**
 * Format event description for human readability
 */
function formatEventDescription(event: SecurityEvent): string {
  const descriptions: Record<string, string> = {
    [securityEventTypes.LOGIN_SUCCESS]: `Successful login for ${event.email || 'user'}`,
    [securityEventTypes.LOGIN_FAILURE]: `Failed login attempt for ${event.email || 'user'}`,
    [securityEventTypes.LOGOUT]: `User logged out`,
    [securityEventTypes.PASSWORD_CHANGE]: `Password changed`,
    [securityEventTypes.PASSWORD_RESET_REQUEST]: `Password reset requested`,
    [securityEventTypes.PASSWORD_RESET_SUCCESS]: `Password reset completed`,
    [securityEventTypes.ACCOUNT_LOCKED]: `Account locked due to multiple failed attempts`,
    [securityEventTypes.ACCOUNT_UNLOCKED]: `Account unlocked`,
    [securityEventTypes.MFA_ENABLED]: `Two-factor authentication enabled`,
    [securityEventTypes.MFA_DISABLED]: `Two-factor authentication disabled`,
    [securityEventTypes.MFA_SUCCESS]: `Two-factor authentication successful`,
    [securityEventTypes.MFA_FAILURE]: `Two-factor authentication failed`,
    [securityEventTypes.API_KEY_CREATED]: `API key created`,
    [securityEventTypes.API_KEY_DELETED]: `API key deleted`,
    [securityEventTypes.PERMISSION_DENIED]: `Access denied - insufficient permissions`,
    [securityEventTypes.SUSPICIOUS_ACTIVITY]: `Suspicious activity detected`,
  };
  
  return descriptions[event.type] || `Security event: ${event.type}`;
}

/**
 * Convenience functions for common security events
 */

export async function logLoginSuccess(userId: string, email: string, ipAddress?: string, userAgent?: string) {
  await logSecurityEvent({
    type: securityEventTypes.LOGIN_SUCCESS,
    userId,
    email,
    ipAddress,
    userAgent,
    severity: 'low',
  });
}

export async function logLoginFailure(email: string, ipAddress?: string, userAgent?: string, reason?: string) {
  await logSecurityEvent({
    type: securityEventTypes.LOGIN_FAILURE,
    email,
    ipAddress,
    userAgent,
    severity: 'medium',
    metadata: { reason },
  });
}

export async function logAccountLocked(userId: string, email: string, ipAddress?: string, failedAttempts?: number) {
  await logSecurityEvent({
    type: securityEventTypes.ACCOUNT_LOCKED,
    userId,
    email,
    ipAddress,
    severity: 'high',
    metadata: { failedAttempts },
  });
}

export async function logPasswordChange(userId: string, email: string, ipAddress?: string) {
  await logSecurityEvent({
    type: securityEventTypes.PASSWORD_CHANGE,
    userId,
    email,
    ipAddress,
    severity: 'medium',
  });
}

export async function logSuspiciousActivity(
  description: string,
  userId?: string,
  email?: string,
  ipAddress?: string,
  metadata?: Record<string, any>
) {
  await logSecurityEvent({
    type: securityEventTypes.SUSPICIOUS_ACTIVITY,
    userId,
    email,
    ipAddress,
    severity: 'critical',
    metadata: {
      ...metadata,
      description,
    },
  });
}

export async function logPermissionDenied(
  userId: string,
  email: string,
  resource: string,
  action: string,
  ipAddress?: string
) {
  await logSecurityEvent({
    type: securityEventTypes.PERMISSION_DENIED,
    userId,
    email,
    ipAddress,
    severity: 'high',
    metadata: {
      resource,
      action,
    },
  });
}

/**
 * Query security logs with filters
 */
export async function getSecurityLogs(filters: {
  userId?: string;
  eventType?: string;
  severity?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}) {
  // This would be implemented with proper Drizzle queries
  // For now, returning a placeholder
  return [];
}

export { securityEventTypes };
