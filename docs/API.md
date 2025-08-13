# AppCompatCheck API Documentation

## Overview

The AppCompatCheck API provides comprehensive access to all platform functionality including scan management, user authentication, organization administration, and system monitoring. The API follows REST principles and is fully documented with OpenAPI 3.0.3 specification.

## Base URL

```
Production: https://appcompatcheck.com/api
Development: http://localhost:3000/api
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

### Obtaining a Token

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your-password"
}
```

Response:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user",
    "organizationId": "org-456"
  }
}
```

## Rate Limiting

The API enforces rate limiting to ensure fair usage:

- **Authentication endpoints**: 5 requests per minute per IP
- **General API endpoints**: 100 requests per 15 minutes per user
- **File upload endpoints**: 10 requests per minute per user
- **Scan execution**: 5 concurrent scans per organization

Rate limit headers are included in responses:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Invalid input data",
  "details": {
    "field": "email",
    "code": "INVALID_FORMAT",
    "message": "Email format is invalid"
  },
  "timestamp": "2024-01-01T12:00:00Z",
  "requestId": "req-123"
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Unprocessable Entity
- `429` - Too Many Requests
- `500` - Internal Server Error

## Core Endpoints

### Authentication

#### Login
```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt-token",
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user",
    "organizationId": "org-456"
  }
}
```

#### Register
```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "user@example.com",
  "password": "password123",
  "organizationName": "My Company"
}
```

#### Logout
```http
POST /api/auth/logout
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

### Scans

