// Edge Runtime compatible metrics collection
// This is a simplified version that doesn't use Node.js APIs

interface RequestMetric {
  method: string;
  pathname: string;
  statusCode: number;
  responseTime: number;
  userId?: string;
  timestamp: number;
}

class EdgeMetricsCollector {
  private requestQueue: RequestMetric[] = [];
  private readonly MAX_QUEUE_SIZE = 1000;

  async trackRequest(
    method: string,
    pathname: string,
    statusCode: number,
    responseTime: number,
    userId?: string
  ): Promise<void> {
    const metric: RequestMetric = {
      method,
      pathname,
      statusCode,
      responseTime,
      userId,
      timestamp: Date.now(),
    };

    // Add to queue
    this.requestQueue.push(metric);

    // Keep queue size manageable
    if (this.requestQueue.length > this.MAX_QUEUE_SIZE) {
      this.requestQueue = this.requestQueue.slice(-this.MAX_QUEUE_SIZE);
    }

    // In a real implementation, you might:
    // 1. Send metrics to an external service (e.g., DataDog, New Relic)
    // 2. Store in a database via an API call
    // 3. Log to external logging service
    
    console.log(`[METRICS] ${method} ${pathname} - ${statusCode} (${responseTime}ms)`);
  }

  async trackActiveUser(userId: string): Promise<void> {
    // Track active user - in Edge Runtime we can't use Redis directly
    // This would typically be sent to an external service or API endpoint
    console.log(`[METRICS] Active user: ${userId}`);
  }

  getMetrics(): RequestMetric[] {
    return [...this.requestQueue];
  }

  clearMetrics(): void {
    this.requestQueue = [];
  }
}

export const edgeMetricsCollector = new EdgeMetricsCollector();