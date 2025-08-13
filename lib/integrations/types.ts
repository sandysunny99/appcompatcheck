export interface Integration {
  id: string;
  name: string;
  type: IntegrationType;
  provider: string;
  status: 'active' | 'inactive' | 'error';
  config: IntegrationConfig;
  createdAt: Date;
  updatedAt: Date;
  lastSyncAt?: Date;
  organizationId: string;
}

export type IntegrationType = 
  | 'security_scanner' 
  | 'cicd_pipeline' 
  | 'code_repository' 
  | 'vulnerability_database' 
  | 'compliance_framework'
  | 'siem_platform'
  | 'ticketing_system';

export interface IntegrationConfig {
  // Common configuration
  apiKey?: string;
  apiSecret?: string;
  webhookUrl?: string;
  
  // Provider-specific configuration
  baseUrl?: string;
  organizationId?: string;
  projectId?: string;
  repositoryId?: string;
  username?: string;
  token?: string;
  
  // Sync and workflow settings
  syncInterval?: number; // minutes
  autoSync?: boolean;
  webhookSecret?: string;
  
  // Feature flags
  features?: {
    autoImportVulnerabilities?: boolean;
    triggerScansOnPush?: boolean;
    createTicketsForCritical?: boolean;
    updateComplianceStatus?: boolean;
  };
}

export interface IntegrationProvider {
  id: string;
  name: string;
  type: IntegrationType;
  description: string;
  logoUrl: string;
  documentationUrl: string;
  configSchema: any; // JSON schema for validation
  supportedFeatures: string[];
  requiresAuth: boolean;
  authType: 'api_key' | 'oauth' | 'basic_auth' | 'token';
}

export interface SyncResult {
  success: boolean;
  itemsProcessed: number;
  itemsCreated: number;
  itemsUpdated: number;
  itemsSkipped: number;
  errors: string[];
  lastSyncAt: Date;
}

export interface WebhookPayload {
  event: string;
  integrationId: string;
  data: any;
  signature?: string;
  timestamp: number;
}

// Security Scanner Integration Types
export interface SecurityScannerResult {
  scanId: string;
  projectName: string;
  branch?: string;
  commit?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  vulnerabilities: VulnerabilityImport[];
  summary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  scanDate: Date;
  duration?: number;
}

export interface VulnerabilityImport {
  externalId: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  cweId?: string;
  cveId?: string;
  cvssScore?: number;
  file?: string;
  line?: number;
  status: 'open' | 'fixed' | 'ignored' | 'false_positive';
  firstDetected: Date;
  lastUpdated: Date;
}

// CI/CD Pipeline Integration Types
export interface PipelineEvent {
  pipelineId: string;
  projectName: string;
  branch: string;
  commit: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'cancelled';
  stages: PipelineStage[];
  triggeredBy: string;
  startTime: Date;
  endTime?: Date;
}

export interface PipelineStage {
  name: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
  startTime?: Date;
  endTime?: Date;
  logs?: string;
  artifacts?: string[];
}

// Repository Integration Types
export interface RepositoryEvent {
  eventType: 'push' | 'pull_request' | 'merge' | 'tag';
  repository: string;
  branch: string;
  commit: string;
  author: string;
  message: string;
  timestamp: Date;
  files?: string[];
}

// Ticketing System Integration Types
export interface TicketTemplate {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  labels?: string[];
  assignee?: string;
  customFields?: Record<string, any>;
}

export interface CreatedTicket {
  externalId: string;
  url: string;
  status: string;
  createdAt: Date;
}