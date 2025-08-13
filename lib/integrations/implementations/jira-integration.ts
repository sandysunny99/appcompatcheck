import { BaseIntegration } from '../base-integration';
import { SyncResult, WebhookPayload, TicketTemplate, CreatedTicket } from '../types';

export class JiraIntegration extends BaseIntegration {
  private readonly baseUrl: string;

  constructor(integration: any) {
    super(integration);
    this.baseUrl = this.config.baseUrl;
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.makeRequest('GET', `${this.baseUrl}/rest/api/3/myself`);
      await this.logActivity('test_connection', 'success', { 
        user: response.displayName,
        accountId: response.accountId 
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
      // Sync projects
      const projects = await this.getProjects();
      
      for (const project of projects) {
        try {
          await this.syncProject(project);
          itemsProcessed++;
          itemsCreated++; // Simplified
        } catch (error) {
          errors.push(`Failed to sync project ${project.name}: ${error.message}`);
        }
      }

      // Sync issue types and fields for ticket creation
      await this.syncIssueTypes();
      await this.syncCustomFields();

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
        case 'jira:issue_created':
          await this.handleIssueCreated(data);
          break;
          
        case 'jira:issue_updated':
          await this.handleIssueUpdated(data);
          break;
          
        case 'jira:issue_deleted':
          await this.handleIssueDeleted(data);
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

  /**
   * Create a ticket in Jira
   */
  async createTicket(template: TicketTemplate): Promise<CreatedTicket> {
    try {
      const projectKey = this.config.projectKey;
      if (!projectKey) {
        throw new Error('Project key is required for ticket creation');
      }

      const issueData = {
        fields: {
          project: { key: projectKey },
          summary: template.title,
          description: {
            type: 'doc',
            version: 1,
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: template.description,
                  },
                ],
              },
            ],
          },
          issuetype: { name: 'Bug' }, // Default to Bug, could be configurable
          priority: { name: this.mapPriority(template.priority) },
          labels: template.labels || [],
          ...(template.assignee && { assignee: { name: template.assignee } }),
          ...template.customFields,
        },
      };

      const response = await this.makeRequest(
        'POST',
        `${this.baseUrl}/rest/api/3/issue`,
        issueData
      );

      const ticket: CreatedTicket = {
        externalId: response.key,
        url: `${this.baseUrl.replace('/rest/api/3', '')}/browse/${response.key}`,
        status: 'Open',
        createdAt: new Date(),
      };

      await this.logActivity('ticket_created', 'success', {
        ticketKey: response.key,
        title: template.title,
        priority: template.priority,
      });

      return ticket;

    } catch (error) {
      await this.logActivity('ticket_creation_failed', 'error', {
        title: template.title,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Update ticket status
   */
  async updateTicketStatus(
    ticketKey: string,
    status: string,
    comment?: string
  ): Promise<void> {
    try {
      // Get available transitions
      const transitionsResponse = await this.makeRequest(
        'GET',
        `${this.baseUrl}/rest/api/3/issue/${ticketKey}/transitions`
      );

      const transition = transitionsResponse.transitions.find(
        (t: any) => t.name.toLowerCase() === status.toLowerCase()
      );

      if (!transition) {
        throw new Error(`Invalid transition: ${status}`);
      }

      const transitionData: any = {
        transition: { id: transition.id },
      };

      // Add comment if provided
      if (comment) {
        transitionData.update = {
          comment: [
            {
              add: {
                body: {
                  type: 'doc',
                  version: 1,
                  content: [
                    {
                      type: 'paragraph',
                      content: [{ type: 'text', text: comment }],
                    },
                  ],
                },
              },
            },
          ],
        };
      }

      await this.makeRequest(
        'POST',
        `${this.baseUrl}/rest/api/3/issue/${ticketKey}/transitions`,
        transitionData
      );

      await this.logActivity('ticket_updated', 'success', {
        ticketKey,
        status,
        hasComment: !!comment,
      });

    } catch (error) {
      await this.logActivity('ticket_update_failed', 'error', {
        ticketKey,
        status,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Add comment to ticket
   */
  async addComment(ticketKey: string, comment: string): Promise<void> {
    try {
      const commentData = {
        body: {
          type: 'doc',
          version: 1,
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: comment }],
            },
          ],
        },
      };

      await this.makeRequest(
        'POST',
        `${this.baseUrl}/rest/api/3/issue/${ticketKey}/comment`,
        commentData
      );

      await this.logActivity('comment_added', 'success', { ticketKey });

    } catch (error) {
      await this.logActivity('comment_add_failed', 'error', {
        ticketKey,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Create ticket for vulnerability
   */
  async createVulnerabilityTicket(vulnerability: {
    id: string;
    title: string;
    description: string;
    severity: string;
    file?: string;
    cvssScore?: number;
    cveId?: string;
  }): Promise<CreatedTicket> {
    const template: TicketTemplate = {
      title: `Security Vulnerability: ${vulnerability.title}`,
      description: this.formatVulnerabilityDescription(vulnerability),
      priority: this.mapSeverityToPriority(vulnerability.severity),
      labels: ['security', 'vulnerability', vulnerability.severity],
      customFields: {
        // Add custom fields if configured
        ...(vulnerability.cvssScore && { 
          customfield_10000: vulnerability.cvssScore.toString() 
        }),
        ...(vulnerability.cveId && { 
          customfield_10001: vulnerability.cveId 
        }),
      },
    };

    return await this.createTicket(template);
  }

  private async getProjects(): Promise<any[]> {
    const response = await this.makeRequest(
      'GET',
      `${this.baseUrl}/rest/api/3/project/search`
    );

    return response.values || [];
  }

  private async syncProject(project: any): Promise<void> {
    // TODO: Store project information in database
    await this.logActivity('project_synced', 'info', {
      project: project.name,
      key: project.key,
      type: project.projectTypeKey,
    });
  }

  private async syncIssueTypes(): Promise<void> {
    try {
      const response = await this.makeRequest(
        'GET',
        `${this.baseUrl}/rest/api/3/issuetype`
      );

      await this.logActivity('issue_types_synced', 'info', {
        count: response.length,
      });
    } catch (error) {
      await this.logActivity('issue_types_sync_failed', 'error', {
        error: error.message,
      });
    }
  }

  private async syncCustomFields(): Promise<void> {
    try {
      const response = await this.makeRequest(
        'GET',
        `${this.baseUrl}/rest/api/3/field`
      );

      const customFields = response.filter((field: any) => field.custom);

      await this.logActivity('custom_fields_synced', 'info', {
        count: customFields.length,
      });
    } catch (error) {
      await this.logActivity('custom_fields_sync_failed', 'error', {
        error: error.message,
      });
    }
  }

  private async handleIssueCreated(data: any): Promise<void> {
    const issue = data.issue;
    
    await this.logActivity('issue_created', 'info', {
      issueKey: issue.key,
      summary: issue.fields.summary,
      creator: issue.fields.creator?.displayName,
    });

    // TODO: Store or process the created issue
  }

  private async handleIssueUpdated(data: any): Promise<void> {
    const issue = data.issue;
    const changelog = data.changelog;

    await this.logActivity('issue_updated', 'info', {
      issueKey: issue.key,
      changes: changelog?.items?.length || 0,
    });

    // TODO: Process issue updates
  }

  private async handleIssueDeleted(data: any): Promise<void> {
    const issue = data.issue;

    await this.logActivity('issue_deleted', 'info', {
      issueKey: issue.key,
    });

    // TODO: Handle issue deletion
  }

  private mapPriority(priority: 'low' | 'medium' | 'high' | 'critical'): string {
    switch (priority) {
      case 'critical':
        return 'Highest';
      case 'high':
        return 'High';
      case 'medium':
        return 'Medium';
      case 'low':
        return 'Low';
      default:
        return 'Medium';
    }
  }

  private mapSeverityToPriority(
    severity: string
  ): 'low' | 'medium' | 'high' | 'critical' {
    switch (severity.toLowerCase()) {
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

  private formatVulnerabilityDescription(vulnerability: {
    id: string;
    description: string;
    file?: string;
    cvssScore?: number;
    cveId?: string;
  }): string {
    let description = `Vulnerability Details:\n\n`;
    description += `ID: ${vulnerability.id}\n`;
    description += `Description: ${vulnerability.description}\n`;
    
    if (vulnerability.file) {
      description += `File: ${vulnerability.file}\n`;
    }
    
    if (vulnerability.cvssScore) {
      description += `CVSS Score: ${vulnerability.cvssScore}\n`;
    }
    
    if (vulnerability.cveId) {
      description += `CVE ID: ${vulnerability.cveId}\n`;
    }
    
    description += `\nThis ticket was automatically created by AppCompatCheck security scanning.`;
    
    return description;
  }
}