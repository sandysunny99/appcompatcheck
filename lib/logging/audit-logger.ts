import { db } from '@/lib/db/drizzle';
import { auditLogs } from '@/lib/db/schema';
import { redis } from '@/lib/redis/client';
import { eq, desc, and, gte, lte, like, or, sql } from 'drizzle-orm';

export interface AuditEvent {
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  timestamp?: Date;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
}

export interface AuditQuery {
  userId?: string;
  action?: string;
  resource?: string;
  resourceId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  ipAddress?: string;
  limit?: number;
  offset?: number;
}

export interface SecurityEvent {
  type: 'failed_login' | 'suspicious_activity' | 'privilege_escalation' | 'data_access' | 'system_change';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  ipAddress: string;
  userAgent?: string;
  description: string;
  metadata?: Record<string, any>;
}

// Comprehensive audit logging system
export class AuditLogger {
  private static instance: AuditLogger;

  static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  // Log audit event
  async logEvent(event: AuditEvent): Promise<void> {
    try {
      // Insert into database
      await db.insert(auditLogs).values({
        userId: event.userId,
        action: event.action,
        resource: event.resource,
        resourceId: event.resourceId || null,
        details: event.details || null,
        timestamp: event.timestamp || new Date(),
        ipAddress: event.ipAddress || null,
        userAgent: event.userAgent || null,
      });

      // Cache recent events in Redis for quick access
      const cacheKey = 'audit:recent';
      const eventData = JSON.stringify({
        ...event,
        timestamp: event.timestamp || new Date(),
      });
      
      await redis.lpush(cacheKey, eventData);
      await redis.ltrim(cacheKey, 0, 999); // Keep last 1000 events
      await redis.expire(cacheKey, 86400); // 24 hours

      console.log(`Audit event logged: ${event.action} on ${event.resource} by ${event.userId}`);
      
    } catch (error) {
      console.error('Failed to log audit event:', error);
      // Don't throw error to avoid breaking the main application flow
    }
  }

  // Query audit logs
  async queryLogs(query: AuditQuery): Promise<{
    logs: Array<{
      id: string;
      userId: string;
      action: string;
      resource: string;
      resourceId?: string;
      details?: Record<string, any>;
      timestamp: Date;
      ipAddress?: string;
      userAgent?: string;
    }>;
    total: number;
  }> {
    try {
      let conditions = [];

      if (query.userId) {
        conditions.push(eq(auditLogs.userId, query.userId));
      }

      if (query.action) {
        conditions.push(like(auditLogs.action, `%${query.action}%`));
      }

      if (query.resource) {
        conditions.push(eq(auditLogs.resource, query.resource));
      }

      if (query.resourceId) {
        conditions.push(eq(auditLogs.resourceId, query.resourceId));
      }

      if (query.dateFrom) {
        conditions.push(gte(auditLogs.timestamp, query.dateFrom));
      }

      if (query.dateTo) {
        conditions.push(lte(auditLogs.timestamp, query.dateTo));
      }

      if (query.ipAddress) {
        conditions.push(eq(auditLogs.ipAddress, query.ipAddress));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Get total count
      const totalResult = await db
        .select({ count: sql`count(*)` })
        .from(auditLogs)
        .where(whereClause);
      
      const total = Number(totalResult[0]?.count || 0);

      // Get logs with pagination
      const logs = await db
        .select()
        .from(auditLogs)
        .where(whereClause)
        .orderBy(desc(auditLogs.timestamp))
        .limit(query.limit || 50)
        .offset(query.offset || 0);

      return {
        logs,
        total,
      };

    } catch (error) {
      console.error('Failed to query audit logs:', error);
      return { logs: [], total: 0 };
    }
  }

  // Log authentication events
  async logAuthentication(
    userId: string,
    action: 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED' | 'PASSWORD_CHANGE' | 'ACCOUNT_LOCKED',
    ipAddress: string,
    userAgent?: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.logEvent({
      userId,
      action,
      resource: 'authentication',
      ipAddress,
      userAgent,
      details,
    });
  }

  // Log data access events
  async logDataAccess(
    userId: string,
    action: 'READ' | 'CREATE' | 'UPDATE' | 'DELETE',
    resource: string,
    resourceId?: string,
    ipAddress?: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.logEvent({
      userId,
      action: `${action}_${resource.toUpperCase()}`,
      resource,
      resourceId,
      ipAddress,
      details,
    });
  }

  // Log security events
  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    await this.logEvent({
      userId: event.userId || 'system',
      action: `SECURITY_${event.type.toUpperCase()}`,
      resource: 'security',
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      details: {
        severity: event.severity,
        description: event.description,
        ...event.metadata,
      },
    });

    // Cache security events separately for monitoring
    const securityKey = 'security:events';
    const eventData = JSON.stringify({
      ...event,
      timestamp: new Date(),
    });
    
    await redis.lpush(securityKey, eventData);
    await redis.ltrim(securityKey, 0, 499); // Keep last 500 security events
    await redis.expire(securityKey, 86400 * 7); // 7 days
  }

