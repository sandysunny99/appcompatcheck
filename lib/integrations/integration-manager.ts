import { BaseIntegration } from './base-integration';
import { Integration, IntegrationType, SyncResult, WebhookPayload } from './types';
import { getProvider } from './providers';

// Integration implementations
import { GitHubIntegration } from './implementations/github-integration';
import { SnykIntegration } from './implementations/snyk-integration';
import { JiraIntegration } from './implementations/jira-integration';

export class IntegrationManager {
  private static instance: IntegrationManager;
  private integrations: Map<string, BaseIntegration> = new Map();

  static getInstance(): IntegrationManager {
    if (!IntegrationManager.instance) {
      IntegrationManager.instance = new IntegrationManager();
    }
    return IntegrationManager.instance;
  }

  /**
   * Initialize an integration instance
   */
  initializeIntegration(integration: Integration): BaseIntegration {
    const provider = getProvider(integration.provider);
    if (!provider) {
      throw new Error(`Unknown integration provider: ${integration.provider}`);
    }

    let integrationInstance: BaseIntegration;

    switch (integration.provider) {
      case 'github':
      case 'github_actions':
        integrationInstance = new GitHubIntegration(integration);
        break;
        
      case 'snyk':
        integrationInstance = new SnykIntegration(integration);
        break;
        
      case 'jira':
        integrationInstance = new JiraIntegration(integration);
        break;
        
      // Add more integrations here
      default:
        throw new Error(`Integration provider ${integration.provider} not implemented`);
    }

    this.integrations.set(integration.id, integrationInstance);
    return integrationInstance;
  }

  /**
   * Get an initialized integration instance
   */
  getIntegration(integrationId: string): BaseIntegration | undefined {
    return this.integrations.get(integrationId);
  }

  /**
   * Test connection for an integration
   */
  async testIntegration(integration: Integration): Promise<boolean> {
    try {
      const instance = this.initializeIntegration(integration);
      return await instance.testConnection();
    } catch (error) {
      console.error(`Failed to test integration ${integration.id}:`, error);
      return false;
    }
  }

  /**
   * Sync data for a specific integration
   */
  async syncIntegration(integrationId: string): Promise<SyncResult> {
    const integration = this.integrations.get(integrationId);
    if (!integration) {
      throw new Error(`Integration ${integrationId} not found`);
    }

    return await integration.sync();
  }

  /**
   * Sync all active integrations
   */
  async syncAllIntegrations(organizationId?: string): Promise<Map<string, SyncResult>> {
    const results = new Map<string, SyncResult>();

    // TODO: Get all active integrations from database
    // const activeIntegrations = await db.select()
    //   .from(integrations)
    //   .where(
    //     and(
    //       eq(integrations.status, 'active'),
    //       organizationId ? eq(integrations.organizationId, organizationId) : undefined
    //     )
    //   );

    // For now, sync all currently loaded integrations
    for (const [integrationId, integration] of this.integrations) {
      try {
        const result = await integration.sync();
        results.set(integrationId, result);
      } catch (error) {
        console.error(`Failed to sync integration ${integrationId}:`, error);
        results.set(integrationId, {
          success: false,
          itemsProcessed: 0,
          itemsCreated: 0,
          itemsUpdated: 0,
          itemsSkipped: 0,
          errors: [error.message],
          lastSyncAt: new Date(),
        });
      }
    }

    return results;
  }

  /**
   * Handle webhook for a specific integration
   */
  async handleWebhook(integrationId: string, payload: WebhookPayload): Promise<void> {
    const integration = this.integrations.get(integrationId);
    if (!integration) {
      throw new Error(`Integration ${integrationId} not found`);
    }

    await integration.handleWebhook(payload);
  }

  /**
   * Get integration statistics
   */
  async getIntegrationStats(integrationId: string): Promise<{
    status: string;
    lastSyncAt?: Date;
    syncCount: number;
    errorCount: number;
    lastError?: string;
  }> {
    // TODO: Get stats from database
    // const stats = await db.select()
    //   .from(integrationLogs)
    //   .where(eq(integrationLogs.integrationId, integrationId))
    //   .orderBy(desc(integrationLogs.timestamp))
    //   .limit(100);

    return {
      status: 'active',
      lastSyncAt: new Date(),
      syncCount: 0,
      errorCount: 0,
    };
  }

