import { BaseIntegration } from '../base-integration';
import { SyncResult, WebhookPayload, RepositoryEvent } from '../types';
import { NotificationEvents } from '@/lib/notifications/events';

export class GitHubIntegration extends BaseIntegration {
  private readonly baseUrl: string;

  constructor(integration: any) {
    super(integration);
    this.baseUrl = this.config.baseUrl || 'https://api.github.com';
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.makeRequest('GET', `${this.baseUrl}/user`);
      await this.logActivity('test_connection', 'success', { user: response.login });
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
      // Sync repositories
      const repos = await this.getRepositories();
      
      for (const repo of repos) {
        try {
          await this.syncRepository(repo);
          itemsProcessed++;
          itemsCreated++; // Simplified - would check if new vs updated
        } catch (error) {
          errors.push(`Failed to sync repository ${repo.name}: ${error.message}`);
        }
      }

      // Sync recent commits
      for (const repo of repos) {
        try {
          const commits = await this.getRecentCommits(repo.name);
          for (const commit of commits) {
            await this.processCommit(repo.name, commit);
            itemsProcessed++;
          }
        } catch (error) {
          errors.push(`Failed to sync commits for ${repo.name}: ${error.message}`);
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
      const githubEvent = payload.event; // GitHub sends the event type in headers
      const data = payload.data;

      switch (githubEvent) {
        case 'push':
          await this.handlePushEvent(data);
          break;
          
        case 'pull_request':
          await this.handlePullRequestEvent(data);
          break;
          
        case 'repository':
          await this.handleRepositoryEvent(data);
          break;
          
        default:
          await this.logActivity('webhook', 'info', { 
            event: githubEvent, 
            message: 'Unhandled event type' 
          });
      }

      await this.logActivity('webhook', 'success', { event: githubEvent });

    } catch (error) {
      await this.logActivity('webhook', 'error', { 
        event: payload.event, 
        error: error.message 
      });
      throw error;
    }
  }

  private async getRepositories(): Promise<any[]> {
    const repos: any[] = [];
    let page = 1;
    const perPage = 100;

    while (true) {
      const response = await this.makeRequest(
        'GET',
        `${this.baseUrl}/user/repos?page=${page}&per_page=${perPage}&sort=updated`
      );

      if (response.length === 0) break;
      
      repos.push(...response);
      
      if (response.length < perPage) break;
      page++;
    }

    return repos;
  }

  private async syncRepository(repo: any): Promise<void> {
    // TODO: Store repository information in database
    await this.logActivity('repository_sync', 'info', {
      repository: repo.name,
      updated_at: repo.updated_at,
      language: repo.language,
    });

    // Check if automatic scanning is enabled
    if (this.config.features?.triggerScansOnPush) {
      // TODO: Trigger security scan for this repository
      await this.logActivity('scan_trigger', 'info', { repository: repo.name });
    }
  }

  private async getRecentCommits(repoName: string): Promise<any[]> {
    const since = new Date();
    since.setHours(since.getHours() - 24); // Get commits from last 24 hours

    const response = await this.makeRequest(
      'GET',
      `${this.baseUrl}/repos/${repoName}/commits?since=${since.toISOString()}&per_page=50`
    );

    return response || [];
  }

  private async processCommit(repoName: string, commit: any): Promise<void> {
    const repositoryEvent: RepositoryEvent = {
      eventType: 'push',
      repository: repoName,
      branch: 'main', // GitHub doesn't provide branch in commits API
      commit: commit.sha,
      author: commit.author?.login || commit.commit.author.name,
      message: commit.commit.message,
      timestamp: new Date(commit.commit.author.date),
      files: [], // Would need separate API call to get files
    };

    // TODO: Store repository event in database
    await this.logActivity('commit_processed', 'info', {
      repository: repoName,
      commit: commit.sha,
      author: repositoryEvent.author,
    });

    // Check if this commit should trigger a scan
    if (this.shouldTriggerScan(commit)) {
      await this.triggerSecurityScan(repoName, commit.sha);
    }
  }

  private async handlePushEvent(data: any): Promise<void> {
    const repository = data.repository.name;
    const branch = data.ref.replace('refs/heads/', '');
    const commits = data.commits || [];

    for (const commit of commits) {
      const repositoryEvent: RepositoryEvent = {
        eventType: 'push',
        repository,
        branch,
        commit: commit.id,
        author: commit.author.username || commit.author.name,
        message: commit.message,
        timestamp: new Date(commit.timestamp),
        files: commit.added?.concat(commit.modified || []),
      };

      await this.logActivity('push_event', 'info', {
        repository,
        branch,
        commit: commit.id,
      });

      // Auto-trigger scan if configured
      if (this.config.features?.triggerScansOnPush) {
        await this.triggerSecurityScan(repository, commit.id, branch);
      }
    }
  }

  private async handlePullRequestEvent(data: any): Promise<void> {
    const repository = data.repository.name;
    const prNumber = data.pull_request.number;
    const action = data.action;

    await this.logActivity('pull_request_event', 'info', {
      repository,
      prNumber,
      action,
      branch: data.pull_request.head.ref,
    });

    // Trigger scan for pull requests if configured
    if (action === 'opened' || action === 'synchronize') {
      if (this.config.features?.triggerScansOnPush) {
        await this.triggerSecurityScan(
          repository,
          data.pull_request.head.sha,
          data.pull_request.head.ref
        );
      }
    }
  }

  private async handleRepositoryEvent(data: any): Promise<void> {
    await this.logActivity('repository_event', 'info', {
      repository: data.repository.name,
      action: data.action,
    });
  }

  private shouldTriggerScan(commit: any): boolean {
    // Logic to determine if a scan should be triggered
    // For example, only scan if certain files were modified
    const sensitiveExtensions = ['.js', '.ts', '.py', '.java', '.php', '.rb', '.go'];
    
    if (commit.files) {
      return commit.files.some((file: any) =>
        sensitiveExtensions.some(ext => file.filename?.endsWith(ext))
      );
    }

    return true; // Default to triggering scan
  }

  private async triggerSecurityScan(
    repository: string,
    commit: string,
    branch?: string
  ): Promise<void> {
    try {
      // TODO: Integrate with scanning service
      await this.logActivity('scan_triggered', 'info', {
        repository,
        commit,
        branch,
        trigger: 'github_integration',
      });

      // Send notification to relevant users
      // TODO: Get user IDs who should be notified about this scan
      
    } catch (error) {
      await this.logActivity('scan_trigger_failed', 'error', {
        repository,
        commit,
        error: error.message,
      });
    }
  }

  /**
   * Get repository languages
   */
  async getRepositoryLanguages(repoName: string): Promise<Record<string, number>> {
    try {
      const response = await this.makeRequest(
        'GET',
        `${this.baseUrl}/repos/${repoName}/languages`
      );
      return response || {};
    } catch (error) {
      await this.logActivity('get_languages', 'error', { 
        repository: repoName, 
        error: error.message 
      });
      return {};
    }
  }

  /**
   * Get repository security alerts
   */
  async getSecurityAlerts(repoName: string): Promise<any[]> {
    try {
      // Note: This requires special permissions and may not be available for all repositories
      const response = await this.makeRequest(
        'GET',
        `${this.baseUrl}/repos/${repoName}/vulnerability-alerts`,
        undefined,
        { 'Accept': 'application/vnd.github.dorian-preview+json' }
      );
      return response || [];
    } catch (error) {
      await this.logActivity('get_security_alerts', 'error', { 
        repository: repoName, 
        error: error.message 
      });
      return [];
    }
  }

  /**
   * Create a check run for a commit (used for CI/CD integration)
   */
  async createCheckRun(
    repoName: string,
    headSha: string,
    name: string,
    status: 'queued' | 'in_progress' | 'completed',
    conclusion?: 'success' | 'failure' | 'neutral' | 'cancelled' | 'skipped' | 'timed_out'
  ): Promise<any> {
    try {
      const checkRun = {
        name,
        head_sha: headSha,
        status,
        ...(conclusion && { conclusion }),
        started_at: new Date().toISOString(),
      };

      const response = await this.makeRequest(
        'POST',
        `${this.baseUrl}/repos/${repoName}/check-runs`,
        checkRun,
        { 'Accept': 'application/vnd.github.antiope-preview+json' }
      );

      await this.logActivity('check_run_created', 'success', {
        repository: repoName,
        checkRunId: response.id,
        status,
      });

      return response;
    } catch (error) {
      await this.logActivity('check_run_failed', 'error', {
        repository: repoName,
        error: error.message,
      });
      throw error;
    }
  }
}