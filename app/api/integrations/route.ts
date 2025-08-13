import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse, withErrorHandling, validateRequestBody, validateQueryParams, PaginationSchema } from '@/lib/api/validation';
import { verifySession } from '@/lib/auth/session';
import { IntegrationManager } from '@/lib/integrations/integration-manager';
import { getAllProviders, getProvidersByType } from '@/lib/integrations/providers';
import { z } from 'zod';

const CreateIntegrationSchema = z.object({
  name: z.string().min(1).max(100),
  provider: z.string(),
  type: z.enum(['security_scanner', 'cicd_pipeline', 'code_repository', 'vulnerability_database', 'compliance_framework', 'siem_platform', 'ticketing_system']),
  config: z.record(z.any()),
});

const IntegrationQuerySchema = PaginationSchema.extend({
  type: z.enum(['security_scanner', 'cicd_pipeline', 'code_repository', 'vulnerability_database', 'compliance_framework', 'siem_platform', 'ticketing_system']).optional(),
  status: z.enum(['active', 'inactive', 'error']).optional(),
});

/**
 * @swagger
 * /api/integrations:
 *   get:
 *     tags: [Integrations]
 *     summary: Get integrations
 *     description: Retrieve paginated list of integrations for the organization
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: page
 *         in: query
 *         description: Page number
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - name: limit
 *         in: query
 *         description: Items per page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *       - name: type
 *         in: query
 *         description: Filter by integration type
 *         schema:
 *           type: string
 *           enum: [security_scanner, cicd_pipeline, code_repository, vulnerability_database, compliance_framework, siem_platform, ticketing_system]
 *       - name: status
 *         in: query
 *         description: Filter by integration status
 *         schema:
 *           type: string
 *           enum: [active, inactive, error]
 *     responses:
 *       200:
 *         description: Integrations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     integrations:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           provider:
 *                             type: string
 *                           type:
 *                             type: string
 *                           status:
 *                             type: string
 *                           lastSyncAt:
 *                             type: string
 *                             format: date-time
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *   post:
 *     tags: [Integrations]
 *     summary: Create integration
 *     description: Create a new third-party integration
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, provider, type, config]
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 description: Integration name
 *               provider:
 *                 type: string
 *                 description: Provider ID (e.g., 'github', 'snyk', 'jira')
 *               type:
 *                 type: string
 *                 enum: [security_scanner, cicd_pipeline, code_repository, vulnerability_database, compliance_framework, siem_platform, ticketing_system]
 *                 description: Integration type
 *               config:
 *                 type: object
 *                 description: Provider-specific configuration
 *     responses:
 *       201:
 *         description: Integration created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     integration:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         provider:
 *                           type: string
 *                         type:
 *                           type: string
 *                         status:
 *                           type: string
 *                         webhookUrl:
 *                           type: string
 *                 message:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

async function getHandler(request: NextRequest) {
  const session = await verifySession();
  
  const queryValidation = validateQueryParams(request, IntegrationQuerySchema);
  if (!queryValidation.success) {
    return queryValidation.response;
  }
  
  const { page, limit, type, status } = queryValidation.data;
  
  try {
    // TODO: Get integrations from database
    // const conditions = [eq(integrations.organizationId, session.user.organizationId)];
    
    // if (type) {
    //   conditions.push(eq(integrations.type, type));
    // }
    
    // if (status) {
    //   conditions.push(eq(integrations.status, status));
    // }
    
    // For now, return mock data
    const mockIntegrations = [
      {
        id: '1',
        name: 'GitHub Repository',
        provider: 'github',
        type: 'code_repository',
        status: 'active',
        lastSyncAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        name: 'Snyk Security Scanner',
        provider: 'snyk',
        type: 'security_scanner',
        status: 'active',
        lastSyncAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      },
    ];
    
    const filteredIntegrations = mockIntegrations.filter(integration => {
      if (type && integration.type !== type) return false;
      if (status && integration.status !== status) return false;
      return true;
    });
    
    const total = filteredIntegrations.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const integrations = filteredIntegrations.slice(startIndex, endIndex);
    
    return createSuccessResponse(
      { integrations },
      { page, limit, total, totalPages }
    );
    
  } catch (error) {
    console.error('Failed to get integrations:', error);
    return createErrorResponse('Failed to retrieve integrations', 500);
  }
}

async function postHandler(request: NextRequest) {
  const session = await verifySession();
  
  const bodyValidation = await validateRequestBody(request, CreateIntegrationSchema);
  if (!bodyValidation.success) {
    return bodyValidation.response;
  }
  
  const { name, provider, type, config } = bodyValidation.data;
  
  try {
    const integrationManager = IntegrationManager.getInstance();
    
    // Validate configuration
    const validation = integrationManager.validateIntegrationConfig(provider, config);
    if (!validation.valid) {
      return createErrorResponse(
        `Invalid configuration: ${validation.errors.join(', ')}`,
        400
      );
    }
    
    // Create integration record
    const integrationId = `integration_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const integration = {
      id: integrationId,
      name,
      provider,
      type,
      status: 'inactive' as const,
      config,
      organizationId: session.user.organizationId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // TODO: Save to database
    // await db.insert(integrations).values(integration);
    
    // Test connection
    const connectionTest = await integrationManager.testIntegration(integration);
    
    if (connectionTest) {
      integration.status = 'active';
      // TODO: Update status in database
      // await db.update(integrations)
      //   .set({ status: 'active' })
      //   .where(eq(integrations.id, integrationId));
    } else {
      integration.status = 'error';
    }
    
    // Initialize integration
    integrationManager.initializeIntegration(integration);
    
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/integrations/${integrationId}`;
    
    return createSuccessResponse(
      {
        integration: {
          id: integration.id,
          name: integration.name,
          provider: integration.provider,
          type: integration.type,
          status: integration.status,
          webhookUrl,
        },
      },
      undefined,
      `Integration "${name}" created successfully`,
      201
    );
    
  } catch (error) {
    console.error('Failed to create integration:', error);
    return createErrorResponse('Failed to create integration', 500);
  }
}

export const GET = withErrorHandling(getHandler);
export const POST = withErrorHandling(postHandler);