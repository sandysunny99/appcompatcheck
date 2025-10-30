import { db } from '@/lib/db/drizzle';
import { activityLogs } from '@/lib/db/schema';
import { redis } from '@/lib/redis/client';
import { DatabaseHealthMonitor } from '@/lib/performance/database-optimization';
import { eq, desc, and, gte, lte } from 'drizzle-orm';

export interface SystemMetrics {
  timestamp: number;
  cpu: {
    usage: number;
    load: number[];
  };
  memory: {
    used: number;
    free: number;
    total: number;
    percentage: number;
  };
  database: {
    connections: number;
    activeQueries: number;
    slowQueries: number;
    averageResponseTime: number;
  };
  redis: {
    memory: number;
    keys: number;
    hitRate: number;
    evictions: number;
  };
  application: {
    activeUsers: number;
    totalRequests: number;
    errorRate: number;
    averageResponseTime: number;
  };
}

export interface AlertRule {
  name: string;
  metric: keyof SystemMetrics;
  threshold: number;
  comparison: 'gt' | 'lt' | 'eq';
  severity: 'critical' | 'warning' | 'info';
  enabled: boolean;
}

export interface SystemAlert {
  id: string;
  rule: AlertRule;
  value: number;
  timestamp: number;
  acknowledged: boolean;
  message: string;
}

// System monitoring class
export class SystemMonitor {
  private static instance: SystemMonitor;
  private metricsInterval: NodeJS.Timeout | null = null;
  private alertRules: AlertRule[] = [];
  private activeAlerts: Map<string, SystemAlert> = new Map();

  static getInstance(): SystemMonitor {
    if (!SystemMonitor.instance) {
      SystemMonitor.instance = new SystemMonitor();
    }
    return SystemMonitor.instance;
  }

  // Start monitoring with specified interval
  startMonitoring(intervalSeconds: number = 30): void {
    if (this.metricsInterval) {
      this.stopMonitoring();
    }

    this.setupDefaultAlertRules();
    
    this.metricsInterval = setInterval(async () => {
      await this.collectMetrics();
    }, intervalSeconds * 1000);

    console.log(`System monitoring started with ${intervalSeconds}s interval`);
  }