#### List Scans
```http
GET /api/scans?page=1&limit=10&status=completed&type=compatibility
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10, max: 100)
- `status` (string): Filter by status (pending, running, completed, failed, cancelled)
- `type` (string): Filter by type (compatibility, security, performance)
- `search` (string): Search in scan names and descriptions
- `sortBy` (string): Sort field (createdAt, updatedAt, name)
- `sortOrder` (string): Sort order (asc, desc)

**Response:**
```json
{
  "success": true,
  "data": {
    "scans": [
      {
        "id": "scan-123",
        "name": "Frontend Compatibility Check",
        "description": "Check React app compatibility",
        "type": "compatibility",
        "status": "completed",
        "progress": 100,
        "summary": {
          "totalFiles": 45,
          "filesWithIssues": 12,
          "totalIssues": 28,
          "criticalIssues": 2,
          "highIssues": 8,
          "mediumIssues": 12,
          "lowIssues": 6
        },
        "createdAt": "2024-01-01T10:00:00Z",
        "updatedAt": "2024-01-01T10:15:00Z",
        "completedAt": "2024-01-01T10:15:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

#### Create Scan
```http
POST /api/scans
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "My Compatibility Scan",
  "description": "Scan for compatibility issues",
  "type": "compatibility",
  "config": {
    "rules": ["deprecated-api", "security-issues", "performance"],
    "fileTypes": ["js", "ts", "jsx", "tsx"],
    "excludePatterns": ["node_modules", "dist", "build"],
    "includePatterns": ["src/**"],
    "strictMode": true
  }
}
```

#### Get Scan Details
```http
GET /api/scans/{scanId}
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "scan": {
      "id": "scan-123",
      "name": "Frontend Compatibility Check",
      "description": "Check React app compatibility",
      "type": "compatibility",
      "status": "completed",
      "progress": 100,
      "config": {
        "rules": ["deprecated-api", "security-issues"],
        "fileTypes": ["js", "ts", "jsx", "tsx"]
      },
      "files": [
        {
          "path": "src/components/Header.tsx",
          "size": 2048,
          "status": "processed",
          "issues": [
            {
              "id": "issue-456",
              "ruleId": "deprecated-api",
              "severity": "high",
              "message": "Use of deprecated React.findDOMNode",
              "line": 15,
              "column": 10,
              "suggestion": "Use ref callbacks instead"
            }
          ]
        }
      ],
      "summary": {
        "totalFiles": 45,
        "filesWithIssues": 12,
        "totalIssues": 28,
        "criticalIssues": 2,
        "highIssues": 8,
        "mediumIssues": 12,
        "lowIssues": 6
      },
      "createdAt": "2024-01-01T10:00:00Z",
      "updatedAt": "2024-01-01T10:15:00Z",
      "completedAt": "2024-01-01T10:15:00Z"
    }
  }
}
```

#### Start Scan
```http
POST /api/scans/{scanId}/start
Authorization: Bearer <token>
```

#### Cancel Scan
```http
POST /api/scans/{scanId}/cancel
Authorization: Bearer <token>
```

#### Delete Scan
```http
DELETE /api/scans/{scanId}
Authorization: Bearer <token>
```

### File Management

#### Upload Files
```http
POST /api/scans/{scanId}/files
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- `files`: Multiple files to upload
- `overwrite` (boolean): Overwrite existing files

#### List Scan Files
```http
GET /api/scans/{scanId}/files
Authorization: Bearer <token>
```

#### Download File
```http
GET /api/scans/{scanId}/files/{fileId}/download
Authorization: Bearer <token>
```

#### Delete File
```http
DELETE /api/scans/{scanId}/files/{fileId}
Authorization: Bearer <token>
```

### Reports

#### Generate Report
```http
POST /api/scans/{scanId}/reports
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "format": "pdf",
  "sections": ["summary", "issues", "recommendations"],
  "filters": {
    "severities": ["critical", "high"],
    "categories": ["compatibility", "security"]
  }
}
```

#### Download Report
```http
GET /api/scans/{scanId}/reports/{reportId}
Authorization: Bearer <token>
```

### Organizations

#### List Organizations
```http
GET /api/organizations
Authorization: Bearer <token>
```

#### Create Organization
```http
POST /api/organizations
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "My Company",
  "slug": "my-company",
  "description": "Software development company",
  "settings": {
    "allowUserRegistration": true,
    "defaultUserRole": "user",
    "scanRetentionDays": 90
  }
}
```

#### Get Organization Details
```http
GET /api/organizations/{orgId}
Authorization: Bearer <token>
```

#### Update Organization
```http
PATCH /api/organizations/{orgId}
Authorization: Bearer <token>
```

#### Delete Organization
```http
DELETE /api/organizations/{orgId}
Authorization: Bearer <token>
```

### User Management

#### List Users
```http
GET /api/organizations/{orgId}/users
Authorization: Bearer <token>
```

#### Invite User
```http
POST /api/organizations/{orgId}/invitations
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "role": "user",
  "message": "Welcome to our team!"
}
```

#### Update User Role
```http
PATCH /api/organizations/{orgId}/users/{userId}
Authorization: Bearer <token>
```

#### Remove User
```http
DELETE /api/organizations/{orgId}/users/{userId}
Authorization: Bearer <token>
```

### Integrations

#### List Integrations
```http
GET /api/integrations
Authorization: Bearer <token>
```

#### Configure Integration
```http
POST /api/integrations
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "type": "github",
  "name": "GitHub Integration",
  "config": {
    "apiUrl": "https://api.github.com",
    "accessToken": "ghp_...",
    "webhookSecret": "secret123"
  },
  "enabled": true
}
```

#### Test Integration
```http
POST /api/integrations/{integrationId}/test
Authorization: Bearer <token>
```

### Notifications

#### List Notification Channels
```http
GET /api/notifications/channels
Authorization: Bearer <token>
```

#### Create Notification Channel
```http
POST /api/notifications/channels
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "type": "email",
  "name": "Email Notifications",
  "config": {
    "smtp": {
      "host": "smtp.gmail.com",
      "port": 587,
      "user": "notifications@company.com",
      "pass": "app-password"
    }
  },
  "enabled": true
}
```

#### Send Test Notification
```http
POST /api/notifications/test
Authorization: Bearer <token>
```

### Analytics

#### Get Dashboard Data
```http
GET /api/analytics/dashboard
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalScans": 150,
      "completedScans": 142,
      "totalIssues": 1250,
      "criticalIssues": 45
    },
    "trends": {
      "scansOverTime": [
        {"date": "2024-01-01", "count": 12},
        {"date": "2024-01-02", "count": 15}
      ],
      "issuesOverTime": [
        {"date": "2024-01-01", "critical": 2, "high": 8, "medium": 15, "low": 25}
      ]
    },
    "topIssues": [
      {
        "ruleId": "deprecated-api",
        "count": 45,
        "trend": "increasing"
      }
    ]
  }
}
```

#### Get Organization Statistics
```http
GET /api/analytics/organizations/{orgId}/stats
Authorization: Bearer <token>
```

### System

#### Health Check
```http
GET /api/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00Z",
  "version": "1.0.0",
  "services": {
    "database": "healthy",
    "redis": "healthy",
    "storage": "healthy"
  },
  "metrics": {
    "uptime": 86400,
    "requestCount": 12500,
    "errorRate": 0.02
  }
}
```

#### System Information
```http
GET /api/system/info
Authorization: Bearer <admin-token>
```

#### Metrics
```http
GET /api/metrics
```

## WebSocket API

Real-time updates are available via WebSocket connections:

```javascript
const ws = new WebSocket('ws://localhost:3000/api/ws');

