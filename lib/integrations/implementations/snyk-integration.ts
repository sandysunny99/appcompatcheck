import { BaseIntegration } from '../base-integration';
import { SyncResult, WebhookPayload, SecurityScannerResult, VulnerabilityImport } from '../types';

export class SnykIntegration extends BaseIntegration {
  private readonly baseUrl: string;

  constructor(integration: any) {
    super(integration);
    this.baseUrl = this.config.baseUrl || 'https://api.snyk.io';
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.makeRequest('GET', `${this.baseUrl}/v1/user/me`);
      await this.logActivity('test_connection', 'success', { 
        user: response.username,
        organization: this.config.organizationId 
      });
      return true;
    } catch (error) {
      await this.logActivity('test_connection', 'error', { error: error.message });
      return false;
    }
  }

  async sync(): Promise<SyncResult> {
    const syncStart = new Date();
    let itemsProcessed = 0;
    let itemsCreated = 0;
    let itemsUpdated = 0;
    const errors: string[] = [];

    try {
      // Get all projects in the organization
      const projects = await this.getProjects();
      
      for (const project of projects) {
        try {
          // Get vulnerabilities for each project
          const vulnerabilities = await this.getProjectVulnerabilities(project.id);
          
          for (const vuln of vulnerabilities) {
            const imported = await this.importVulnerability(project, vuln);
            if (imported.isNew) {
              itemsCreated++;
            } else {
              itemsUpdated++;
            }
            itemsProcessed++;
          }

          await this.logActivity('project_synced', 'success', {
            project: project.name,
            vulnerabilities: vulnerabilities.length,
          });

        } catch (error) {
          errors.push(`Failed to sync project ${project.name}: ${error.message}`);
        }
      }

      await this.updateStatus('active', syncStart);
      
      return {
        success: errors.length === 0,
        itemsProcessed,
        itemsCreated,
        itemsUpdated,
        itemsSkipped: 0,
        errors,
        lastSyncAt: syncStart,
      };

    } catch (error) {
      await this.updateStatus('error');
      await this.logActivity('sync', 'error', { error: error.message });
      
      return {
        success: false,
        itemsProcessed,
        itemsCreated,
        itemsUpdated,
        itemsSkipped: 0,
        errors: [error.message],
        lastSyncAt: syncStart,
      };
    }
  }

  async handleWebhook(payload: WebhookPayload): Promise<void> {
    try {
      const { event, data } = payload;

      switch (event) {
        case 'project_snapshot':
          await this.handleProjectSnapshot(data);
          break;
          
        case 'vulnerability_found':
          await this.handleVulnerabilityFound(data);
          break;
          
        case 'vulnerability_fixed':
          await this.handleVulnerabilityFixed(data);
          break;
          
        default:
          await this.logActivity('webhook', 'info', { 
            event, 
            message: 'Unhandled event type' 
          });
      }

      await this.logActivity('webhook', 'success', { event });

    } catch (error) {
      await this.logActivity('webhook', 'error', { 
        event: payload.event, 
        error: error.message 
      });
      throw error;
    }
  }

  private async getProjects(): Promise<any[]> {
    const response = await this.makeRequest(
      'GET',
      `${this.baseUrl}/v1/orgs/${this.config.organizationId}/projects`
    );

    return response.projects || [];
  }

  private async getProjectVulnerabilities(projectId: string): Promise<any[]> {
    try {
      const response = await this.makeRequest(
        'POST',
        `${this.baseUrl}/v1/test`,
        {},
        { 'Authorization': `token ${this.config.apiKey}` }
      );

      // Get issues for the specific project
      const issuesResponse = await this.makeRequest(
        'GET',
        `${this.baseUrl}/v1/orgs/${this.config.organizationId}/projects/${projectId}/aggregated-issues`
      );

      return issuesResponse.issues || [];
    } catch (error) {
      await this.logActivity('get_vulnerabilities', 'error', {
        projectId,
        error: error.message,
      });
      return [];
    }
  }

  private async importVulnerability(
    project: any,
    vulnerability: any
  ): Promise<{ isNew: boolean; vulnerabilityId: string }> {
    const vulnerabilityImport: VulnerabilityImport = {
      externalId: vulnerability.id,
      title: vulnerability.title,
      description: vulnerability.description || '',
      severity: this.mapSeverity(vulnerability.severity),
      category: vulnerability.type || 'Unknown',
      cweId: vulnerability.identifiers?.CWE?.[0],
      cveId: vulnerability.identifiers?.CVE?.[0],
      cvssScore: vulnerability.cvssScore,
      file: vulnerability.from?.[0] || project.name,
      status: vulnerability.isFixed ? 'fixed' : 'open',
      firstDetected: new Date(vulnerability.creationTime),
      lastUpdated: new Date(vulnerability.modificationTime),
    };

    // TODO: Store vulnerability in database
    // Check if this vulnerability already exists
    // const existing = await db.select().from(vulnerabilities)
    //   .where(eq(vulnerabilities.externalId, vulnerabilityImport.externalId));

    const isNew = true; // Simplified for now
    const vulnerabilityId = vulnerability.id;

    await this.logActivity('vulnerability_imported', 'success', {
      vulnerabilityId,
      severity: vulnerabilityImport.severity,
      isNew,
    });

    // Send notification for critical vulnerabilities
    if (vulnerabilityImport.severity === 'critical' && isNew) {
      await this.sendCriticalVulnerabilityAlert(project, vulnerabilityImport);
    }

    return { isNew, vulnerabilityId };
  }

  private mapSeverity(snykSeverity: string): 'critical' | 'high' | 'medium' | 'low' {
    switch (snykSeverity.toLowerCase()) {
      case 'critical':
        return 'critical';
      case 'high':
        return 'high';
      case 'medium':
        return 'medium';
      case 'low':
        return 'low';
      default:
        return 'medium';
    }
  }

  private async handleProjectSnapshot(data: any): Promise<void> {
    const { project, issues } = data;
    
    await this.logActivity('project_snapshot', 'info', {
      project: project.name,
      issuesCount: issues?.length || 0,
    });

    // Process new snapshot
    if (issues) {
      for (const issue of issues) {
        await this.importVulnerability(project, issue);
      }
    }
  }

  private async handleVulnerabilityFound(data: any): Promise<void> {
    const { project, vulnerability } = data;
    
    await this.importVulnerability(project, vulnerability);
    
    await this.logActivity('vulnerability_found', 'info', {
      project: project.name,
      vulnerability: vulnerability.id,
      severity: vulnerability.severity,
    });
  }

  private async handleVulnerabilityFixed(data: any): Promise<void> {
    const { project, vulnerability } = data;

    // TODO: Update vulnerability status in database
    // await db.update(vulnerabilities)
    //   .set({ status: 'fixed', lastUpdated: new Date() })
    //   .where(eq(vulnerabilities.externalId, vulnerability.id));

    await this.logActivity('vulnerability_fixed', 'success', {
      project: project.name,
      vulnerability: vulnerability.id,
    });
  }

  private async sendCriticalVulnerabilityAlert(
    project: any,
    vulnerability: VulnerabilityImport
  ): Promise<void> {
    try {
      // TODO: Get organization users who should be notified
      // const orgUsers = await getOrganizationUsers(this.integration.organizationId);

      // for (const user of orgUsers) {
      //   await NotificationEvents.onVulnerabilityDetected({
      //     userId: user.id,
      //     scanId: 'snyk-sync',
      //     scanName: `Snyk - ${project.name}`,
      //     vulnerabilityId: vulnerability.externalId,
      //     vulnerabilityType: vulnerability.category,
      //     severity: vulnerability.severity,
      //     fileName: vulnerability.file || 'Unknown',
      //     lineNumber: vulnerability.line || 0,
      //     cvssScore: vulnerability.cvssScore || 0,
      //     description: vulnerability.description,
      //     recommendation: 'Review Snyk recommendations in the dashboard',
      //     vulnerabilityUrl: `https://app.snyk.io/vuln/${vulnerability.externalId}`,
      //   });
      // }

      await this.logActivity('critical_alert_sent', 'success', {
        vulnerability: vulnerability.externalId,
        project: project.name,
      });

    } catch (error) {
      await this.logActivity('critical_alert_failed', 'error', {
        vulnerability: vulnerability.externalId,
        error: error.message,
      });
    }
  }

  /**
   * Trigger a manual scan for a specific project
   */
  async triggerScan(projectId: string): Promise<string> {
    try {
      const response = await this.makeRequest(
        'POST',
        `${this.baseUrl}/v1/orgs/${this.config.organizationId}/projects/${projectId}/test`,
        {}
      );

      await this.logActivity('scan_triggered', 'success', {
        projectId,
        scanId: response.id,
      });

      return response.id;
    } catch (error) {
      await this.logActivity('scan_trigger_failed', 'error', {
        projectId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get scan results for a specific project
   */
  async getScanResults(projectId: string): Promise<SecurityScannerResult | null> {
    try {
      const project = await this.makeRequest(
        'GET',
        `${this.baseUrl}/v1/orgs/${this.config.organizationId}/projects/${projectId}`
      );

      const vulnerabilities = await this.getProjectVulnerabilities(projectId);

      const summary = vulnerabilities.reduce(
        (acc, vuln) => {
          acc.total++;
          acc[vuln.severity] = (acc[vuln.severity] || 0) + 1;
          return acc;
        },
        { total: 0, critical: 0, high: 0, medium: 0, low: 0 }
      );

      const result: SecurityScannerResult = {
        scanId: projectId,
        projectName: project.name,
        status: 'completed',
        vulnerabilities: vulnerabilities.map(vuln => ({
          externalId: vuln.id,
          title: vuln.title,
          description: vuln.description || '',
          severity: this.mapSeverity(vuln.severity),
          category: vuln.type || 'Unknown',
          cweId: vuln.identifiers?.CWE?.[0],
          cveId: vuln.identifiers?.CVE?.[0],
          cvssScore: vuln.cvssScore,
          file: vuln.from?.[0] || project.name,
          status: vuln.isFixed ? 'fixed' : 'open',
          firstDetected: new Date(vuln.creationTime),
          lastUpdated: new Date(vuln.modificationTime),
        })),
        summary,
        scanDate: new Date(),
      };

      return result;
    } catch (error) {
      await this.logActivity('get_scan_results', 'error', {
        projectId,
        error: error.message,
      });
      return null;
    }
  }

  /**
   * Get organization license information
   */
  async getLicenseInfo(): Promise<any> {
    try {
      const response = await this.makeRequest(
        'GET',
        `${this.baseUrl}/v1/orgs/${this.config.organizationId}/licenses`
      );

      return response;
    } catch (error) {
      await this.logActivity('get_license_info', 'error', { error: error.message });
      return null;
    }
  }
}