  // Stop monitoring
  stopMonitoring(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
      console.log('System monitoring stopped');
    }
  }

  // Collect system metrics
  private async collectMetrics(): Promise<SystemMetrics> {
    try {
      const [systemStats, dbHealth, redisInfo, appMetrics] = await Promise.all([
        this.getSystemStats(),
        this.getDatabaseMetrics(),
        this.getRedisMetrics(),
        this.getApplicationMetrics(),
      ]);

      const metrics: SystemMetrics = {
        timestamp: Date.now(),
        cpu: systemStats.cpu,
        memory: systemStats.memory,
        database: dbHealth,
        redis: redisInfo,
        application: appMetrics,
      };

      // Store metrics in Redis with TTL
      await this.storeMetrics(metrics);
      
      // Check alert rules
      await this.checkAlerts(metrics);

      return metrics;
    } catch (error) {
      console.error('Failed to collect system metrics:', error);
      throw error;
    }
  }

  // Get system stats (CPU, Memory)
  private async getSystemStats(): Promise<{
    cpu: { usage: number; load: number[] };
    memory: { used: number; free: number; total: number; percentage: number };
  }> {
    // Check if we're in Node.js runtime (not Edge Runtime)
    const isNodeRuntime = typeof process !== 'undefined' && process.memoryUsage && process.cpuUsage;
    
    if (isNodeRuntime) {
      const memoryUsage = process.memoryUsage();
      const totalMemory = 1024 * 1024 * 1024; // 1GB estimate for container
      
      return {
        cpu: {
          usage: process.cpuUsage().user / 1000000, // Convert to seconds
          load: [0.5, 0.7, 0.9], // Mock load averages
        },
        memory: {
          used: memoryUsage.heapUsed,
          free: totalMemory - memoryUsage.heapUsed,
          total: totalMemory,
          percentage: (memoryUsage.heapUsed / totalMemory) * 100,
        },
      };
    }

    // Fallback for Edge Runtime or other environments
    return {
      cpu: {
        usage: Math.random() * 100, // Mock CPU usage
        load: [0.5, 0.7, 0.9],
      },
      memory: {
        used: 512 * 1024 * 1024, // Mock 512MB used
        free: 512 * 1024 * 1024, // Mock 512MB free
        total: 1024 * 1024 * 1024, // Mock 1GB total
        percentage: 50, // Mock 50% usage
      },
    };
  }

  // Get database metrics
  private async getDatabaseMetrics(): Promise<{
    connections: number;
    activeQueries: number;
    slowQueries: number;
    averageResponseTime: number;
  }> {
    try {
      const healthMetrics = await DatabaseHealthMonitor.getHealthMetrics();
      
      return {
        connections: healthMetrics.connectionHealth.total,
        activeQueries: healthMetrics.connectionHealth.active,
        slowQueries: healthMetrics.performanceMetrics.slowQueries,
        averageResponseTime: healthMetrics.performanceMetrics.averageQueryTime,
      };
    } catch (error) {
      console.error('Failed to get database metrics:', error);
      return {
        connections: 0,
        activeQueries: 0,
        slowQueries: 0,
        averageResponseTime: 0,
      };
    }
  }

  // Get Redis metrics
  private async getRedisMetrics(): Promise<{
    memory: number;
    keys: number;
    hitRate: number;
    evictions: number;
  }> {
    try {
      // Get Redis info
      const info = await redis.info('memory');
      const keyspace = await redis.info('keyspace');
      const stats = await redis.info('stats');
      
      // Parse memory info
      const memoryMatch = info.match(/used_memory:(\d+)/);
      const memory = memoryMatch ? parseInt(memoryMatch[1]) : 0;
      
      // Parse keyspace info
      const keysMatch = keyspace.match(/keys=(\d+)/);
      const keys = keysMatch ? parseInt(keysMatch[1]) : 0;
      
      // Parse stats
      const hitsMatch = stats.match(/keyspace_hits:(\d+)/);
      const missesMatch = stats.match(/keyspace_misses:(\d+)/);
      const evictionsMatch = stats.match(/evicted_keys:(\d+)/);
      
      const hits = hitsMatch ? parseInt(hitsMatch[1]) : 0;
      const misses = missesMatch ? parseInt(missesMatch[1]) : 0;
      const evictions = evictionsMatch ? parseInt(evictionsMatch[1]) : 0;
      
      const hitRate = hits + misses > 0 ? (hits / (hits + misses)) * 100 : 0;
      
      return {
        memory,
        keys,
        hitRate,
        evictions,
      };
    } catch (error) {
      console.error('Failed to get Redis metrics:', error);
      return {
        memory: 0,
        keys: 0,
        hitRate: 0,
        evictions: 0,
      };
    }
  }

  // Get application metrics
  private async getApplicationMetrics(): Promise<{
    activeUsers: number;
    totalRequests: number;
    errorRate: number;
    averageResponseTime: number;
  }> {
    try {
      // Get metrics from Redis counters
      const [activeUsers, totalRequests, errorCount, responseTimeSum] = await Promise.all([
        redis.get('metrics:active_users') || '0',
        redis.get('metrics:total_requests') || '0',
        redis.get('metrics:error_count') || '0',
        redis.get('metrics:response_time_sum') || '0',
      ]);

      const totalReq = parseInt(totalRequests);
      const errorCnt = parseInt(errorCount);
      const responseSum = parseFloat(responseTimeSum);
      
      return {
        activeUsers: parseInt(activeUsers),
        totalRequests: totalReq,
        errorRate: totalReq > 0 ? (errorCnt / totalReq) * 100 : 0,
        averageResponseTime: totalReq > 0 ? responseSum / totalReq : 0,
      };
    } catch (error) {
      console.error('Failed to get application metrics:', error);
      return {
        activeUsers: 0,
        totalRequests: 0,
        errorRate: 0,
        averageResponseTime: 0,
      };
    }
  }

  // Store metrics in Redis
  private async storeMetrics(metrics: SystemMetrics): Promise<void> {
    const key = `metrics:${metrics.timestamp}`;
    await redis.setex(key, 3600, JSON.stringify(metrics)); // Store for 1 hour
    
    // Keep a list of recent metrics
    await redis.lpush('metrics:recent', key);
    await redis.ltrim('metrics:recent', 0, 100); // Keep last 100 entries
  }

  // Get recent metrics
  async getRecentMetrics(limit: number = 10): Promise<SystemMetrics[]> {
    try {
      const keys = await redis.lrange('metrics:recent', 0, limit - 1);
      const metrics = await Promise.all(
        keys.map(async (key) => {
          const data = await redis.get(key);
          return data ? JSON.parse(data) : null;
        })
      );
      
      return metrics.filter(m => m !== null);
    } catch (error) {
      console.error('Failed to get recent metrics:', error);
      return [];
    }
  }

  // Setup default alert rules
  private setupDefaultAlertRules(): void {
    this.alertRules = [
      {
        name: 'High CPU Usage',
        metric: 'cpu' as any,
        threshold: 80,
        comparison: 'gt',
        severity: 'warning',
        enabled: true,
      },
      {
        name: 'High Memory Usage',
        metric: 'memory' as any,
        threshold: 85,
        comparison: 'gt',
        severity: 'critical',
        enabled: true,
      },
      {
        name: 'Database Connection Limit',
        metric: 'database' as any,
        threshold: 80,
        comparison: 'gt',
        severity: 'warning',
        enabled: true,
      },
      {
        name: 'High Error Rate',
        metric: 'application' as any,
        threshold: 5,
        comparison: 'gt',
        severity: 'critical',
        enabled: true,
      },
      {
        name: 'Low Redis Hit Rate',
        metric: 'redis' as any,
        threshold: 70,
        comparison: 'lt',
        severity: 'warning',
        enabled: true,
      },
    ];
  }

  // Check alert rules against current metrics
  private async checkAlerts(metrics: SystemMetrics): Promise<void> {
    for (const rule of this.alertRules) {
      if (!rule.enabled) continue;

      let value: number = 0;
      let shouldAlert = false;

      // Extract the relevant metric value
      switch (rule.name) {
        case 'High CPU Usage':
          value = metrics.cpu.usage;
          break;
        case 'High Memory Usage':
          value = metrics.memory.percentage;
          break;
        case 'Database Connection Limit':
          value = metrics.database.connections;
          break;
        case 'High Error Rate':
          value = metrics.application.errorRate;
          break;
        case 'Low Redis Hit Rate':
          value = metrics.redis.hitRate;
          break;
      }

      // Check if alert should be triggered
      switch (rule.comparison) {
        case 'gt':
          shouldAlert = value > rule.threshold;
          break;
        case 'lt':
          shouldAlert = value < rule.threshold;
          break;
        case 'eq':
          shouldAlert = value === rule.threshold;
          break;
      }

      if (shouldAlert) {
        await this.triggerAlert(rule, value, metrics.timestamp);
      } else {
        // Clear alert if it was previously active
        this.clearAlert(rule.name);
      }
    }
  }

  // Trigger an alert
  private async triggerAlert(rule: AlertRule, value: number, timestamp: number): Promise<void> {
    const alertId = `${rule.name}-${timestamp}`;
    
    // Don't create duplicate alerts
    if (this.activeAlerts.has(rule.name)) {
      return;
    }

    const alert: SystemAlert = {
      id: alertId,
      rule,
      value,
      timestamp,
      acknowledged: false,
      message: `Alert: ${rule.name} - Value: ${value.toFixed(2)}, Threshold: ${rule.threshold}`,
    };

    this.activeAlerts.set(rule.name, alert);
    
    // Store alert in Redis
    await redis.setex(
      `alert:${alertId}`,
      3600,
      JSON.stringify(alert)
    );

    // Log the alert
    console.warn(`[${rule.severity.toUpperCase()}] ${alert.message}`);
    
    // You could also send notifications here (email, Slack, etc.)
    await this.sendAlertNotification(alert);
  }

  // Clear an alert
  private clearAlert(ruleName: string): void {
    if (this.activeAlerts.has(ruleName)) {
      const alert = this.activeAlerts.get(ruleName)!;
      this.activeAlerts.delete(ruleName);
      
      console.info(`Alert cleared: ${ruleName}`);
    }
  }

  // Send alert notification (placeholder)
  private async sendAlertNotification(alert: SystemAlert): Promise<void> {
    // This is where you would integrate with notification services
    // For now, we'll just log it
    console.log('Alert notification sent:', {
      severity: alert.rule.severity,
      message: alert.message,
      timestamp: new Date(alert.timestamp).toISOString(),
    });
  }

  // Get active alerts
  getActiveAlerts(): SystemAlert[] {
    return Array.from(this.activeAlerts.values());
  }

  // Acknowledge an alert
  async acknowledgeAlert(alertId: string, userId: string): Promise<void> {
    for (const [key, alert] of this.activeAlerts.entries()) {
      if (alert.id === alertId) {
        alert.acknowledged = true;
        
        // Update in Redis
        await redis.setex(
          `alert:${alertId}`,
          3600,
          JSON.stringify(alert)
        );

        // Log acknowledgment
        await this.logAuditEvent({
          userId,
          action: 'ALERT_ACKNOWLEDGED',
          resource: 'system_alert',
          resourceId: alertId,
          details: { alertName: alert.rule.name },
        });

        console.info(`Alert acknowledged: ${alert.rule.name} by user ${userId}`);
        break;
      }
    }
  }

  // Log audit event
  private async logAuditEvent(event: {
    userId: string;
    action: string;
    resource: string;
    resourceId?: string;
    details?: any;
  }): Promise<void> {
    try {
      await db.insert(activityLogs).values({
        userId: event.userId ? parseInt(event.userId) : null,
        organizationId: null, // Will be filled by app context
        action: event.action,
        entityType: event.resource,
        entityId: event.resourceId ? parseInt(event.resourceId) : null,
        description: event.details ? JSON.stringify(event.details) : null,
        metadata: event.details || null,
        timestamp: new Date(),
        ipAddress: '127.0.0.1', // This would come from request context
        userAgent: 'System Monitor',
      });
    } catch (error) {
      console.error('Failed to log audit event:', error);
    }
  }

  // Get system health summary
  async getHealthSummary(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    score: number;
    alerts: number;
    uptime: number;
    lastCheck: number;
  }> {
    const activeAlerts = this.getActiveAlerts();
    const criticalAlerts = activeAlerts.filter(a => a.rule.severity === 'critical').length;
    const warningAlerts = activeAlerts.filter(a => a.rule.severity === 'warning').length;
    
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    let score = 100;

    if (criticalAlerts > 0) {
      status = 'critical';
      score -= criticalAlerts * 30;
    } else if (warningAlerts > 0) {
      status = 'warning';
      score -= warningAlerts * 10;
    }

    return {
      status,
      score: Math.max(0, score),
      alerts: activeAlerts.length,
      uptime: typeof process !== 'undefined' && process.uptime ? process.uptime() : Date.now() / 1000,
      lastCheck: Date.now(),
    };
  }

  // Add custom alert rule
  addAlertRule(rule: AlertRule): void {
    this.alertRules.push(rule);
    console.log(`Added new alert rule: ${rule.name}`);
  }

  // Remove alert rule
  removeAlertRule(ruleName: string): void {
    this.alertRules = this.alertRules.filter(r => r.name !== ruleName);
    console.log(`Removed alert rule: ${ruleName}`);
  }

  // Get alert rules
  getAlertRules(): AlertRule[] {
    return [...this.alertRules];
  }
}

