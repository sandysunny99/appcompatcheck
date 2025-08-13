import { IntegrationProvider } from './types';

/**
 * Registry of supported integration providers
 */
export const INTEGRATION_PROVIDERS: Record<string, IntegrationProvider> = {
  // Security Scanners
  snyk: {
    id: 'snyk',
    name: 'Snyk',
    type: 'security_scanner',
    description: 'Vulnerability scanning and dependency analysis',
    logoUrl: '/integrations/snyk-logo.png',
    documentationUrl: 'https://docs.snyk.io/snyk-api-info',
    configSchema: {
      type: 'object',
      required: ['apiKey', 'organizationId'],
      properties: {
        apiKey: { type: 'string', description: 'Snyk API Key' },
        organizationId: { type: 'string', description: 'Snyk Organization ID' },
        baseUrl: { type: 'string', default: 'https://api.snyk.io' },
      },
    },
    supportedFeatures: ['vulnerability_import', 'automated_scanning', 'webhooks'],
    requiresAuth: true,
    authType: 'api_key',
  },

  sonarqube: {
    id: 'sonarqube',
    name: 'SonarQube',
    type: 'security_scanner',
    description: 'Code quality and security analysis',
    logoUrl: '/integrations/sonarqube-logo.png',
    documentationUrl: 'https://docs.sonarqube.org/latest/extend/web-api/',
    configSchema: {
      type: 'object',
      required: ['baseUrl', 'token'],
      properties: {
        baseUrl: { type: 'string', description: 'SonarQube Server URL' },
        token: { type: 'string', description: 'User Token' },
        projectKey: { type: 'string', description: 'Project Key' },
      },
    },
    supportedFeatures: ['vulnerability_import', 'code_quality_metrics', 'compliance_reporting'],
    requiresAuth: true,
    authType: 'token',
  },

  veracode: {
    id: 'veracode',
    name: 'Veracode',
    type: 'security_scanner',
    description: 'Application security testing platform',
    logoUrl: '/integrations/veracode-logo.png',
    documentationUrl: 'https://docs.veracode.com/r/c_rest_api',
    configSchema: {
      type: 'object',
      required: ['apiId', 'apiSecret'],
      properties: {
        apiId: { type: 'string', description: 'Veracode API ID' },
        apiSecret: { type: 'string', description: 'Veracode API Secret' },
        baseUrl: { type: 'string', default: 'https://api.veracode.com' },
      },
    },
    supportedFeatures: ['vulnerability_import', 'sast_results', 'dast_results'],
    requiresAuth: true,
    authType: 'api_key',
  },

  // CI/CD Platforms
  github_actions: {
    id: 'github_actions',
    name: 'GitHub Actions',
    type: 'cicd_pipeline',
    description: 'GitHub CI/CD workflows and automation',
    logoUrl: '/integrations/github-logo.png',
    documentationUrl: 'https://docs.github.com/en/rest',
    configSchema: {
      type: 'object',
      required: ['token', 'repositoryId'],
      properties: {
        token: { type: 'string', description: 'GitHub Personal Access Token' },
        repositoryId: { type: 'string', description: 'Repository ID (owner/repo)' },
        baseUrl: { type: 'string', default: 'https://api.github.com' },
      },
    },
    supportedFeatures: ['pipeline_integration', 'automated_triggers', 'status_updates'],
    requiresAuth: true,
    authType: 'token',
  },

  gitlab_ci: {
    id: 'gitlab_ci',
    name: 'GitLab CI/CD',
    type: 'cicd_pipeline',
    description: 'GitLab continuous integration and deployment',
    logoUrl: '/integrations/gitlab-logo.png',
    documentationUrl: 'https://docs.gitlab.com/ee/api/',
    configSchema: {
      type: 'object',
      required: ['token', 'projectId'],
      properties: {
        token: { type: 'string', description: 'GitLab Access Token' },
        projectId: { type: 'string', description: 'GitLab Project ID' },
        baseUrl: { type: 'string', default: 'https://gitlab.com/api/v4' },
      },
    },
    supportedFeatures: ['pipeline_integration', 'merge_request_checks', 'automated_triggers'],
    requiresAuth: true,
    authType: 'token',
  },

  jenkins: {
    id: 'jenkins',
    name: 'Jenkins',
    type: 'cicd_pipeline',
    description: 'Open source automation server',
    logoUrl: '/integrations/jenkins-logo.png',
    documentationUrl: 'https://www.jenkins.io/doc/book/using/remote-access-api/',
    configSchema: {
      type: 'object',
      required: ['baseUrl', 'username', 'apiToken'],
      properties: {
        baseUrl: { type: 'string', description: 'Jenkins Server URL' },
        username: { type: 'string', description: 'Jenkins Username' },
        apiToken: { type: 'string', description: 'Jenkins API Token' },
      },
    },
    supportedFeatures: ['pipeline_integration', 'build_triggers', 'job_monitoring'],
    requiresAuth: true,
    authType: 'basic_auth',
  },

  // Code Repositories
  github: {
    id: 'github',
    name: 'GitHub',
    type: 'code_repository',
    description: 'Code repository and collaboration platform',
    logoUrl: '/integrations/github-logo.png',
    documentationUrl: 'https://docs.github.com/en/rest',
    configSchema: {
      type: 'object',
      required: ['token'],
      properties: {
        token: { type: 'string', description: 'GitHub Personal Access Token' },
        organizationId: { type: 'string', description: 'GitHub Organization (optional)' },
        baseUrl: { type: 'string', default: 'https://api.github.com' },
      },
    },
    supportedFeatures: ['repository_scanning', 'webhook_integration', 'pr_checks'],
    requiresAuth: true,
    authType: 'token',
  },

  gitlab: {
    id: 'gitlab',
    name: 'GitLab',
    type: 'code_repository',
    description: 'DevOps platform with integrated CI/CD',
    logoUrl: '/integrations/gitlab-logo.png',
    documentationUrl: 'https://docs.gitlab.com/ee/api/',
    configSchema: {
      type: 'object',
      required: ['token'],
      properties: {
        token: { type: 'string', description: 'GitLab Access Token' },
        baseUrl: { type: 'string', default: 'https://gitlab.com/api/v4' },
      },
    },
    supportedFeatures: ['repository_scanning', 'merge_request_integration', 'webhooks'],
    requiresAuth: true,
    authType: 'token',
  },

  // Vulnerability Databases
  nvd: {
    id: 'nvd',
    name: 'National Vulnerability Database',
    type: 'vulnerability_database',
    description: 'NIST vulnerability database',
    logoUrl: '/integrations/nvd-logo.png',
    documentationUrl: 'https://nvd.nist.gov/developers',
    configSchema: {
      type: 'object',
      properties: {
        apiKey: { type: 'string', description: 'NVD API Key (optional for higher rate limits)' },
        baseUrl: { type: 'string', default: 'https://services.nvd.nist.gov/rest/json' },
      },
    },
    supportedFeatures: ['cve_lookup', 'vulnerability_enrichment', 'severity_scoring'],
    requiresAuth: false,
    authType: 'api_key',
  },

  mitre_cwe: {
    id: 'mitre_cwe',
    name: 'MITRE CWE',
    type: 'vulnerability_database',
    description: 'Common Weakness Enumeration database',
    logoUrl: '/integrations/mitre-logo.png',
    documentationUrl: 'https://cwe.mitre.org/',
    configSchema: {
      type: 'object',
      properties: {
        baseUrl: { type: 'string', default: 'https://cwe.mitre.org/data/xml' },
      },
    },
    supportedFeatures: ['weakness_classification', 'taxonomy_mapping', 'remediation_guidance'],
    requiresAuth: false,
    authType: 'api_key',
  },

  // Ticketing Systems
  jira: {
    id: 'jira',
    name: 'Jira',
    type: 'ticketing_system',
    description: 'Issue and project tracking',
    logoUrl: '/integrations/jira-logo.png',
    documentationUrl: 'https://developer.atlassian.com/cloud/jira/platform/rest/v3/',
    configSchema: {
      type: 'object',
      required: ['baseUrl', 'username', 'apiToken'],
      properties: {
        baseUrl: { type: 'string', description: 'Jira Instance URL' },
        username: { type: 'string', description: 'Jira Username/Email' },
        apiToken: { type: 'string', description: 'Jira API Token' },
        projectKey: { type: 'string', description: 'Default Project Key' },
      },
    },
    supportedFeatures: ['ticket_creation', 'status_updates', 'custom_fields'],
    requiresAuth: true,
    authType: 'basic_auth',
  },

  servicenow: {
    id: 'servicenow',
    name: 'ServiceNow',
    type: 'ticketing_system',
    description: 'IT service management platform',
    logoUrl: '/integrations/servicenow-logo.png',
    documentationUrl: 'https://docs.servicenow.com/bundle/tokyo-application-development/page/integrate/web-services-apis/reference/r_TableAPI-GET.html',
    configSchema: {
      type: 'object',
      required: ['baseUrl', 'username', 'password'],
      properties: {
        baseUrl: { type: 'string', description: 'ServiceNow Instance URL' },
        username: { type: 'string', description: 'ServiceNow Username' },
        password: { type: 'string', description: 'ServiceNow Password' },
      },
    },
    supportedFeatures: ['incident_creation', 'change_requests', 'approval_workflows'],
    requiresAuth: true,
    authType: 'basic_auth',
  },

  // SIEM Platforms
  splunk: {
    id: 'splunk',
    name: 'Splunk',
    type: 'siem_platform',
    description: 'Security information and event management',
    logoUrl: '/integrations/splunk-logo.png',
    documentationUrl: 'https://docs.splunk.com/Documentation/Splunk/latest/RESTREF/RESTprolog',
    configSchema: {
      type: 'object',
      required: ['baseUrl', 'username', 'password'],
      properties: {
        baseUrl: { type: 'string', description: 'Splunk Instance URL' },
        username: { type: 'string', description: 'Splunk Username' },
        password: { type: 'string', description: 'Splunk Password' },
      },
    },
    supportedFeatures: ['event_forwarding', 'alert_correlation', 'dashboard_integration'],
    requiresAuth: true,
    authType: 'basic_auth',
  },

  elastic_siem: {
    id: 'elastic_siem',
    name: 'Elastic SIEM',
    type: 'siem_platform',
    description: 'Elasticsearch-based security analytics',
    logoUrl: '/integrations/elastic-logo.png',
    documentationUrl: 'https://www.elastic.co/guide/en/elasticsearch/reference/current/rest-apis.html',
    configSchema: {
      type: 'object',
      required: ['baseUrl', 'apiKey'],
      properties: {
        baseUrl: { type: 'string', description: 'Elasticsearch Cluster URL' },
        apiKey: { type: 'string', description: 'Elasticsearch API Key' },
        indexPrefix: { type: 'string', default: 'appcompatcheck', description: 'Index Prefix' },
      },
    },
    supportedFeatures: ['log_forwarding', 'security_alerts', 'threat_hunting'],
    requiresAuth: true,
    authType: 'api_key',
  },

  // Compliance Frameworks
  aws_security_hub: {
    id: 'aws_security_hub',
    name: 'AWS Security Hub',
    type: 'compliance_framework',
    description: 'AWS cloud security posture management',
    logoUrl: '/integrations/aws-logo.png',
    documentationUrl: 'https://docs.aws.amazon.com/securityhub/1.0/APIReference/Welcome.html',
    configSchema: {
      type: 'object',
      required: ['accessKeyId', 'secretAccessKey', 'region'],
      properties: {
        accessKeyId: { type: 'string', description: 'AWS Access Key ID' },
        secretAccessKey: { type: 'string', description: 'AWS Secret Access Key' },
        region: { type: 'string', description: 'AWS Region' },
        accountId: { type: 'string', description: 'AWS Account ID' },
      },
    },
    supportedFeatures: ['findings_import', 'compliance_status', 'security_standards'],
    requiresAuth: true,
    authType: 'api_key',
  },
};

export function getProvider(providerId: string): IntegrationProvider | undefined {
  return INTEGRATION_PROVIDERS[providerId];
}

export function getProvidersByType(type: string): IntegrationProvider[] {
  return Object.values(INTEGRATION_PROVIDERS).filter(provider => provider.type === type);
}

export function getAllProviders(): IntegrationProvider[] {
  return Object.values(INTEGRATION_PROVIDERS);
}