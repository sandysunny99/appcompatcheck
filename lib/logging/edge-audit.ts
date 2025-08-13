// Edge Runtime compatible audit logging
// This is a simplified version that doesn't use Node.js APIs or database connections

export interface EdgeAuditEvent {
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: number;
}

class EdgeAuditLogger {
  private eventQueue: EdgeAuditEvent[] = [];
  private readonly MAX_QUEUE_SIZE = 1000;

  async logEvent(event: Omit<EdgeAuditEvent, 'timestamp'>): Promise<void> {
    const auditEvent: EdgeAuditEvent = {
      ...event,
      timestamp: Date.now(),
    };

    // Add to queue
    this.eventQueue.push(auditEvent);

    // Keep queue size manageable
    if (this.eventQueue.length > this.MAX_QUEUE_SIZE) {
      this.eventQueue = this.eventQueue.slice(-this.MAX_QUEUE_SIZE);
    }

    // In a real implementation, you might:
    // 1. Send events to an external audit service
    // 2. Store via API call to a backend service
    // 3. Send to external logging service (e.g., Splunk, ELK)
    
    console.log(`[AUDIT] ${event.userId} - ${event.action} on ${event.resource}`);
  }

  getEvents(): EdgeAuditEvent[] {
    return [...this.eventQueue];
  }

  clearEvents(): void {
    this.eventQueue = [];
  }
}

export const edgeAuditLogger = new EdgeAuditLogger();