// Metrics collector for application-level metrics
export class MetricsCollector {
  
  // Track request metrics
  static async trackRequest(
    method: string,
    path: string,
    statusCode: number,
    responseTime: number,
    userId?: string
  ): Promise<void> {
    try {
      // Increment total requests
      await redis.incr('metrics:total_requests');
      
      // Track error count
      if (statusCode >= 400) {
        await redis.incr('metrics:error_count');
      }
      
      // Track response time
      const currentSum = parseFloat(await redis.get('metrics:response_time_sum') || '0');
      await redis.set('metrics:response_time_sum', currentSum + responseTime);
      
      // Track by endpoint
      const endpointKey = `metrics:endpoint:${method}:${path}`;
      await redis.hincrby(endpointKey, 'requests', 1);
      await redis.hincrbyfloat(endpointKey, 'response_time', responseTime);
      
      if (statusCode >= 400) {
        await redis.hincrby(endpointKey, 'errors', 1);
      }
      
      // Set expiry for endpoint metrics
      await redis.expire(endpointKey, 86400); // 24 hours
      
    } catch (error) {
      console.error('Failed to track request metrics:', error);
    }
  }

  // Track active users
  static async trackActiveUser(userId: string): Promise<void> {
    try {
      const key = 'metrics:active_users_set';
      await redis.sadd(key, userId);
      await redis.expire(key, 300); // 5 minutes
      
      const activeCount = await redis.scard(key);
      await redis.set('metrics:active_users', activeCount);
    } catch (error) {
      console.error('Failed to track active user:', error);
    }
  }

