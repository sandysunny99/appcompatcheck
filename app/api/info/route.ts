import { NextRequest } from 'next/server';
import { createSuccessResponse, withErrorHandling } from '@/lib/api/validation';

/**
 * @swagger
 * /api/info:
 *   get:
 *     tags: [API Info]
 *     summary: Get API information
 *     description: Retrieve basic information about the AppCompatCheck API
 *     responses:
 *       200:
 *         description: API information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                   example: AppCompatCheck API
 *                 version:
 *                   type: string
 *                   example: 1.0.0
 *                 description:
 *                   type: string
 *                 endpoints:
 *                   type: object
 *                 documentation:
 *                   type: string
 *                 status:
 *                   type: string
 */
async function handler(request: NextRequest) {
  const baseUrl = new URL(request.url).origin;
  
  const apiInfo = {
    name: 'AppCompatCheck API',
    version: '1.0.0',
    description: 'REST API for security compatibility analysis and monitoring',
    documentation: `${baseUrl}/docs`,
    openapi: `${baseUrl}/api/docs`,
    status: `${baseUrl}/api/status`,
    endpoints: {
      authentication: {
        login: 'POST /api/auth/login',
        logout: 'POST /api/auth/logout',
        refresh: 'POST /api/auth/refresh',
      },
      users: {
        profile: 'GET /api/user',
        update: 'PUT /api/user',
      },
      organizations: {
        list: 'GET /api/organizations',
        create: 'POST /api/organizations',
        details: 'GET /api/organizations/{id}',
        update: 'PUT /api/organizations/{id}',
        members: 'GET /api/organizations/{id}/members',
        teams: 'GET /api/organizations/{id}/teams',
      },
      scanning: {
        upload: 'POST /api/scan',
        status: 'GET /api/scan/{sessionId}',
        results: 'GET /api/scan/{sessionId}/results',
      },
      reports: {
        generate: 'POST /api/reports',
        download: 'GET /api/reports/{id}/download',
        list: 'GET /api/reports',
      },
      monitoring: {
        health: 'GET /api/monitoring/health',
        metrics: 'GET /api/monitoring/metrics',
        alerts: 'GET /api/monitoring/alerts',
      },
      admin: {
        users: 'GET /api/admin/users',
        rules: 'GET /api/admin/rules',
        system: 'GET /api/admin/system',
      },
    },
    features: [
      'JWT Authentication',
      'Role-based access control',
      'Multi-tenant organizations',
      'Real-time monitoring',
      'Compatibility analysis',
      'Report generation',
      'Audit logging',
      'Rate limiting',
    ],
    rateLimit: {
      free: '100 requests/hour',
      pro: '1,000 requests/hour',
      enterprise: '10,000 requests/hour',
    },
    supportedFormats: ['JSON', 'CSV', 'PDF'],
    timestamp: new Date().toISOString(),
  };

  return createSuccessResponse(apiInfo);
}

export const GET = withErrorHandling(handler);