  /**
   * Trigger scan through integration
   */
  async triggerScan(
    integrationId: string,
    projectId: string,
    options?: { branch?: string; commit?: string }
  ): Promise<string> {
    const integration = this.integrations.get(integrationId);
    if (!integration) {
      throw new Error(`Integration ${integrationId} not found`);
    }

    // Check if integration supports scan triggering
    if ('triggerScan' in integration && typeof integration.triggerScan === 'function') {
      return await (integration as any).triggerScan(projectId, options);
    }

    throw new Error(`Integration ${integrationId} does not support scan triggering`);
  }

  /**
   * Create ticket through integration
   */
  async createTicket(
    integrationId: string,
    template: {
      title: string;
      description: string;
      priority: 'low' | 'medium' | 'high' | 'critical';
      labels?: string[];
      assignee?: string;
    }
  ): Promise<{ externalId: string; url: string }> {
    const integration = this.integrations.get(integrationId);
    if (!integration) {
      throw new Error(`Integration ${integrationId} not found`);
    }

    // Check if integration supports ticket creation
    if ('createTicket' in integration && typeof integration.createTicket === 'function') {
      return await (integration as any).createTicket(template);
    }

    throw new Error(`Integration ${integrationId} does not support ticket creation`);
  }

  /**
   * Auto-create tickets for critical vulnerabilities
   */
  async autoCreateVulnerabilityTickets(
    organizationId: string,
    vulnerabilities: Array<{
      id: string;
      title: string;
      description: string;
      severity: string;
      file?: string;
      cvssScore?: number;
      cveId?: string;
    }>
  ): Promise<void> {
    // TODO: Get ticketing integrations for the organization
    // const ticketingIntegrations = await db.select()
    //   .from(integrations)
    //   .where(
    //     and(
    //       eq(integrations.organizationId, organizationId),
    //       eq(integrations.type, 'ticketing_system'),
    //       eq(integrations.status, 'active')
    //     )
    //   );

    // Filter critical vulnerabilities
    const criticalVulns = vulnerabilities.filter(v => 
      v.severity === 'critical' || v.severity === 'high'
    );

    for (const vuln of criticalVulns) {
      // Create tickets in all configured ticketing systems
      for (const [integrationId, integration] of this.integrations) {
        if ('createVulnerabilityTicket' in integration) {
          try {
            await (integration as any).createVulnerabilityTicket(vuln);
          } catch (error) {
            console.error(
              `Failed to create ticket in ${integrationId} for vulnerability ${vuln.id}:`,
              error
            );
          }
        }
      }
    }
  }

  /**
   * Get webhook URLs for all integrations
   */
  getWebhookUrls(organizationId: string): Map<string, string> {
    const webhookUrls = new Map<string, string>();
    
    for (const [integrationId, integration] of this.integrations) {
      webhookUrls.set(integrationId, integration.getWebhookUrl());
    }

    return webhookUrls;
  }

  /**
   * Validate integration configuration
   */
  validateIntegrationConfig(
    providerId: string,
    config: any
  ): { valid: boolean; errors: string[] } {
    const provider = getProvider(providerId);
    if (!provider) {
      return { valid: false, errors: ['Unknown provider'] };
    }

    // TODO: Implement JSON schema validation
    // const Ajv = require('ajv');
    // const ajv = new Ajv();
    // const validate = ajv.compile(provider.configSchema);
    // const valid = validate(config);
    
    // if (!valid) {
    //   return { valid: false, errors: validate.errors?.map(e => e.message) || [] };
    // }

    return { valid: true, errors: [] };
  }

  /**
   * Schedule automatic syncs for all integrations
   */
  startScheduledSyncs(): void {
    // TODO: Implement scheduled sync using cron jobs or similar
    console.log('Starting scheduled integration syncs...');
    
    // Example: Sync every hour
    setInterval(async () => {
      try {
        await this.syncAllIntegrations();
      } catch (error) {
        console.error('Scheduled sync failed:', error);
      }
    }, 60 * 60 * 1000); // 1 hour
  }

  /**
   * Stop all scheduled syncs
   */
  stopScheduledSyncs(): void {
    // TODO: Implement cleanup for scheduled jobs
    console.log('Stopping scheduled integration syncs...');
  }

  /**
   * Clear integration cache
   */
  clearCache(): void {
    this.integrations.clear();
  }

  /**
   * Get all loaded integrations
   */
  getLoadedIntegrations(): Map<string, BaseIntegration> {
    return new Map(this.integrations);
  }
}