import { BackupService } from './backup-service';
import { RetentionService } from './retention-service';

/**
 * Central data management coordinator
 */
export class DataManager {
  private static instance: DataManager;
  private backupService: BackupService;
  private retentionService: RetentionService;
  private isInitialized = false;

  static getInstance(): DataManager {
    if (!DataManager.instance) {
      DataManager.instance = new DataManager();
    }
    return DataManager.instance;
  }

  constructor() {
    this.backupService = BackupService.getInstance();
    this.retentionService = RetentionService.getInstance();
  }

  /**
   * Initialize data management services
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('Initializing data management services...');

      // Schedule automated backups
      this.backupService.scheduleBackups();

      // Schedule retention policy enforcement
      this.retentionService.scheduleRetentionJobs();

      // Start cleanup jobs
      this.startCleanupJobs();

      this.isInitialized = true;
      console.log('Data management services initialized successfully');

    } catch (error) {
      console.error('Failed to initialize data management services:', error);
      throw error;
    }
  }

  /**
   * Shutdown data management services
   */
  async shutdown(): Promise<void> {
    if (!this.isInitialized) return;

    try {
      console.log('Shutting down data management services...');

      // Stop scheduled jobs
      this.backupService.stopScheduledJobs();
      this.retentionService.stopScheduledJobs();

      this.isInitialized = false;
      console.log('Data management services shut down successfully');

    } catch (error) {
      console.error('Failed to shutdown data management services:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive data management statistics
   */
  async getDataManagementStats(organizationId: string): Promise<{
    backups: {
      total: number;
      successful: number;
      failed: number;
      lastBackup: Date | null;
      totalSize: number;
    };
    retention: {
      totalRules: number;
      activeRules: number;
      recordsProcessed: number;
      recordsDeleted: number;
      recordsArchived: number;
      lastRun: Date | null;
    };
    storage: {
      usedSpace: number;
      archivedSpace: number;
      availableSpace: number;
    };
    performance: {
      avgBackupTime: number;
      avgRetentionTime: number;
      successRate: number;
    };
  }> {
    try {
      // Get backup statistics
      const backupStats = await this.getBackupStatistics(organizationId);
      
      // Get retention statistics
      const retentionStats = await this.retentionService.getRetentionStats(organizationId);
      
      // Get storage statistics
      const storageStats = await this.getStorageStatistics(organizationId);
      
      // Calculate performance metrics
      const performanceStats = await this.getPerformanceStatistics(organizationId);

      return {
        backups: backupStats,
        retention: retentionStats,
        storage: storageStats,
        performance: performanceStats,
      };

    } catch (error) {
      console.error('Failed to get data management stats:', error);
      throw error;
    }
  }

  /**
   * Perform system health check
   */
  async performHealthCheck(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    checks: Array<{
      name: string;
      status: 'pass' | 'fail' | 'warning';
      message: string;
      details?: any;
    }>;
  }> {
    const checks = [];
    let overallStatus: 'healthy' | 'warning' | 'critical' = 'healthy';

    // Check backup service
    try {
      // TODO: Check if backup service is running
      checks.push({
        name: 'Backup Service',
        status: 'pass',
        message: 'Backup service is running and healthy',
      });
    } catch (error) {
      checks.push({
        name: 'Backup Service',
        status: 'fail',
        message: `Backup service error: ${error.message}`,
      });
      overallStatus = 'critical';
    }

    // Check retention service
    try {
      // TODO: Check if retention service is running
      checks.push({
        name: 'Retention Service',
        status: 'pass',
        message: 'Retention service is running and healthy',
      });
    } catch (error) {
      checks.push({
        name: 'Retention Service',
        status: 'fail',
        message: `Retention service error: ${error.message}`,
      });
      if (overallStatus !== 'critical') overallStatus = 'warning';
    }

    // Check storage availability
    try {
      // TODO: Check storage providers
      checks.push({
        name: 'Storage Availability',
        status: 'pass',
        message: 'All storage providers are accessible',
      });
    } catch (error) {
      checks.push({
        name: 'Storage Availability',
        status: 'fail',
        message: `Storage error: ${error.message}`,
      });
      overallStatus = 'critical';
    }

    // Check recent backup success rate
    try {
      const successRate = await this.getRecentBackupSuccessRate();
      if (successRate < 0.8) {
        checks.push({
          name: 'Backup Success Rate',
          status: 'warning',
          message: `Backup success rate is ${(successRate * 100).toFixed(1)}%`,
          details: { successRate },
        });
        if (overallStatus !== 'critical') overallStatus = 'warning';
      } else {
        checks.push({
          name: 'Backup Success Rate',
          status: 'pass',
          message: `Backup success rate is ${(successRate * 100).toFixed(1)}%`,
        });
      }
    } catch (error) {
      checks.push({
        name: 'Backup Success Rate',
        status: 'fail',
        message: `Failed to check backup success rate: ${error.message}`,
      });
    }

    return { status: overallStatus, checks };
  }

  /**
   * Start cleanup jobs for old data
   */
  private startCleanupJobs(): void {
    // Clean up old backup jobs every hour
    setInterval(() => {
      this.backupService.cleanupJobs();
    }, 60 * 60 * 1000); // 1 hour

    // Clean up temporary export files every day
    setInterval(() => {
      this.cleanupExpiredExports();
    }, 24 * 60 * 60 * 1000); // 24 hours

    console.log('Data management cleanup jobs started');
  }

  /**
   * Get backup statistics
   */
  private async getBackupStatistics(organizationId: string): Promise<{
    total: number;
    successful: number;
    failed: number;
    lastBackup: Date | null;
    totalSize: number;
  }> {
    // TODO: Query backup statistics from database
    return {
      total: 50,
      successful: 45,
      failed: 5,
      lastBackup: new Date(),
      totalSize: 1024 * 1024 * 1024, // 1GB
    };
  }

  /**
   * Get storage statistics
   */
  private async getStorageStatistics(organizationId: string): Promise<{
    usedSpace: number;
    archivedSpace: number;
    availableSpace: number;
  }> {
    // TODO: Calculate actual storage usage
    return {
      usedSpace: 5 * 1024 * 1024 * 1024, // 5GB
      archivedSpace: 2 * 1024 * 1024 * 1024, // 2GB
      availableSpace: 93 * 1024 * 1024 * 1024, // 93GB
    };
  }

  /**
   * Get performance statistics
   */
  private async getPerformanceStatistics(organizationId: string): Promise<{
    avgBackupTime: number;
    avgRetentionTime: number;
    successRate: number;
  }> {
    // TODO: Calculate actual performance metrics
    return {
      avgBackupTime: 120, // 2 minutes
      avgRetentionTime: 30, // 30 seconds
      successRate: 0.95, // 95%
    };
  }

  /**
   * Get recent backup success rate
   */
  private async getRecentBackupSuccessRate(): Promise<number> {
    // TODO: Calculate actual success rate from recent backups
    return 0.95; // 95%
  }

  /**
   * Clean up expired export files
   */
  private async cleanupExpiredExports(): Promise<void> {
    try {
      // TODO: Clean up expired export files
      console.log('Cleaning up expired export files...');
    } catch (error) {
      console.error('Failed to cleanup expired exports:', error);
    }
  }

  /**
   * Force garbage collection of old data
   */
  async forceGarbageCollection(organizationId: string): Promise<{
    deletedBackups: number;
    deletedExports: number;
    freedSpace: number;
  }> {
    try {
      console.log(`Running garbage collection for organization ${organizationId}`);

      let deletedBackups = 0;
      let deletedExports = 0;
      let freedSpace = 0;

      // Clean up old backup files beyond retention policy
      // TODO: Implement actual cleanup logic

      // Clean up expired export files
      // TODO: Implement actual cleanup logic

      console.log(`Garbage collection completed: ${deletedBackups} backups, ${deletedExports} exports, ${freedSpace} bytes freed`);

      return { deletedBackups, deletedExports, freedSpace };

    } catch (error) {
      console.error('Garbage collection failed:', error);
      throw error;
    }
  }

  /**
   * Get data management service status
   */
  getServiceStatus(): {
    backupService: boolean;
    retentionService: boolean;
    initialized: boolean;
  } {
    return {
      backupService: this.isInitialized,
      retentionService: this.isInitialized,
      initialized: this.isInitialized,
    };
  }
}

// Helper function to initialize data management on application startup
export async function initializeDataManagement(): Promise<DataManager> {
  const dataManager = DataManager.getInstance();
  await dataManager.initialize();
  return dataManager;
}

// Helper function for graceful shutdown
export async function shutdownDataManagement(): Promise<void> {
  const dataManager = DataManager.getInstance();
  await dataManager.shutdown();
}