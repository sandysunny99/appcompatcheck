# System Architecture Diagrams

## Table of Contents
- [High-Level System Architecture](#high-level-system-architecture)
- [Application Architecture](#application-architecture)
- [Database Architecture](#database-architecture)
- [Infrastructure Architecture](#infrastructure-architecture)
- [Security Architecture](#security-architecture)
- [Integration Architecture](#integration-architecture)
- [Deployment Architecture](#deployment-architecture)
- [Scalability Architecture](#scalability-architecture)

## High-Level System Architecture

### Overview
The AppCompatCheck platform follows a modern, cloud-native architecture designed for scalability, maintainability, and security. The system is built using a microservices-inspired approach with clear separation of concerns.

### System Architecture Diagram
```mermaid
graph TB
    subgraph "Client Layer"
        WEB[Web Application<br/>Next.js 15 + React 19]
        API_CLIENT[API Clients<br/>REST + GraphQL]
        MOBILE[Mobile App<br/>React Native - Future]
    end

    subgraph "API Gateway & Load Balancer"
        LB[Load Balancer<br/>Nginx/Cloud LB]
        GATEWAY[API Gateway<br/>Next.js API Routes]
        RATE_LIMIT[Rate Limiting<br/>Redis-based]
    end

    subgraph "Application Layer"
        AUTH[Authentication Service<br/>JWT + RBAC]
        SCAN[Scanning Engine<br/>AI-Powered Analysis]
        REPORT[Report Generator<br/>Multi-format Export]
        NOTIFY[Notification Service<br/>Real-time Updates]
        INTEGRATE[Integration Hub<br/>Third-party APIs]
    end

    subgraph "Data Layer"
        POSTGRES[(PostgreSQL<br/>Primary Database)]
        REDIS[(Redis<br/>Cache + Sessions)]
        FILES[File Storage<br/>AWS S3/MinIO]
        SEARCH[Search Engine<br/>Elasticsearch - Future]
    end

    subgraph "External Services"
        GITHUB[GitHub API]
        GITLAB[GitLab API]
        JIRA[Jira API]
        SLACK[Slack API]
        OPENAI[OpenAI API]
        EMAIL[Email Service<br/>SendGrid]
    end

    subgraph "Infrastructure"
        MONITOR[Monitoring<br/>Prometheus + Grafana]
        LOGS[Logging<br/>Winston + ELK]
        BACKUP[Backup Service<br/>Automated]
        SECURITY[Security Scanning<br/>SAST/DAST]
    end

    WEB --> LB
    API_CLIENT --> LB
    MOBILE --> LB
    
    LB --> GATEWAY
    GATEWAY --> RATE_LIMIT
    
    RATE_LIMIT --> AUTH
    RATE_LIMIT --> SCAN
    RATE_LIMIT --> REPORT
    RATE_LIMIT --> NOTIFY
    RATE_LIMIT --> INTEGRATE
    
    AUTH --> POSTGRES
    AUTH --> REDIS
    SCAN --> POSTGRES
    SCAN --> FILES
    REPORT --> POSTGRES
    REPORT --> FILES
    NOTIFY --> REDIS
    INTEGRATE --> POSTGRES
    
    INTEGRATE --> GITHUB
    INTEGRATE --> GITLAB
    INTEGRATE --> JIRA
    INTEGRATE --> SLACK
    SCAN --> OPENAI
    NOTIFY --> EMAIL
    
    MONITOR --> POSTGRES
    MONITOR --> REDIS
    LOGS --> FILES
    BACKUP --> POSTGRES
    BACKUP --> FILES
```

## Application Architecture

### Next.js Application Structure
```mermaid
graph LR
    subgraph "Frontend (Client-Side)"
        PAGES[Pages<br/>App Router]
        COMPONENTS[React Components<br/>Reusable UI]
        HOOKS[Custom Hooks<br/>State Management]
        UTILS[Utilities<br/>Helper Functions]
        STYLES[Styling<br/>Tailwind CSS]
    end

    subgraph "Backend (Server-Side)"
        API[API Routes<br/>RESTful Endpoints]
        MIDDLEWARE[Middleware<br/>Auth, CORS, Rate Limit]
        SERVICES[Business Logic<br/>Service Layer]
        MODELS[Data Models<br/>Drizzle ORM]
        VALIDATION[Input Validation<br/>Zod Schemas]
    end

    subgraph "Shared"
        TYPES[TypeScript Types<br/>Shared Interfaces]
        CONSTANTS[Constants<br/>Configuration]
        CONFIG[Configuration<br/>Environment]
    end

    PAGES --> API
    COMPONENTS --> HOOKS
    HOOKS --> API
    API --> MIDDLEWARE
    MIDDLEWARE --> SERVICES
    SERVICES --> MODELS
    SERVICES --> VALIDATION
    MODELS --> TYPES
    VALIDATION --> TYPES
```

### Component Architecture
```mermaid
graph TD
    subgraph "UI Components Hierarchy"
        LAYOUT[Layout Components<br/>Header, Sidebar, Footer]
        PAGE_COMP[Page Components<br/>Dashboard, Scans, Reports]
        FEATURE_COMP[Feature Components<br/>ScanResults, ReportViewer]
        BASE_COMP[Base Components<br/>Button, Input, Modal]
        ICONS[Icon Components<br/>Lucide React]
    end

    subgraph "State Management"
        CONTEXT[React Context<br/>Global State]
        ZUSTAND[Zustand Store<br/>Client State]
        SWR[SWR/React Query<br/>Server State]
        LOCAL[Local State<br/>useState, useReducer]
    end

    subgraph "Hooks & Utilities"
        CUSTOM_HOOKS[Custom Hooks<br/>Business Logic]
        API_HOOKS[API Hooks<br/>Data Fetching]
        UI_HOOKS[UI Hooks<br/>Interactions]
        UTILS_HOOKS[Utility Hooks<br/>Common Patterns]
    end

    LAYOUT --> PAGE_COMP
    PAGE_COMP --> FEATURE_COMP
    FEATURE_COMP --> BASE_COMP
    BASE_COMP --> ICONS

    PAGE_COMP --> CONTEXT
    FEATURE_COMP --> ZUSTAND
    API_HOOKS --> SWR
    BASE_COMP --> LOCAL

    CUSTOM_HOOKS --> API_HOOKS
    CUSTOM_HOOKS --> UI_HOOKS
    CUSTOM_HOOKS --> UTILS_HOOKS
```

## Database Architecture

### Database Schema Architecture
```mermaid
graph TB
    subgraph "Core Tables"
        ORG[Organizations<br/>Multi-tenant Root]
        USERS[Users<br/>Authentication]
        SCANS[Scans<br/>Core Entity]
        REPORTS[Reports<br/>Generated Content]
    end

    subgraph "Supporting Tables"
        NOTIFICATIONS[Notifications<br/>User Alerts]
        ACTIVITY[Activity Logs<br/>Audit Trail]
        API_KEYS[API Keys<br/>Programmatic Access]
        INTEGRATIONS[Integrations<br/>Third-party Connections]
    end

    subgraph "Database Features"
        INDEXES[Indexes<br/>Performance]
        CONSTRAINTS[Constraints<br/>Data Integrity]
        TRIGGERS[Triggers<br/>Automated Actions]
        FUNCTIONS[Functions<br/>Business Logic]
    end

    ORG -->|1:N| USERS
    ORG -->|1:N| SCANS
    ORG -->|1:N| REPORTS
    ORG -->|1:N| API_KEYS
    ORG -->|1:N| INTEGRATIONS

    USERS -->|1:N| SCANS
    USERS -->|1:N| REPORTS
    USERS -->|1:N| NOTIFICATIONS
    USERS -->|1:N| ACTIVITY

    SCANS -->|1:N| REPORTS
    SCANS -->|1:N| NOTIFICATIONS
    SCANS -->|1:N| ACTIVITY

    INDEXES --> ORG
    INDEXES --> USERS
    INDEXES --> SCANS
    CONSTRAINTS --> ORG
    CONSTRAINTS --> USERS
    TRIGGERS --> ACTIVITY
```

### Data Flow Architecture
```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Auth
    participant Service
    participant Database
    participant Cache
    participant Queue

    Client->>API: HTTP Request
    API->>Auth: Validate Token
    Auth->>Cache: Check Session
    Cache-->>Auth: Session Data
    Auth-->>API: User Context
    
    API->>Service: Business Logic
    Service->>Database: Query Data
    Database-->>Service: Result Set
    Service->>Cache: Cache Result
    Service-->>API: Processed Data
    
    API-->>Client: HTTP Response
    
    Note over Queue: Async Operations
    Service->>Queue: Background Job
    Queue->>Service: Process Job
    Service->>Database: Update Data
```

## Infrastructure Architecture

### Cloud Infrastructure (Production)
```mermaid
graph TB
    subgraph "Edge Layer"
        CDN[Content Delivery Network<br/>CloudFlare/AWS CloudFront]
        WAF[Web Application Firewall<br/>DDoS Protection]
    end

    subgraph "Load Balancing"
        ALB[Application Load Balancer<br/>SSL Termination]
        TG[Target Groups<br/>Health Checks]
    end

    subgraph "Compute Layer"
        K8S[Kubernetes Cluster<br/>Container Orchestration]
        NODES[Worker Nodes<br/>Auto-scaling]
        PODS[Application Pods<br/>Next.js Apps]
    end

    subgraph "Data Layer"
        RDS[Amazon RDS<br/>PostgreSQL Multi-AZ]
        ELASTICACHE[ElastiCache<br/>Redis Cluster]
        S3[Amazon S3<br/>File Storage]
    end

    subgraph "Monitoring & Logging"
        CLOUDWATCH[CloudWatch<br/>Metrics & Logs]
        XRAY[X-Ray<br/>Distributed Tracing]
        PROMETHEUS[Prometheus<br/>Custom Metrics]
        GRAFANA[Grafana<br/>Dashboards]
    end

    subgraph "Security & Compliance"
        IAM[IAM Roles<br/>Access Control]
        SECRETS[Secrets Manager<br/>Credential Storage]
        VPC[VPC<br/>Network Isolation]
        SECURITY_GROUPS[Security Groups<br/>Firewall Rules]
    end

    CDN --> WAF
    WAF --> ALB
    ALB --> TG
    TG --> K8S
    K8S --> NODES
    NODES --> PODS

    PODS --> RDS
    PODS --> ELASTICACHE
    PODS --> S3

    PODS --> CLOUDWATCH
    PODS --> XRAY
    CLOUDWATCH --> PROMETHEUS
    PROMETHEUS --> GRAFANA

    PODS --> IAM
    PODS --> SECRETS
    K8S --> VPC
    VPC --> SECURITY_GROUPS
```

### Container Architecture
```mermaid
graph TB
    subgraph "Docker Images"
        APP_IMAGE[App Image<br/>Node.js + Next.js]
        NGINX_IMAGE[Nginx Image<br/>Reverse Proxy]
        POSTGRES_IMAGE[PostgreSQL Image<br/>Database]
        REDIS_IMAGE[Redis Image<br/>Cache]
    end

    subgraph "Kubernetes Resources"
        DEPLOYMENT[Deployments<br/>App Replicas]
        SERVICE[Services<br/>Load Balancing]
        INGRESS[Ingress<br/>External Access]
        CONFIGMAP[ConfigMaps<br/>Configuration]
        SECRETS[Secrets<br/>Sensitive Data]
        PVC[Persistent Volumes<br/>Data Storage]
    end

    subgraph "Resource Management"
        HPA[Horizontal Pod Autoscaler<br/>Auto-scaling]
        RESOURCE_LIMITS[Resource Limits<br/>CPU & Memory]
        HEALTH_CHECKS[Health Checks<br/>Liveness & Readiness]
    end

    APP_IMAGE --> DEPLOYMENT
    NGINX_IMAGE --> DEPLOYMENT
    POSTGRES_IMAGE --> DEPLOYMENT
    REDIS_IMAGE --> DEPLOYMENT

    DEPLOYMENT --> SERVICE
    SERVICE --> INGRESS
    DEPLOYMENT --> CONFIGMAP
    DEPLOYMENT --> SECRETS
    DEPLOYMENT --> PVC

    DEPLOYMENT --> HPA
    DEPLOYMENT --> RESOURCE_LIMITS
    DEPLOYMENT --> HEALTH_CHECKS
```

## Security Architecture

### Authentication & Authorization Flow
```mermaid
graph TB
    subgraph "Authentication Layer"
        LOGIN[Login Endpoint<br/>Email/Password]
        JWT_GEN[JWT Generator<br/>Token Creation]
        REFRESH[Token Refresh<br/>Extended Sessions]
        LOGOUT[Logout Handler<br/>Token Invalidation]
    end

    subgraph "Authorization Layer"
        RBAC[Role-Based Access Control<br/>Permissions Matrix]
        MIDDLEWARE[Auth Middleware<br/>Request Validation]
        CONTEXT[User Context<br/>Request Scope]
    end

    subgraph "Security Measures"
        RATE_LIMIT[Rate Limiting<br/>DDoS Protection]
        ENCRYPTION[Data Encryption<br/>At Rest & Transit]
        AUDIT[Audit Logging<br/>Access Tracking]
        VALIDATION[Input Validation<br/>XSS/SQLi Prevention]
    end

    subgraph "External Security"
        WAF[Web Application Firewall<br/>Layer 7 Protection]
        SSL[SSL/TLS Certificates<br/>HTTPS Enforcement]
        CORS[CORS Policy<br/>Origin Control]
        CSP[Content Security Policy<br/>XSS Protection]
    end

    LOGIN --> JWT_GEN
    JWT_GEN --> REFRESH
    REFRESH --> LOGOUT

    JWT_GEN --> RBAC
    RBAC --> MIDDLEWARE
    MIDDLEWARE --> CONTEXT

    MIDDLEWARE --> RATE_LIMIT
    MIDDLEWARE --> ENCRYPTION
    MIDDLEWARE --> AUDIT
    MIDDLEWARE --> VALIDATION

    WAF --> SSL
    SSL --> CORS
    CORS --> CSP
```

### Data Security Architecture
```mermaid
graph LR
    subgraph "Data at Rest"
        DB_ENCRYPT[Database Encryption<br/>AES-256]
        FILE_ENCRYPT[File Encryption<br/>S3 Server-side]
        BACKUP_ENCRYPT[Backup Encryption<br/>Automated]
    end

    subgraph "Data in Transit"
        TLS[TLS 1.3<br/>All Communications]
        API_ENCRYPT[API Encryption<br/>HTTPS Only]
        INTERNAL_TLS[Internal TLS<br/>Service-to-service]
    end

    subgraph "Access Control"
        NETWORK_ACL[Network ACLs<br/>Subnet Isolation]
        FIREWALL[Security Groups<br/>Port Restrictions]
        VPN[VPN Access<br/>Admin Operations]
    end

    subgraph "Key Management"
        KMS[Key Management Service<br/>AWS KMS/HashiCorp Vault]
        ROTATION[Key Rotation<br/>Automated Schedule]
        SECRETS_MGR[Secrets Manager<br/>Credential Storage]
    end

    DB_ENCRYPT --> KMS
    FILE_ENCRYPT --> KMS
    BACKUP_ENCRYPT --> KMS

    TLS --> SECRETS_MGR
    API_ENCRYPT --> SECRETS_MGR
    INTERNAL_TLS --> SECRETS_MGR

    NETWORK_ACL --> VPN
    FIREWALL --> VPN

    KMS --> ROTATION
    ROTATION --> SECRETS_MGR
```

## Integration Architecture

### Third-Party Integrations
```mermaid
graph TB
    subgraph "Version Control Systems"
        GITHUB_INT[GitHub Integration<br/>Webhooks + API]
        GITLAB_INT[GitLab Integration<br/>Webhooks + API]
        BITBUCKET_INT[Bitbucket Integration<br/>Webhooks + API]
    end

    subgraph "Project Management"
        JIRA_INT[Jira Integration<br/>Issue Tracking]
        ASANA_INT[Asana Integration<br/>Task Management]
        TRELLO_INT[Trello Integration<br/>Board Sync]
    end

    subgraph "Communication"
        SLACK_INT[Slack Integration<br/>Notifications]
        TEAMS_INT[Microsoft Teams<br/>Alerts]
        DISCORD_INT[Discord Integration<br/>Community Alerts]
    end

    subgraph "AI/ML Services"
        OPENAI_INT[OpenAI Integration<br/>Code Analysis]
        ANTHROPIC_INT[Anthropic Claude<br/>Alternative AI]
        HUGGINGFACE_INT[Hugging Face<br/>Custom Models]
    end

    subgraph "Integration Hub"
        WEBHOOK_HANDLER[Webhook Handler<br/>Event Processing]
        API_CLIENT[API Client Library<br/>Standardized Requests]
        EVENT_QUEUE[Event Queue<br/>Async Processing]
        RETRY_LOGIC[Retry Logic<br/>Fault Tolerance]
    end

    GITHUB_INT --> WEBHOOK_HANDLER
    GITLAB_INT --> WEBHOOK_HANDLER
    BITBUCKET_INT --> WEBHOOK_HANDLER

    JIRA_INT --> API_CLIENT
    ASANA_INT --> API_CLIENT
    TRELLO_INT --> API_CLIENT

    SLACK_INT --> API_CLIENT
    TEAMS_INT --> API_CLIENT
    DISCORD_INT --> API_CLIENT

    OPENAI_INT --> API_CLIENT
    ANTHROPIC_INT --> API_CLIENT
    HUGGINGFACE_INT --> API_CLIENT

    WEBHOOK_HANDLER --> EVENT_QUEUE
    API_CLIENT --> EVENT_QUEUE
    EVENT_QUEUE --> RETRY_LOGIC
```

### API Integration Patterns
```mermaid
sequenceDiagram
    participant Client
    participant API Gateway
    participant Integration Service
    participant External API
    participant Database
    participant Queue

    Client->>API Gateway: Request Integration
    API Gateway->>Integration Service: Process Request
    Integration Service->>Database: Store Integration Config
    Integration Service->>External API: Setup Webhook
    External API-->>Integration Service: Webhook Confirmation
    Integration Service-->>API Gateway: Configuration Complete
    API Gateway-->>Client: Success Response

    Note over External API, Queue: Async Event Processing
    External API->>API Gateway: Webhook Event
    API Gateway->>Queue: Queue Event
    Queue->>Integration Service: Process Event
    Integration Service->>Database: Update Data
    Integration Service->>Client: Real-time Update (WebSocket)
```

## Deployment Architecture

### Multi-Environment Deployment
```mermaid
graph TB
    subgraph "Development"
        DEV_LOCAL[Local Development<br/>Docker Compose]
        DEV_DB[PostgreSQL<br/>Local Instance]
        DEV_REDIS[Redis<br/>Local Instance]
    end

    subgraph "Staging"
        STAGING_K8S[Kubernetes Cluster<br/>Staging Namespace]
        STAGING_DB[RDS Staging<br/>Smaller Instance]
        STAGING_REDIS[ElastiCache<br/>Single Node]
    end

    subgraph "Production"
        PROD_K8S[Kubernetes Cluster<br/>Production Namespace]
        PROD_DB[RDS Production<br/>Multi-AZ]
        PROD_REDIS[ElastiCache<br/>Cluster Mode]
    end

    subgraph "CI/CD Pipeline"
        GITHUB_ACTIONS[GitHub Actions<br/>Automated Pipeline]
        BUILD[Build & Test<br/>Docker Images]
        DEPLOY_STAGING[Deploy to Staging<br/>Automated]
        DEPLOY_PROD[Deploy to Production<br/>Manual Approval]
    end

    DEV_LOCAL --> GITHUB_ACTIONS
    GITHUB_ACTIONS --> BUILD
    BUILD --> DEPLOY_STAGING
    DEPLOY_STAGING --> STAGING_K8S
    STAGING_K8S --> STAGING_DB
    STAGING_K8S --> STAGING_REDIS

    DEPLOY_STAGING --> DEPLOY_PROD
    DEPLOY_PROD --> PROD_K8S
    PROD_K8S --> PROD_DB
    PROD_K8S --> PROD_REDIS
```

### Blue-Green Deployment Strategy
```mermaid
graph LR
    subgraph "Load Balancer"
        LB[Application Load Balancer<br/>Traffic Router]
    end

    subgraph "Blue Environment (Current)"
        BLUE_APP[Blue Application<br/>Version 1.0]
        BLUE_DB[Blue Database<br/>Shared Resource]
    end

    subgraph "Green Environment (New)"
        GREEN_APP[Green Application<br/>Version 1.1]
        GREEN_DB[Green Database<br/>Shared Resource]
    end

    subgraph "Deployment Process"
        HEALTH_CHECK[Health Checks<br/>Automated Testing]
        TRAFFIC_SHIFT[Traffic Shifting<br/>Gradual Migration]
        ROLLBACK[Rollback Capability<br/>Instant Switch]
    end

    LB --> BLUE_APP
    LB -.-> GREEN_APP
    BLUE_APP --> BLUE_DB
    GREEN_APP --> GREEN_DB

    GREEN_APP --> HEALTH_CHECK
    HEALTH_CHECK --> TRAFFIC_SHIFT
    TRAFFIC_SHIFT --> ROLLBACK
```

## Scalability Architecture

### Horizontal Scaling Strategy
```mermaid
graph TB
    subgraph "Application Scaling"
        HPA[Horizontal Pod Autoscaler<br/>CPU/Memory Based]
        REPLICAS[Pod Replicas<br/>2-10 Instances]
        LOAD_BALANCER[Service Load Balancer<br/>Traffic Distribution]
    end

    subgraph "Database Scaling"
        READ_REPLICAS[Read Replicas<br/>Query Distribution]
        CONNECTION_POOL[Connection Pooling<br/>PgBouncer]
        QUERY_CACHE[Query Caching<br/>Redis Layer]
    end

    subgraph "Cache Scaling"
        REDIS_CLUSTER[Redis Cluster<br/>Distributed Cache]
        CACHE_LAYERS[Multi-layer Caching<br/>L1/L2 Strategy]
        CDN_CACHE[CDN Caching<br/>Static Assets]
    end

    subgraph "Queue Scaling"
        QUEUE_WORKERS[Worker Processes<br/>Background Jobs]
        QUEUE_CLUSTER[Queue Clustering<br/>Redis/SQS]
        PRIORITY_QUEUES[Priority Queues<br/>Job Classification]
    end

    HPA --> REPLICAS
    REPLICAS --> LOAD_BALANCER

    READ_REPLICAS --> CONNECTION_POOL
    CONNECTION_POOL --> QUERY_CACHE

    REDIS_CLUSTER --> CACHE_LAYERS
    CACHE_LAYERS --> CDN_CACHE

    QUEUE_WORKERS --> QUEUE_CLUSTER
    QUEUE_CLUSTER --> PRIORITY_QUEUES
```

### Performance Optimization Architecture
```mermaid
graph TB
    subgraph "Frontend Optimization"
        CODE_SPLIT[Code Splitting<br/>Dynamic Imports]
        LAZY_LOAD[Lazy Loading<br/>Component Loading]
        IMAGE_OPT[Image Optimization<br/>Next.js Optimization]
        BUNDLE_OPT[Bundle Optimization<br/>Tree Shaking]
    end

    subgraph "Backend Optimization"
        API_CACHE[API Response Caching<br/>Redis TTL]
        DB_INDEX[Database Indexing<br/>Query Optimization]
        COMPRESSION[Response Compression<br/>Gzip/Brotli]
        PAGINATION[Data Pagination<br/>Cursor-based]
    end

    subgraph "Infrastructure Optimization"
        AUTO_SCALE[Auto-scaling<br/>Resource Adaptation]
        RESOURCE_LIMITS[Resource Limits<br/>Container Constraints]
        HEALTH_MONITORING[Health Monitoring<br/>Proactive Scaling]
    end

    CODE_SPLIT --> LAZY_LOAD
    LAZY_LOAD --> IMAGE_OPT
    IMAGE_OPT --> BUNDLE_OPT

    API_CACHE --> DB_INDEX
    DB_INDEX --> COMPRESSION
    COMPRESSION --> PAGINATION

    AUTO_SCALE --> RESOURCE_LIMITS
    RESOURCE_LIMITS --> HEALTH_MONITORING
```

### Monitoring & Observability Architecture
```mermaid
graph TB
    subgraph "Metrics Collection"
        PROMETHEUS[Prometheus<br/>Metrics Storage]
        GRAFANA[Grafana<br/>Visualization]
        CUSTOM_METRICS[Custom Metrics<br/>Business KPIs]
    end

    subgraph "Logging"
        WINSTON[Winston Logger<br/>Application Logs]
        ELK[ELK Stack<br/>Log Aggregation]
        LOG_LEVELS[Log Levels<br/>Structured Logging]
    end

    subgraph "Tracing"
        JAEGER[Jaeger<br/>Distributed Tracing]
        OPENTELEMETRY[OpenTelemetry<br/>Instrumentation]
        PERFORMANCE[Performance Monitoring<br/>APM]
    end

    subgraph "Alerting"
        ALERTMANAGER[Alert Manager<br/>Rule Engine]
        NOTIFICATIONS[Notification Channels<br/>Slack, Email, PagerDuty]
        ESCALATION[Escalation Policies<br/>On-call Rotation]
    end

    PROMETHEUS --> GRAFANA
    PROMETHEUS --> CUSTOM_METRICS
    
    WINSTON --> ELK
    ELK --> LOG_LEVELS

    JAEGER --> OPENTELEMETRY
    OPENTELEMETRY --> PERFORMANCE

    PROMETHEUS --> ALERTMANAGER
    ALERTMANAGER --> NOTIFICATIONS
    NOTIFICATIONS --> ESCALATION
```

---

*This comprehensive system architecture documentation provides a complete view of the AppCompatCheck platform's technical design, from high-level system components to detailed deployment and scaling strategies.*

![Architecture Diagram Placeholder](../assets/architecture_diagram.png)
*Note: Visual architecture diagrams are available in the assets folder*