  // Get endpoint metrics
  static async getEndpointMetrics(
    method: string,
    path: string
  ): Promise<{
    requests: number;
    errors: number;
    averageResponseTime: number;
    errorRate: number;
  }> {
    try {
      const key = `metrics:endpoint:${method}:${path}`;
      const data = await redis.hgetall(key);
      
      const requests = parseInt(data.requests || '0');
      const errors = parseInt(data.errors || '0');
      const totalResponseTime = parseFloat(data.response_time || '0');
      
      return {
        requests,
        errors,
        averageResponseTime: requests > 0 ? totalResponseTime / requests : 0,
        errorRate: requests > 0 ? (errors / requests) * 100 : 0,
      };
    } catch (error) {
      console.error('Failed to get endpoint metrics:', error);
      return {
        requests: 0,
        errors: 0,
        averageResponseTime: 0,
        errorRate: 0,
      };
    }
  }

  // Reset metrics
  static async resetMetrics(): Promise<void> {
    try {
      await Promise.all([
        redis.del('metrics:total_requests'),
        redis.del('metrics:error_count'),
        redis.del('metrics:response_time_sum'),
        redis.del('metrics:active_users'),
        redis.del('metrics:active_users_set'),
      ]);
      
      console.log('Metrics reset successfully');
    } catch (error) {
      console.error('Failed to reset metrics:', error);
    }
  }
}

export { MetricsCollector };