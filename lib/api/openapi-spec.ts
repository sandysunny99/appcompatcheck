import { OpenAPIV3 } from 'openapi-types';

export const openApiSpec: OpenAPIV3.Document = {
  openapi: '3.0.3',
  info: {
    title: 'AppCompatCheck API',
    version: '1.0.0',
    description: `
# AppCompatCheck API Documentation

A comprehensive API for analyzing application compatibility with security tools and managing security vulnerabilities.

## Features

- 🔍 **Compatibility Analysis**: Analyze security tool compatibility with applications
- 📊 **Real-time Monitoring**: System health and performance monitoring  
- 👥 **Multi-Tenancy**: Organization and team management
- 🔐 **Security**: JWT authentication with role-based access control
- 📈 **Analytics**: Detailed reports and trend analysis
- ⚡ **Performance**: Optimized with caching and rate limiting

## Authentication

Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:

\`\`\`
Authorization: Bearer YOUR_JWT_TOKEN
\`\`\`

## Rate Limiting

API requests are rate-limited based on your subscription plan:
- **Free**: 100 requests/hour
- **Pro**: 1,000 requests/hour  
- **Enterprise**: 10,000 requests/hour

## Error Handling

The API uses standard HTTP status codes and returns detailed error information:

\`\`\`json
{
  "error": "Detailed error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional context"
  }
}
\`\`\`
    `,
    contact: {
      name: 'AppCompatCheck Support',
      email: 'support@appcompatcheck.com',
      url: 'https://appcompatcheck.com/support'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: 'http://localhost:3000/api',
      description: 'Development server'
    },
    {
      url: 'https://api.appcompatcheck.com',
      description: 'Production server'
    }
  ],
  security: [
    {
      bearerAuth: []
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT authorization header using the Bearer scheme'
      }
    },
    schemas: {
      // Error schemas
      Error: {
        type: 'object',
        required: ['error'],
        properties: {
          error: {
            type: 'string',
            description: 'Error message'
          },
          code: {
            type: 'string',
            description: 'Error code'
          },
          details: {
            type: 'object',
            description: 'Additional error details'
          }
        }
      },
      ValidationError: {
        type: 'object',
        required: ['error', 'details'],
        properties: {
          error: {
            type: 'string',
            example: 'Validation failed'
          },
          details: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: { type: 'string' },
                message: { type: 'string' }
              }
            }
          }
        }
      },

      // User schemas
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            description: 'User ID'
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address'
          },
          name: {
            type: 'string',
            description: 'User full name'
          },
          role: {
            type: 'string',
            enum: ['USER', 'ORG_ADMIN', 'ADMIN'],
            description: 'User role'
          },
          organizationId: {
            type: 'integer',
            nullable: true,
            description: 'Associated organization ID'
          },
          isActive: {
            type: 'boolean',
            description: 'Whether user account is active'
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Account creation timestamp'
          }
        }
      },

      // Organization schemas
      Organization: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            description: 'Organization ID'
          },
          name: {
            type: 'string',
            description: 'Organization name'
          },
          slug: {
            type: 'string',
            description: 'URL-friendly organization identifier'
          },
          plan: {
            type: 'string',
            enum: ['FREE', 'PRO', 'ENTERPRISE'],
            description: 'Subscription plan'
          },
          isActive: {
            type: 'boolean',
            description: 'Whether organization is active'
          },
          settings: {
            type: 'object',
            description: 'Organization settings'
          },
          createdAt: {
            type: 'string',
            format: 'date-time'
          }
        }
      },

      // Scan schemas
      ScanSession: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Scan session ID'
          },
          userId: {
            type: 'integer',
            description: 'User who initiated the scan'
          },
          organizationId: {
            type: 'integer',
            nullable: true,
            description: 'Associated organization'
          },
          fileName: {
            type: 'string',
            description: 'Original uploaded file name'
          },
          status: {
            type: 'string',
            enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'],
            description: 'Current scan status'
          },
          totalRules: {
            type: 'integer',
            description: 'Total compatibility rules checked'
          },
          passedRules: {
            type: 'integer',
            description: 'Number of rules that passed'
          },
          failedRules: {
            type: 'integer',
            description: 'Number of rules that failed'
          },
          riskScore: {
            type: 'number',
            format: 'float',
            minimum: 0,
            maximum: 100,
            description: 'Overall risk score (0-100)'
          },
          analysisResults: {
            type: 'object',
            description: 'Detailed analysis results'
          },
          createdAt: {
            type: 'string',
            format: 'date-time'
          },
          completedAt: {
            type: 'string',
            format: 'date-time',
            nullable: true
          }
        }
      },

      // Monitoring schemas
      SystemHealth: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['healthy', 'degraded', 'unhealthy'],
            description: 'Overall system status'
          },
          score: {
            type: 'number',
            format: 'float',
            minimum: 0,
            maximum: 100,
            description: 'Health score (0-100)'
          },
          alerts: {
            type: 'integer',
            description: 'Number of active alerts'
          },
          uptime: {
            type: 'number',
            description: 'System uptime in seconds'
          },
          lastCheck: {
            type: 'integer',
            description: 'Last health check timestamp'
          },
          components: {
            type: 'object',
            properties: {
              database: {
                type: 'object',
                properties: {
                  status: { type: 'string', enum: ['healthy', 'degraded', 'unhealthy'] },
                  responseTime: { type: 'number', description: 'Response time in ms' },
                  connections: { type: 'integer', description: 'Active connections' }
                }
              },
              redis: {
                type: 'object',
                properties: {
                  status: { type: 'string', enum: ['healthy', 'degraded', 'unhealthy'] },
                  responseTime: { type: 'number', description: 'Response time in ms' },
                  memory: { type: 'integer', description: 'Memory usage in bytes' }
                }
              },
              application: {
                type: 'object',
                properties: {
                  status: { type: 'string', enum: ['healthy', 'degraded', 'unhealthy'] },
                  activeUsers: { type: 'integer', description: 'Number of active users' },
                  requestsPerMinute: { type: 'number', description: 'Current request rate' }
                }
              }
            }
          }
        }
      },

      // Report schemas
      Report: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            description: 'Report ID'
          },
          scanSessionId: {
            type: 'string',
            description: 'Associated scan session'
          },
          type: {
            type: 'string',
            enum: ['PDF', 'CSV', 'JSON'],
            description: 'Report format'
          },
          status: {
            type: 'string',
            enum: ['GENERATING', 'COMPLETED', 'FAILED'],
            description: 'Report generation status'
          },
          downloadUrl: {
            type: 'string',
            nullable: true,
            description: 'Download URL when completed'
          },
          size: {
            type: 'integer',
            nullable: true,
            description: 'File size in bytes'
          },
          createdAt: {
            type: 'string',
            format: 'date-time'
          },
          expiresAt: {
            type: 'string',
            format: 'date-time',
            description: 'When download link expires'
          }
        }
      }
    },
    responses: {
      NotFound: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            },
            example: {
              error: 'Resource not found',
              code: 'NOT_FOUND'
            }
          }
        }
      },
      Unauthorized: {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            },
            example: {
              error: 'Authentication required',
              code: 'UNAUTHORIZED'
            }
          }
        }
      },
      Forbidden: {
        description: 'Insufficient permissions',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            },
            example: {
              error: 'Insufficient permissions',
              code: 'FORBIDDEN'
            }
          }
        }
      },
      ValidationError: {
        description: 'Invalid input data',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ValidationError'
            }
          }
        }
      }
    }
  },
  paths: {
    // User endpoints
    '/user': {
      get: {
        tags: ['Users'],
        summary: 'Get current user profile',
        description: 'Retrieve the profile information for the authenticated user',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'User profile retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/User'
                }
              }
            }
          },
          '401': {
            $ref: '#/components/responses/Unauthorized'
          }
        }
      }
    },

    // Organization endpoints
    '/organizations': {
      get: {
        tags: ['Organizations'],
        summary: 'List organizations',
        description: 'Get a list of organizations the user has access to',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'page',
            in: 'query',
            description: 'Page number for pagination',
            schema: {
              type: 'integer',
              minimum: 1,
              default: 1
            }
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Number of items per page',
            schema: {
              type: 'integer',
              minimum: 1,
              maximum: 100,
              default: 20
            }
          }
        ],
        responses: {
          '200': {
            description: 'Organizations retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    organizations: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/Organization'
                      }
                    },
                    pagination: {
                      type: 'object',
                      properties: {
                        page: { type: 'integer' },
                        limit: { type: 'integer' },
                        total: { type: 'integer' },
                        totalPages: { type: 'integer' }
                      }
                    }
                  }
                }
              }
            }
          },
          '401': {
            $ref: '#/components/responses/Unauthorized'
          }
        }
      },
      post: {
        tags: ['Organizations'],
        summary: 'Create new organization',
        description: 'Create a new organization (requires admin permissions)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'slug'],
                properties: {
                  name: {
                    type: 'string',
                    minLength: 1,
                    maxLength: 255,
                    description: 'Organization name'
                  },
                  slug: {
                    type: 'string',
                    pattern: '^[a-z0-9-]+$',
                    minLength: 1,
                    maxLength: 100,
                    description: 'URL-friendly identifier'
                  },
                  plan: {
                    type: 'string',
                    enum: ['FREE', 'PRO', 'ENTERPRISE'],
                    default: 'FREE',
                    description: 'Subscription plan'
                  }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Organization created successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Organization'
                }
              }
            }
          },
          '400': {
            $ref: '#/components/responses/ValidationError'
          },
          '401': {
            $ref: '#/components/responses/Unauthorized'
          },
          '403': {
            $ref: '#/components/responses/Forbidden'
          }
        }
      }
    },

    '/organizations/{id}': {
      get: {
        tags: ['Organizations'],
        summary: 'Get organization details',
        description: 'Retrieve detailed information about a specific organization',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Organization ID',
            schema: {
              type: 'integer'
            }
          }
        ],
        responses: {
          '200': {
            description: 'Organization details retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    organization: {
                      $ref: '#/components/schemas/Organization'
                    },
                    stats: {
                      type: 'object',
                      properties: {
                        totalMembers: { type: 'integer' },
                        activeMembers: { type: 'integer' },
                        totalTeams: { type: 'integer' },
                        monthlyScans: { type: 'integer' },
                        storageUsed: { type: 'integer' },
                        apiCalls: { type: 'integer' }
                      }
                    }
                  }
                }
              }
            }
          },
          '401': {
            $ref: '#/components/responses/Unauthorized'
          },
          '403': {
            $ref: '#/components/responses/Forbidden'
          },
          '404': {
            $ref: '#/components/responses/NotFound'
          }
        }
      }
    },

    // Scan endpoints
    '/scan': {
      post: {
        tags: ['Scanning'],
        summary: 'Start compatibility scan',
        description: 'Upload security data and start compatibility analysis',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['file'],
                properties: {
                  file: {
                    type: 'string',
                    format: 'binary',
                    description: 'Security log file (JSON/CSV)'
                  },
                  dataType: {
                    type: 'string',
                    enum: ['security_log', 'compatibility_data'],
                    description: 'Type of uploaded data'
                  },
                  rules: {
                    type: 'array',
                    items: {
                      type: 'integer'
                    },
                    description: 'Specific rule IDs to apply (optional)'
                  }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Scan started successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    sessionId: {
                      type: 'string',
                      description: 'Scan session ID for tracking'
                    },
                    status: {
                      type: 'string',
                      enum: ['PENDING', 'PROCESSING']
                    },
                    estimatedTime: {
                      type: 'integer',
                      description: 'Estimated completion time in seconds'
                    }
                  }
                }
              }
            }
          },
          '400': {
            $ref: '#/components/responses/ValidationError'
          },
          '401': {
            $ref: '#/components/responses/Unauthorized'
          }
        }
      }
    },

    // Monitoring endpoints
    '/monitoring/health': {
      get: {
        tags: ['Monitoring'],
        summary: 'Get system health',
        description: 'Retrieve current system health status and metrics',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'System health retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/SystemHealth'
                }
              }
            }
          },
          '401': {
            $ref: '#/components/responses/Unauthorized'
          },
          '503': {
            description: 'Service unavailable',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          }
        }
      }
    },

    '/monitoring/metrics': {
      get: {
        tags: ['Monitoring'],
        summary: 'Get system metrics',
        description: 'Retrieve detailed performance metrics',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'timeRange',
            in: 'query',
            description: 'Time range for metrics',
            schema: {
              type: 'string',
              enum: ['1h', '24h', '7d', '30d'],
              default: '24h'
            }
          },
          {
            name: 'metric',
            in: 'query',
            description: 'Specific metric to retrieve',
            schema: {
              type: 'string',
              enum: ['cpu', 'memory', 'requests', 'errors', 'database']
            }
          }
        ],
        responses: {
          '200': {
            description: 'Metrics retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    timeRange: { type: 'string' },
                    metrics: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          timestamp: { type: 'integer' },
                          value: { type: 'number' },
                          metric: { type: 'string' }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          '401': {
            $ref: '#/components/responses/Unauthorized'
          }
        }
      }
    }
  },
  tags: [
    {
      name: 'Users',
      description: 'User account management and authentication'
    },
    {
      name: 'Organizations',
      description: 'Multi-tenant organization management'
    },
    {
      name: 'Scanning',
      description: 'Security compatibility analysis and scanning'
    },
    {
      name: 'Monitoring',
      description: 'System health and performance monitoring'
    },
    {
      name: 'Reports',
      description: 'Report generation and download'
    }
  ]
};