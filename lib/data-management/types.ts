export interface BackupConfiguration {
  id: string;
  name: string;
  enabled: boolean;
  schedule: BackupSchedule;
  retention: RetentionPolicy;
  storage: StorageConfiguration;
  encryption: EncryptionConfiguration;
  tables: string[]; // Database tables to backup
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BackupSchedule {
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
  time?: string; // HH:MM format for daily/weekly/monthly
  dayOfWeek?: number; // 0-6 for weekly (0 = Sunday)
  dayOfMonth?: number; // 1-31 for monthly
  timezone: string;
}

export interface RetentionPolicy {
  daily: number; // Keep daily backups for X days
  weekly: number; // Keep weekly backups for X weeks
  monthly: number; // Keep monthly backups for X months
  yearly: number; // Keep yearly backups for X years
}

export interface StorageConfiguration {
  type: 'local' | 's3' | 'gcs' | 'azure';
  config: LocalStorageConfig | S3StorageConfig | GCSStorageConfig | AzureStorageConfig;
}

export interface LocalStorageConfig {
  path: string;
}

export interface S3StorageConfig {
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  prefix?: string;
}

export interface GCSStorageConfig {
  bucket: string;
  projectId: string;
  keyFilename?: string;
  prefix?: string;
}

export interface AzureStorageConfig {
  accountName: string;
  accountKey: string;
  containerName: string;
  prefix?: string;
}

export interface EncryptionConfiguration {
  enabled: boolean;
  algorithm: 'aes-256-gcm' | 'aes-256-cbc';
  keyId?: string; // Reference to encryption key
}

export interface BackupJob {
  id: string;
  configurationId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  size?: number; // Backup size in bytes
  recordCount?: number;
  error?: string;
  metadata: BackupMetadata;
}

export interface BackupMetadata {
  version: string;
  tables: string[];
  compression: 'gzip' | 'lz4' | 'none';
  checksum: string;
  environment: string;
}

export interface RestoreJob {
  id: string;
  backupId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  restoredRecords?: number;
  error?: string;
  options: RestoreOptions;
}

export interface RestoreOptions {
  tables?: string[]; // Specific tables to restore
  pointInTime?: Date; // Point-in-time recovery
  targetDatabase?: string; // Restore to different database
  overwrite: boolean; // Overwrite existing data
}

export interface DataRetentionRule {
  id: string;
  name: string;
  enabled: boolean;
  table: string;
  conditions: RetentionCondition[];
  action: 'delete' | 'archive';
  schedule: string; // Cron expression
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RetentionCondition {
  field: string;
  operator: 'older_than' | 'equals' | 'not_equals' | 'in' | 'not_in';
  value: any;
  unit?: 'days' | 'weeks' | 'months' | 'years';
}

export interface ArchiveConfiguration {
  id: string;
  name: string;
  enabled: boolean;
  storage: StorageConfiguration;
  compression: 'gzip' | 'lz4' | 'brotli';
  encryption: EncryptionConfiguration;
  organizationId: string;
}

export interface DataExportJob {
  id: string;
  organizationId: string;
  userId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  type: 'full' | 'partial';
  format: 'json' | 'csv' | 'sql';
  filters?: ExportFilters;
  startTime: Date;
  endTime?: Date;
  downloadUrl?: string;
  expiresAt?: Date;
  size?: number;
  error?: string;
}

export interface ExportFilters {
  tables?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  conditions?: Record<string, any>;
}

export interface DataMigrationJob {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  type: 'schema' | 'data' | 'full';
  source: DatabaseConnection;
  target: DatabaseConnection;
  mappings: TableMapping[];
  startTime: Date;
  endTime?: Date;
  recordsProcessed?: number;
  error?: string;
}

export interface DatabaseConnection {
  type: 'postgresql' | 'mysql' | 'mongodb' | 'sqlite';
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
}

export interface TableMapping {
  sourceTable: string;
  targetTable: string;
  fieldMappings: FieldMapping[];
  conditions?: string; // WHERE clause
}

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  transformation?: string; // SQL function or JS function
}