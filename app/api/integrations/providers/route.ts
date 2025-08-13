import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse, withErrorHandling, validateQueryParams } from '@/lib/api/validation';
import { verifySession } from '@/lib/auth/session';
import { getAllProviders, getProvidersByType } from '@/lib/integrations/providers';
import { z } from 'zod';

const ProvidersQuerySchema = z.object({
  type: z.enum(['security_scanner', 'cicd_pipeline', 'code_repository', 'vulnerability_database', 'compliance_framework', 'siem_platform', 'ticketing_system']).optional(),
});

/**
 * @swagger
 * /api/integrations/providers:
 *   get:
 *     tags: [Integrations]
 *     summary: Get integration providers
 *     description: Retrieve list of available integration providers
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: type
 *         in: query
 *         description: Filter providers by type
 *         schema:
 *           type: string
 *           enum: [security_scanner, cicd_pipeline, code_repository, vulnerability_database, compliance_framework, siem_platform, ticketing_system]
 *     responses:
 *       200:
 *         description: Providers retrieved successfully
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
 *                     providers:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           type:
 *                             type: string
 *                           description:
 *                             type: string
 *                           logoUrl:
 *                             type: string
 *                           documentationUrl:
 *                             type: string
 *                           supportedFeatures:
 *                             type: array
 *                             items:
 *                               type: string
 *                           requiresAuth:
 *                             type: boolean
 *                           authType:
 *                             type: string
 *                           configSchema:
 *                             type: object
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

async function getHandler(request: NextRequest) {
  const session = await verifySession();
  
  const queryValidation = validateQueryParams(request, ProvidersQuerySchema);
  if (!queryValidation.success) {
    return queryValidation.response;
  }
  
  const { type } = queryValidation.data;
  
  try {
    const providers = type ? getProvidersByType(type) : getAllProviders();
    
    // Remove sensitive information from config schema
    const sanitizedProviders = providers.map(provider => ({
      ...provider,
      configSchema: {
        ...provider.configSchema,
        // Remove actual default values that might contain sensitive info
        properties: Object.entries(provider.configSchema.properties || {}).reduce(
          (acc, [key, value]: [string, any]) => {
            acc[key] = {
              ...value,
              // Remove default values for sensitive fields
              ...(key.toLowerCase().includes('key') || 
                  key.toLowerCase().includes('secret') || 
                  key.toLowerCase().includes('token') || 
                  key.toLowerCase().includes('password')
                  ? { default: undefined }
                  : {}
              ),
            };
            return acc;
          },
          {} as Record<string, any>
        ),
      },
    }));
    
    return createSuccessResponse({ providers: sanitizedProviders });
    
  } catch (error) {
    console.error('Failed to get integration providers:', error);
    return createErrorResponse('Failed to retrieve integration providers', 500);
  }
}

export const GET = withErrorHandling(getHandler);