// Authenticate
ws.send(JSON.stringify({
  type: 'auth',
  token: 'your-jwt-token'
}));

// Subscribe to scan updates
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'scan-updates',
  scanId: 'scan-123'
}));

// Receive updates
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received update:', data);
};
```

### WebSocket Events

#### Scan Progress
```json
{
  "type": "scan-progress",
  "scanId": "scan-123",
  "progress": 75,
  "currentFile": "src/components/App.tsx",
  "filesProcessed": 34,
  "totalFiles": 45
}
```

#### Scan Completed
```json
{
  "type": "scan-completed",
  "scanId": "scan-123",
  "summary": {
    "totalIssues": 28,
    "criticalIssues": 2
  }
}
```

#### System Notification
```json
{
  "type": "notification",
  "message": "System maintenance scheduled",
  "severity": "info",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

## Webhooks

AppCompatCheck can send webhooks for various events:

### Configuration

```http
POST /api/webhooks
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "url": "https://your-app.com/webhook",
  "events": ["scan.completed", "scan.failed", "user.registered"],
  "secret": "webhook-secret",
  "active": true
}
```

### Webhook Payload

```json
{
  "event": "scan.completed",
  "timestamp": "2024-01-01T12:00:00Z",
  "data": {
    "scanId": "scan-123",
    "organizationId": "org-456",
    "summary": {
      "totalIssues": 28,
      "criticalIssues": 2
    }
  },
  "signature": "sha256=..."
}
```

### Signature Verification

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return `sha256=${expectedSignature}` === signature;
}
```

## SDKs and Libraries

### JavaScript/TypeScript SDK

```bash
npm install @appcompatcheck/sdk
```

```javascript
import { AppCompatCheck } from '@appcompatcheck/sdk';

const client = new AppCompatCheck({
  baseUrl: 'https://appcompatcheck.com/api',
  apiKey: 'your-api-key'
});

// Create a scan
const scan = await client.scans.create({
  name: 'My Scan',
  type: 'compatibility'
});

// Upload files
await client.scans.uploadFiles(scan.id, ['./src/**/*.js']);

// Start scan
await client.scans.start(scan.id);

// Get results
const results = await client.scans.getResults(scan.id);
```

### Python SDK

```bash
pip install appcompatcheck-python
```

```python
from appcompatcheck import Client

client = Client(
    base_url='https://appcompatcheck.com/api',
    api_key='your-api-key'
)

# Create and run scan
scan = client.scans.create(
    name='My Scan',
    type='compatibility'
)

client.scans.upload_files(scan['id'], ['./src/**/*.py'])
client.scans.start(scan['id'])

# Wait for completion
results = client.scans.wait_for_completion(scan['id'])
```

## API Versioning

The API uses URL versioning:
- Current version: `/api/v1/`
- Previous versions remain available for 12 months
- Version deprecation notices sent 6 months in advance

## Best Practices

### Authentication
- Store JWT tokens securely
- Implement token refresh logic
- Use HTTPS in production
- Validate token expiration

### Rate Limiting
- Implement exponential backoff
- Monitor rate limit headers
- Use batch operations when available
- Cache responses when appropriate

### Error Handling
- Always check response status codes
- Parse error messages for user display
- Implement retry logic for transient errors
- Log errors for debugging

### Performance
- Use pagination for large datasets
- Implement client-side caching
- Compress request payloads
- Use WebSocket for real-time updates

## Support

For API support and questions:
- **Documentation**: https://appcompatcheck.com/docs
- **Support Email**: api-support@appcompatcheck.com
- **GitHub Issues**: https://github.com/appcompatcheck/api/issues
- **Status Page**: https://status.appcompatcheck.com