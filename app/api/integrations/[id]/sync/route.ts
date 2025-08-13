import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse, withErrorHandling } from '@/lib/api/validation';
import { verifySession } from '@/lib/auth/session';
import { IntegrationManager } from '@/lib/integrations/integration-manager';

/**
 * @swagger
 * /api/integrations/{id}/sync:
 *   post:
 *     tags: [Integrations]
 *     summary: Sync integration
 *     description: Manually trigger a sync for a specific integration
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Integration ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sync completed successfully
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
 *                     syncResult:
 *                       type: object
 *                       properties:
 *                         success:
 *                           type: boolean
 *                         itemsProcessed:
 *                           type: integer
 *                         itemsCreated:
 *                           type: integer
 *                         itemsUpdated:
 *                           type: integer
 *                         itemsSkipped:
 *                           type: integer
 *                         errors:
 *                           type: array
 *                           items:
 *                             type: string
 *                         lastSyncAt:
 *                           type: string
 *                           format: date-time
 *                 message:
 *                   type: string
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandling(async () => {
    const session = await verifySession();
    const integrationId = params.id;
    
    try {
      const integrationManager = IntegrationManager.getInstance();
      
      // TODO: Verify that the integration belongs to the user's organization
      // const integration = await db.select()
      //   .from(integrations)
      //   .where(
      //     and(
      //       eq(integrations.id, integrationId),
      //       eq(integrations.organizationId, session.user.organizationId)
      //     )
      //   )
      //   .limit(1);
      
      // if (!integration.length) {
      //   return createErrorResponse('Integration not found', 404);
      // }
      
      // Check if integration is loaded
      const integration = integrationManager.getIntegration(integrationId);
      if (!integration) {
        return createErrorResponse('Integration not found or not initialized', 404);
      }
      
      // Trigger sync
      const syncResult = await integrationManager.syncIntegration(integrationId);
      
      return createSuccessResponse(
        { syncResult },
        undefined,
        `Integration sync ${syncResult.success ? 'completed successfully' : 'completed with errors'}`
      );
      
    } catch (error) {
      console.error(`Failed to sync integration ${integrationId}:`, error);
      return createErrorResponse('Failed to sync integration', 500);
    }
  })();
}