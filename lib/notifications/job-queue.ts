import { redis } from '@/lib/redis/client';
import { NotificationService } from './notification-service';
import type { NotificationData } from './notification-service';

export interface Job {
  id: string;
  type: 'notification' | 'email' | 'sms' | 'webhook';
  data: any;
  attempts: number;
  maxAttempts: number;
  delay?: number;
  createdAt: Date;
  processAt?: Date;
  completedAt?: Date;
  failedAt?: Date;
  error?: string;
}

export class JobQueue {
  private static instance: JobQueue;
  private notificationService: NotificationService;
  private isProcessing = false;
  private processingInterval?: NodeJS.Timeout;

  constructor() {
    this.notificationService = NotificationService.getInstance();
  }

  static getInstance(): JobQueue {
    if (!JobQueue.instance) {
      JobQueue.instance = new JobQueue();
    }
    return JobQueue.instance;
  }

  /**
   * Add a notification job to the queue
   */
  async addNotificationJob(
    notification: NotificationData,
    options: { delay?: number; maxAttempts?: number } = {}
  ): Promise<string> {
    const jobId = `job:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
    const job: Job = {
      id: jobId,
      type: 'notification',
      data: notification,
      attempts: 0,
      maxAttempts: options.maxAttempts || 3,
      delay: options.delay || 0,
      createdAt: new Date(),
      processAt: options.delay ? new Date(Date.now() + options.delay) : new Date(),
    };

    await redis.lpush('notification_jobs', JSON.stringify(job));
    
    // Start processing if not already running
    if (!this.isProcessing) {
      this.startProcessing();
    }

    return jobId;
  }

  /**
   * Add a bulk notification job
   */
  async addBulkNotificationJob(
    notifications: NotificationData[],
    options: { delay?: number; maxAttempts?: number } = {}
  ): Promise<string[]> {
    const jobIds: string[] = [];
    const jobs: string[] = [];

    for (const notification of notifications) {
      const jobId = `job:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
      const job: Job = {
        id: jobId,
        type: 'notification',
        data: notification,
        attempts: 0,
        maxAttempts: options.maxAttempts || 3,
        delay: options.delay || 0,
        createdAt: new Date(),
        processAt: options.delay ? new Date(Date.now() + options.delay) : new Date(),
      };

      jobs.push(JSON.stringify(job));
      jobIds.push(jobId);
    }

    if (jobs.length > 0) {
      await redis.lpush('notification_jobs', ...jobs);
      
      if (!this.isProcessing) {
        this.startProcessing();
      }
    }

    return jobIds;
  }

  /**
   * Schedule a notification for later delivery
   */
  async scheduleNotification(
    notification: NotificationData,
    scheduledAt: Date,
    options: { maxAttempts?: number } = {}
  ): Promise<string> {
    const delay = scheduledAt.getTime() - Date.now();
    return this.addNotificationJob(notification, { delay, ...options });
  }

  /**
   * Start processing jobs from the queue
   */
  async startProcessing(): Promise<void> {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    console.log('Started notification job queue processing');

    // Process jobs immediately and then every 5 seconds
    await this.processJobs();
    this.processingInterval = setInterval(() => {
      this.processJobs().catch(console.error);
    }, 5000);
  }

  /**
   * Stop processing jobs
   */
  async stopProcessing(): Promise<void> {
    this.isProcessing = false;
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = undefined;
    }
    console.log('Stopped notification job queue processing');
  }

  /**
   * Process pending jobs in the queue
   */
  private async processJobs(): Promise<void> {
    try {
      // Get jobs from the queue
      const jobData = await redis.brpop('notification_jobs', 0);
      if (!jobData) return;

      const job: Job = JSON.parse(jobData[1]);
      
      // Check if job should be processed now
      const now = new Date();
      const processAt = new Date(job.processAt || job.createdAt);
      
      if (processAt > now) {
        // Re-queue job for later processing
        await redis.lpush('notification_jobs', JSON.stringify(job));
        return;
      }

      await this.processJob(job);
      
    } catch (error) {
      console.error('Error processing job queue:', error);
    }
  }

  /**
   * Process a single job
   */
  private async processJob(job: Job): Promise<void> {
    try {
      job.attempts++;
      
      console.log(`Processing job ${job.id} (attempt ${job.attempts}/${job.maxAttempts})`);
      
      switch (job.type) {
        case 'notification':
          await this.notificationService.sendNotification(job.data as NotificationData);
          break;
        default:
          throw new Error(`Unknown job type: ${job.type}`);
      }

      job.completedAt = new Date();
      await this.saveJobResult(job, 'completed');
      
      console.log(`Job ${job.id} completed successfully`);
      
    } catch (error) {
      console.error(`Job ${job.id} failed:`, error);
      
      job.error = error instanceof Error ? error.message : String(error);
      
      if (job.attempts < job.maxAttempts) {
        // Retry with exponential backoff
        const delay = Math.pow(2, job.attempts) * 1000; // 2s, 4s, 8s, etc.
        job.processAt = new Date(Date.now() + delay);
        
        console.log(`Retrying job ${job.id} in ${delay}ms (attempt ${job.attempts + 1}/${job.maxAttempts})`);
        
        // Re-queue job for retry
        await redis.lpush('notification_jobs', JSON.stringify(job));
      } else {
        // Max attempts reached, mark as failed
        job.failedAt = new Date();
        await this.saveJobResult(job, 'failed');
        
        console.error(`Job ${job.id} failed permanently after ${job.attempts} attempts`);
      }
    }
  }

  /**
   * Save job result for monitoring
   */
  private async saveJobResult(job: Job, status: 'completed' | 'failed'): Promise<void> {
    const key = `job_results:${status}`;
    const result = {
      jobId: job.id,
      type: job.type,
      attempts: job.attempts,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
      failedAt: job.failedAt,
      error: job.error,
    };

    // Store result and set expiry (keep for 7 days)
    await redis.lpush(key, JSON.stringify(result));
    await redis.expire(key, 7 * 24 * 60 * 60); // 7 days
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    pending: number;
    completed: number;
    failed: number;
  }> {
    const [pending, completed, failed] = await Promise.all([
      redis.llen('notification_jobs'),
      redis.llen('job_results:completed'),
      redis.llen('job_results:failed'),
    ]);

    return { pending, completed, failed };
  }

  /**
   * Clear completed jobs older than specified days
   */
  async clearOldJobs(days = 7): Promise<number> {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    let cleared = 0;

    for (const key of ['job_results:completed', 'job_results:failed']) {
      const length = await redis.llen(key);
      
      for (let i = length - 1; i >= 0; i--) {
        const jobData = await redis.lindex(key, i);
        if (jobData) {
          const job = JSON.parse(jobData);
          const jobDate = new Date(job.completedAt || job.failedAt);
          
          if (jobDate < cutoff) {
            await redis.lrem(key, 1, jobData);
            cleared++;
          }
        }
      }
    }

    return cleared;
  }

  /**
   * Get recent job results for monitoring
   */
  async getRecentJobs(
    status: 'completed' | 'failed',
    limit = 50
  ): Promise<any[]> {
    const key = `job_results:${status}`;
    const results = await redis.lrange(key, 0, limit - 1);
    return results.map(result => JSON.parse(result));
  }
}

// Helper function to start the job queue in the application
export async function initializeJobQueue(): Promise<JobQueue> {
  const jobQueue = JobQueue.getInstance();
  await jobQueue.startProcessing();
  return jobQueue;
}

// Helper function for graceful shutdown
export async function shutdownJobQueue(): Promise<void> {
  const jobQueue = JobQueue.getInstance();
  await jobQueue.stopProcessing();
}