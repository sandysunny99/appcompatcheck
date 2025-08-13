import { Integration, IntegrationConfig, SyncResult, WebhookPayload } from './types';

/**
 * Base class for all integration implementations
 */
export abstract class BaseIntegration {
  protected integration: Integration;
  protected config: IntegrationConfig;

  constructor(integration: Integration) {
    this.integration = integration;
    this.config = integration.config;
  }

  /**
   * Test the integration connection and configuration
   */
  abstract testConnection(): Promise<boolean>;

  /**
   * Sync data from the external service
   */
  abstract sync(): Promise<SyncResult>;

  /**
   * Handle incoming webhook from the external service
   */
  abstract handleWebhook(payload: WebhookPayload): Promise<void>;

  /**
   * Get the webhook URL for this integration
   */
  getWebhookUrl(): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return `${baseUrl}/api/webhooks/integrations/${this.integration.id}`;
  }

  /**
   * Verify webhook signature (if supported by the provider)
   */
  protected verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!this.config.webhookSecret) {
      return true; // Skip verification if no secret is configured
    }

    // This is a basic implementation - each provider may have different signature methods
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', this.config.webhookSecret)
      .update(payload)
      .digest('hex');

    return `sha256=${expectedSignature}` === signature;
  }

  /**
   * Make HTTP request to the external API
   */
  protected async makeRequest(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    url: string,
    data?: any,
    headers: Record<string, string> = {}
  ): Promise<any> {
    const requestHeaders = {
      'Content-Type': 'application/json',
      'User-Agent': 'AppCompatCheck-Integration/1.0',
      ...this.getAuthHeaders(),
      ...headers,
    };

    const requestOptions: RequestInit = {
      method,
      headers: requestHeaders,
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      requestOptions.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, requestOptions);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const responseText = await response.text();
      
      // Try to parse as JSON, return text if parsing fails
      try {
        return responseText ? JSON.parse(responseText) : null;
      } catch {
        return responseText;
      }
    } catch (error) {
      console.error(`Integration ${this.integration.id} request failed:`, error);
      throw error;
    }
  }

  /**
   * Get authentication headers based on the auth type
   */
  protected getAuthHeaders(): Record<string, string> {
    const provider = this.getProvider();
    
    switch (provider?.authType) {
      case 'api_key':
        if (this.config.apiKey) {
          return { 'Authorization': `Bearer ${this.config.apiKey}` };
        }
        break;
        
      case 'token':
        if (this.config.token) {
          return { 'Authorization': `token ${this.config.token}` };
        }
        break;
        
      case 'basic_auth':
        if (this.config.username && (this.config.apiSecret || this.config.token)) {
          const credentials = Buffer.from(
            `${this.config.username}:${this.config.apiSecret || this.config.token}`
          ).toString('base64');
          return { 'Authorization': `Basic ${credentials}` };
        }
        break;
        
      default:
        break;
    }

    return {};
  }

  /**
   * Get the provider configuration for this integration
   */
  protected getProvider() {
    const { getProvider } = require('./providers');
    return getProvider(this.integration.provider);
  }

  /**
   * Log integration activity
   */
  protected async logActivity(
    action: string,
    status: 'success' | 'error' | 'info',
    details?: any
  ): Promise<void> {
    console.log(`[${this.integration.id}] ${action}: ${status}`, details);
    
    // TODO: Store in database for audit trail
    // await db.insert(integrationLogs).values({
    //   integrationId: this.integration.id,
    //   action,
    //   status,
    //   details: JSON.stringify(details),
    //   timestamp: new Date(),
    // });
  }

  /**
   * Update integration status
   */
  protected async updateStatus(
    status: 'active' | 'inactive' | 'error',
    lastSyncAt?: Date
  ): Promise<void> {
    // TODO: Update integration status in database
    // await db.update(integrations)
    //   .set({
    //     status,
    //     lastSyncAt,
    //     updatedAt: new Date(),
    //   })
    //   .where(eq(integrations.id, this.integration.id));
    
    this.integration.status = status;
    if (lastSyncAt) {
      this.integration.lastSyncAt = lastSyncAt;
    }
    this.integration.updatedAt = new Date();
  }

  /**
   * Get rate limit information (if supported by the provider)
   */
  protected async getRateLimitInfo(): Promise<{
    remaining: number;
    resetAt: Date;
  } | null> {
    // Override in specific integrations if they support rate limit headers
    return null;
  }

  /**
   * Sleep for rate limiting
   */
  protected async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Validate configuration against provider schema
   */
  protected validateConfig(): boolean {
    const provider = this.getProvider();
    if (!provider?.configSchema) {
      return true;
    }

    // TODO: Implement JSON schema validation
    // const Ajv = require('ajv');
    // const ajv = new Ajv();
    // const validate = ajv.compile(provider.configSchema);
    // return validate(this.config);
    
    return true; // Simplified for now
  }

  /**
   * Paginate through API results
   */
  protected async* paginateResults<T>(
    fetchPage: (page: number, pageSize: number) => Promise<{ items: T[]; hasMore: boolean }>,
    pageSize = 100
  ): AsyncGenerator<T, void, unknown> {
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const result = await fetchPage(page, pageSize);
      
      for (const item of result.items) {
        yield item;
      }

      hasMore = result.hasMore;
      page++;
    }
  }

  /**
   * Batch process items with rate limiting
   */
  protected async processBatch<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    batchSize = 10,
    delayMs = 1000
  ): Promise<R[]> {
    const results: R[] = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      
      const batchResults = await Promise.allSettled(
        batch.map(processor)
      );

      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          console.error('Batch processing error:', result.reason);
        }
      }

      // Rate limiting delay between batches
      if (i + batchSize < items.length) {
        await this.sleep(delayMs);
      }
    }

    return results;
  }
}