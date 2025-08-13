import { DataRetentionRule, RetentionCondition, ArchiveConfiguration } from './types';
import { db } from '@/lib/db/drizzle';
import { sql, and, or, lt, gt, eq, inArray, notInArray } from 'drizzle-orm';
import { createStorageProvider } from './storage/storage-factory';

export class RetentionService {
  private static instance: RetentionService;
  private scheduledJobs: Map<string, NodeJS.Timer> = new Map();

  static getInstance(): RetentionService {
    if (!RetentionService.instance) {
      RetentionService.instance = new RetentionService();
    }
    return RetentionService.instance;
  }

  /**
   * Apply retention rules
   */
  async applyRetentionRules(organizationId?: string): Promise<{
    processed: number;
    deleted: number;
    archived: number;
    errors: string[];
  }> {
    const results = {
      processed: 0,
      deleted: 0,
      archived: 0,
      errors: [] as string[],
    };

    try {
      // TODO: Get enabled retention rules from database
      // const rules = await db.select()
      //   .from(dataRetentionRules)
      //   .where(
      //     and(
      //       eq(dataRetentionRules.enabled, true),
      //       organizationId ? eq(dataRetentionRules.organizationId, organizationId) : undefined
      //     )
      //   );

      // Mock retention rules for demonstration
      const rules: DataRetentionRule[] = [
        {
          id: 'rule1',
          name: 'Archive old scans',
          enabled: true,
          table: 'scans',
          conditions: [
            {
              field: 'created_at',
              operator: 'older_than',
              value: 90,
              unit: 'days',
            }
          ],
          action: 'archive',
          schedule: '0 2 * * 0', // Weekly at 2 AM on Sunday
          organizationId: organizationId || 'default',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'rule2',
          name: 'Delete old logs',
          enabled: true,
          table: 'audit_logs',
          conditions: [
            {
              field: 'created_at',
              operator: 'older_than',
              value: 365,
              unit: 'days',
            }
          ],
          action: 'delete',
          schedule: '0 3 * * 0', // Weekly at 3 AM on Sunday
          organizationId: organizationId || 'default',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      for (const rule of rules) {
        try {
          await this.processRetentionRule(rule, results);
        } catch (error) {
          console.error(`Failed to process retention rule ${rule.id}:`, error);
          results.errors.push(`Rule ${rule.name}: ${error.message}`);
        }
      }

      console.log('Retention processing completed:', results);
      return results;

    } catch (error) {
      console.error('Failed to apply retention rules:', error);
      results.errors.push(`General error: ${error.message}`);
      return results;
    }
  }

  /**
   * Process a single retention rule
   */
  private async processRetentionRule(
    rule: DataRetentionRule,
    results: { processed: number; deleted: number; archived: number }
  ): Promise<void> {
    console.log(`Processing retention rule: ${rule.name}`);

    // Build SQL conditions
    const conditions = this.buildConditions(rule.conditions);
    
    if (conditions.length === 0) {
      console.warn(`No valid conditions for rule ${rule.name}`);
      return;
    }

    // Count affected records
    const countQuery = sql.raw(`
      SELECT COUNT(*) as count 
      FROM ${rule.table} 
      WHERE ${conditions.join(' AND ')}
    `);

    const countResult = await db.execute(countQuery);
    const affectedCount = parseInt(countResult[0]?.count as string) || 0;

    if (affectedCount === 0) {
      console.log(`No records found for rule ${rule.name}`);
      return;
    }

    console.log(`Found ${affectedCount} records for rule ${rule.name}`);
    results.processed += affectedCount;

    if (rule.action === 'delete') {
      await this.deleteRecords(rule.table, conditions);
      results.deleted += affectedCount;
    } else if (rule.action === 'archive') {
      await this.archiveRecords(rule.table, conditions, rule.organizationId);
      results.archived += affectedCount;
    }
  }

  /**
   * Build SQL conditions from retention conditions
   */
  private buildConditions(conditions: RetentionCondition[]): string[] {
    const sqlConditions: string[] = [];

    for (const condition of conditions) {
      try {
        let sqlCondition = '';

        switch (condition.operator) {
          case 'older_than':
            const value = parseInt(condition.value);
            const unit = condition.unit || 'days';
            let interval = '';
            
            switch (unit) {
              case 'days':
                interval = `${value} DAY`;
                break;
              case 'weeks':
                interval = `${value * 7} DAY`;
                break;
              case 'months':
                interval = `${value * 30} DAY`;
                break;
              case 'years':
                interval = `${value * 365} DAY`;
                break;
            }
            
            sqlCondition = `${condition.field} < NOW() - INTERVAL '${interval}'`;
            break;

          case 'equals':
            if (typeof condition.value === 'string') {
              sqlCondition = `${condition.field} = '${condition.value}'`;
            } else {
              sqlCondition = `${condition.field} = ${condition.value}`;
            }
            break;

          case 'not_equals':
            if (typeof condition.value === 'string') {
              sqlCondition = `${condition.field} != '${condition.value}'`;
            } else {
              sqlCondition = `${condition.field} != ${condition.value}`;
            }
            break;

          case 'in':
            if (Array.isArray(condition.value)) {
              const values = condition.value.map(v => 
                typeof v === 'string' ? `'${v}'` : v
              ).join(', ');
              sqlCondition = `${condition.field} IN (${values})`;
            }
            break;

          case 'not_in':
            if (Array.isArray(condition.value)) {
              const values = condition.value.map(v => 
                typeof v === 'string' ? `'${v}'` : v
              ).join(', ');
              sqlCondition = `${condition.field} NOT IN (${values})`;
            }
            break;
        }

        if (sqlCondition) {
          sqlConditions.push(sqlCondition);
        }
      } catch (error) {
        console.error(`Failed to build condition for ${condition.field}:`, error);
      }
    }

    return sqlConditions;
  }

  /**
   * Delete records from table
   */
  private async deleteRecords(table: string, conditions: string[]): Promise<void> {
    try {
      const deleteQuery = sql.raw(`
        DELETE FROM ${table} 
        WHERE ${conditions.join(' AND ')}
      `);

      const result = await db.execute(deleteQuery);
      console.log(`Deleted records from ${table}:`, result);
    } catch (error) {
      console.error(`Failed to delete records from ${table}:`, error);
      throw error;
    }
  }

  /**
   * Archive records to storage
   */
  private async archiveRecords(
    table: string,
    conditions: string[],
    organizationId: string
  ): Promise<void> {
    try {
      // TODO: Get archive configuration from database
      // const archiveConfig = await db.select()
      //   .from(archiveConfigurations)
      //   .where(eq(archiveConfigurations.organizationId, organizationId))
      //   .limit(1);

      const archiveConfig: ArchiveConfiguration = {
        id: 'archive1',
        name: 'Default Archive',
        enabled: true,
        storage: {
          type: 'local',
          config: { path: '/tmp/archives' }
        },
        compression: 'gzip',
        encryption: { enabled: false, algorithm: 'aes-256-gcm' },
        organizationId,
      };

      // Get records to archive
      const selectQuery = sql.raw(`
        SELECT * FROM ${table} 
        WHERE ${conditions.join(' AND ')}
      `);

      const records = await db.execute(selectQuery);

      if (records.length === 0) {
        console.log(`No records to archive from ${table}`);
        return;
      }

      // Create archive file
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `archive_${table}_${timestamp}.json`;

      const archiveData = {
        table,
        timestamp: new Date().toISOString(),
        recordCount: records.length,
        records,
      };

      // Compress and store
      const storageProvider = createStorageProvider(archiveConfig.storage);
      const compressedData = await this.compressData(JSON.stringify(archiveData, null, 2));
      
      await storageProvider.upload(filename, compressedData);
      console.log(`Archived ${records.length} records from ${table} to ${filename}`);

      // Delete archived records
      await this.deleteRecords(table, conditions);

      // TODO: Save archive record to database
      // await db.insert(archivedData).values({
      //   table,
      //   filename,
      //   recordCount: records.length,
      //   archivedAt: new Date(),
      //   organizationId,
      // });

    } catch (error) {
      console.error(`Failed to archive records from ${table}:`, error);
      throw error;
    }
  }

  /**
   * Compress data using gzip
   */
  private async compressData(data: string): Promise<Buffer> {
    const zlib = require('zlib');
    return new Promise((resolve, reject) => {
      zlib.gzip(Buffer.from(data, 'utf8'), (error: any, compressed: Buffer) => {
        if (error) reject(error);
        else resolve(compressed);
      });
    });
  }

  /**
   * Schedule retention jobs
   */
  scheduleRetentionJobs(): void {
    // TODO: Get all enabled retention rules
    // const rules = await db.select()
    //   .from(dataRetentionRules)
    //   .where(eq(dataRetentionRules.enabled, true));

    console.log('Scheduling retention jobs...');

    // In a real implementation, you would use a proper cron scheduler
    // Example: node-cron
    // cron.schedule(rule.schedule, () => {
    //   this.applyRetentionRules(rule.organizationId).catch(console.error);
    // });

    // For demo, run retention every hour
    const timer = setInterval(() => {
      this.applyRetentionRules().catch(console.error);
    }, 60 * 60 * 1000); // 1 hour

    this.scheduledJobs.set('retention', timer);
  }

  /**
   * Stop scheduled retention jobs
   */
  stopScheduledJobs(): void {
    for (const [jobId, timer] of this.scheduledJobs) {
      clearInterval(timer);
      this.scheduledJobs.delete(jobId);
    }
    console.log('Stopped retention scheduled jobs');
  }

  /**
   * Create retention rule
   */
  async createRetentionRule(rule: Omit<DataRetentionRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const ruleId = `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const fullRule: DataRetentionRule = {
      id: ruleId,
      ...rule,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // TODO: Save to database
    // await db.insert(dataRetentionRules).values(fullRule);

    console.log(`Created retention rule: ${rule.name}`);
    return ruleId;
  }

  /**
   * Test retention rule (dry run)
   */
  async testRetentionRule(ruleId: string): Promise<{
    affectedRecords: number;
    sampleRecords: any[];
  }> {
    // TODO: Get rule from database
    // const rule = await db.select()
    //   .from(dataRetentionRules)
    //   .where(eq(dataRetentionRules.id, ruleId))
    //   .limit(1);

    console.log(`Testing retention rule ${ruleId} (dry run)`);

    // Mock implementation
    return {
      affectedRecords: 150,
      sampleRecords: [
        { id: 1, created_at: '2023-01-01' },
        { id: 2, created_at: '2023-01-15' },
      ],
    };
  }

  /**
   * Get retention statistics
   */
  async getRetentionStats(organizationId: string): Promise<{
    totalRules: number;
    activeRules: number;
    recordsProcessed: number;
    recordsDeleted: number;
    recordsArchived: number;
    lastRun: Date | null;
  }> {
    // TODO: Get stats from database
    console.log(`Getting retention stats for organization ${organizationId}`);

    return {
      totalRules: 5,
      activeRules: 3,
      recordsProcessed: 1250,
      recordsDeleted: 800,
      recordsArchived: 450,
      lastRun: new Date(),
    };
  }
}