  // Log system events
  async logSystemEvent(
    action: string,
    resource: string,
    resourceId?: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.logEvent({
      userId: 'system',
      action: `SYSTEM_${action.toUpperCase()}`,
      resource,
      resourceId,
      details,
    });
  }

  // Get recent audit events from cache
  async getRecentEvents(limit: number = 50): Promise<AuditEvent[]> {
    try {
      const events = await redis.lrange('audit:recent', 0, limit - 1);
      return events.map(event => JSON.parse(event));
    } catch (error) {
      console.error('Failed to get recent audit events:', error);
      return [];
    }
  }

  // Get security events
  async getSecurityEvents(limit: number = 50): Promise<SecurityEvent[]> {
    try {
      const events = await redis.lrange('security:events', 0, limit - 1);
      return events.map(event => JSON.parse(event));
    } catch (error) {
      console.error('Failed to get security events:', error);
      return [];
    }
  }

  // Get audit statistics
  async getAuditStatistics(dateFrom?: Date, dateTo?: Date): Promise<{
    totalEvents: number;
    eventsByAction: Record<string, number>;
    eventsByResource: Record<string, number>;
    eventsByUser: Record<string, number>;
    eventsByHour: Array<{ hour: string; count: number }>;
    securityEventsBySeverity: Record<string, number>;
  }> {
    try {
      let conditions = [];

      if (dateFrom) {
        conditions.push(gte(auditLogs.timestamp, dateFrom));
      }

      if (dateTo) {
        conditions.push(lte(auditLogs.timestamp, dateTo));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Get total events
      const totalResult = await db
        .select({ count: sql`count(*)` })
        .from(auditLogs)
        .where(whereClause);
      
      const totalEvents = Number(totalResult[0]?.count || 0);

      // Get events by action
      const actionResults = await db
        .select({
          action: auditLogs.action,
          count: sql`count(*)`,
        })
        .from(auditLogs)
        .where(whereClause)
        .groupBy(auditLogs.action)
        .orderBy(sql`count(*) DESC`);

      // Get events by resource
      const resourceResults = await db
        .select({
          resource: auditLogs.resource,
          count: sql`count(*)`,
        })
        .from(auditLogs)
        .where(whereClause)
        .groupBy(auditLogs.resource)
        .orderBy(sql`count(*) DESC`);

      // Get events by user
      const userResults = await db
        .select({
          userId: auditLogs.userId,
          count: sql`count(*)`,
        })
        .from(auditLogs)
        .where(whereClause)
        .groupBy(auditLogs.userId)
        .orderBy(sql`count(*) DESC`)
        .limit(10);

      // Get events by hour
      const hourResults = await db
        .select({
          hour: sql`date_trunc('hour', ${auditLogs.timestamp})`,
          count: sql`count(*)`,
        })
        .from(auditLogs)
        .where(whereClause)
        .groupBy(sql`date_trunc('hour', ${auditLogs.timestamp})`)
        .orderBy(sql`date_trunc('hour', ${auditLogs.timestamp}) DESC`)
        .limit(24);

      // Get security events from cache
      const securityEvents = await this.getSecurityEvents(1000);
      const securityEventsBySeverity = securityEvents.reduce((acc, event) => {
        acc[event.severity] = (acc[event.severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalEvents,
        eventsByAction: actionResults.reduce((acc, row) => {
          acc[row.action] = Number(row.count);
          return acc;
        }, {} as Record<string, number>),
        eventsByResource: resourceResults.reduce((acc, row) => {
          acc[row.resource] = Number(row.count);
          return acc;
        }, {} as Record<string, number>),
        eventsByUser: userResults.reduce((acc, row) => {
          acc[row.userId] = Number(row.count);
          return acc;
        }, {} as Record<string, number>),
        eventsByHour: hourResults.map(row => ({
          hour: row.hour as string,
          count: Number(row.count),
        })),
        securityEventsBySeverity,
      };

    } catch (error) {
      console.error('Failed to get audit statistics:', error);
      return {
        totalEvents: 0,
        eventsByAction: {},
        eventsByResource: {},
        eventsByUser: {},
        eventsByHour: [],
        securityEventsBySeverity: {},
      };
    }
  }

  // Generate audit report
  async generateAuditReport(
    dateFrom: Date,
    dateTo: Date,
    format: 'json' | 'csv' = 'json'
  ): Promise<{
    summary: any;
    events: any[];
    format: string;
  }> {
    try {
      const [statistics, logs] = await Promise.all([
        this.getAuditStatistics(dateFrom, dateTo),
        this.queryLogs({
          dateFrom,
          dateTo,
          limit: 10000,
        }),
      ]);

      const report = {
        summary: {
          ...statistics,
          reportPeriod: {
            from: dateFrom.toISOString(),
            to: dateTo.toISOString(),
          },
          generatedAt: new Date().toISOString(),
        },
        events: logs.logs,
        format,
      };

      if (format === 'csv') {
        // Convert to CSV format
        const csvHeaders = 'Timestamp,User ID,Action,Resource,Resource ID,IP Address,Details\n';
        const csvRows = logs.logs.map(log => 
          [
            log.timestamp.toISOString(),
            log.userId,
            log.action,
            log.resource,
            log.resourceId || '',
            log.ipAddress || '',
            JSON.stringify(log.details || {}).replace(/"/g, '""'),
          ].join(',')
        ).join('\n');
        
        return {
          ...report,
          events: csvHeaders + csvRows,
        };
      }

      return report;

    } catch (error) {
      console.error('Failed to generate audit report:', error);
      throw error;
    }
  }

  // Clean old audit logs
  async cleanOldLogs(retentionDays: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const result = await db
        .delete(auditLogs)
        .where(lte(auditLogs.timestamp, cutoffDate));

      console.log(`Cleaned ${result.rowCount || 0} old audit logs`);
      return result.rowCount || 0;

    } catch (error) {
      console.error('Failed to clean old audit logs:', error);
      return 0;
    }
  }

  // Get compliance report
  async getComplianceReport(
    dateFrom: Date,
    dateTo: Date
  ): Promise<{
    totalDataAccess: number;
    privilegedOperations: number;
    failedLogins: number;
    dataModifications: number;
    adminActivities: number;
    complianceScore: number;
    recommendations: string[];
  }> {
    try {
      const logs = await this.queryLogs({
        dateFrom,
        dateTo,
        limit: 50000,
      });

      const events = logs.logs;
      
      const totalDataAccess = events.filter(e => 
        e.action.includes('READ') || 
        e.action.includes('ACCESS')
      ).length;

      const privilegedOperations = events.filter(e => 
        e.action.includes('DELETE') || 
        e.action.includes('ADMIN') ||
        e.action.includes('SYSTEM')
      ).length;

      const failedLogins = events.filter(e => 
        e.action === 'LOGIN_FAILED'
      ).length;

      const dataModifications = events.filter(e => 
        e.action.includes('CREATE') || 
        e.action.includes('UPDATE') ||
        e.action.includes('DELETE')
      ).length;

      const adminActivities = events.filter(e => 
        e.action.includes('ADMIN')
      ).length;

      // Calculate compliance score (0-100)
      let complianceScore = 100;
      const recommendations: string[] = [];

      // Check for excessive failed logins
      if (failedLogins > totalDataAccess * 0.1) {
        complianceScore -= 20;
        recommendations.push('High number of failed login attempts detected. Review authentication security.');
      }

      // Check for untracked privileged operations
      if (privilegedOperations === 0 && adminActivities > 0) {
        complianceScore -= 15;
        recommendations.push('Privileged operations may not be properly logged.');
      }

      // Check for data modification patterns
      if (dataModifications > totalDataAccess * 2) {
        complianceScore -= 10;
        recommendations.push('High ratio of data modifications to reads. Review data change policies.');
      }

      if (totalDataAccess === 0) {
        complianceScore -= 30;
        recommendations.push('No data access events logged. Verify audit logging is working correctly.');
      }

      return {
        totalDataAccess,
        privilegedOperations,
        failedLogins,
        dataModifications,
        adminActivities,
        complianceScore: Math.max(0, complianceScore),
        recommendations,
      };

    } catch (error) {
      console.error('Failed to generate compliance report:', error);
      return {
        totalDataAccess: 0,
        privilegedOperations: 0,
        failedLogins: 0,
        dataModifications: 0,
        adminActivities: 0,
        complianceScore: 0,
        recommendations: ['Failed to generate compliance report'],
      };
    }
  }
}

// Application logger for structured logging
export class ApplicationLogger {
  private static logLevel: 'debug' | 'info' | 'warn' | 'error' = 'info';

  static setLogLevel(level: 'debug' | 'info' | 'warn' | 'error'): void {
    this.logLevel = level;
  }

  private static shouldLog(level: string): boolean {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    return levels[level as keyof typeof levels] >= levels[this.logLevel];
  }

  static debug(message: string, metadata?: Record<string, any>): void {
    if (!this.shouldLog('debug')) return;
    
    console.debug(JSON.stringify({
      level: 'debug',
      message,
      timestamp: new Date().toISOString(),
      ...metadata,
    }));
  }

  static info(message: string, metadata?: Record<string, any>): void {
    if (!this.shouldLog('info')) return;
    
    console.info(JSON.stringify({
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      ...metadata,
    }));
  }

  static warn(message: string, metadata?: Record<string, any>): void {
    if (!this.shouldLog('warn')) return;
    
    console.warn(JSON.stringify({
      level: 'warn',
      message,
      timestamp: new Date().toISOString(),
      ...metadata,
    }));
  }

  static error(message: string, error?: Error, metadata?: Record<string, any>): void {
    if (!this.shouldLog('error')) return;
    
    console.error(JSON.stringify({
      level: 'error',
      message,
      timestamp: new Date().toISOString(),
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
      ...metadata,
    }));
  }

  // Log with context (user, request, etc.)
  static logWithContext(
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    context: {
      userId?: string;
      requestId?: string;
      action?: string;
      resource?: string;
    },
    error?: Error,
    metadata?: Record<string, any>
  ): void {
    const logData = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
      ...metadata,
    };

    console[level](JSON.stringify(logData));
  }
}

// Export singleton instance
export const auditLogger = AuditLogger.getInstance();
export { ApplicationLogger };