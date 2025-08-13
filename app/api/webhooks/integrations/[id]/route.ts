import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/lib/api/validation';
import { IntegrationManager } from '@/lib/integrations/integration-manager';
import { WebhookPayload } from '@/lib/integrations/types';

/**
 * @swagger
 * /api/webhooks/integrations/{id}:
 *   post:
 *     tags: [Webhooks, Integrations]
 *     summary: Handle integration webhook
 *     description: Receive and process webhook events from third-party integrations
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Integration ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Webhook payload (varies by provider)
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid webhook payload
 *       404:
 *         description: Integration not found
 *       500:
 *         description: Webhook processing failed
 */

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const integrationId = params.id;
  
  try {
    const integrationManager = IntegrationManager.getInstance();
    
    // Get integration instance
    const integration = integrationManager.getIntegration(integrationId);
    if (!integration) {
      console.error(`Integration ${integrationId} not found for webhook`);
      return createErrorResponse('Integration not found', 404);
    }
    
    // Parse webhook payload
    let body: any;
    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      body = await request.json();
    } else {
      const text = await request.text();
      try {
        body = JSON.parse(text);
      } catch {
        body = { raw: text };
      }
    }
    
    // Extract webhook signature for verification
    const signature = request.headers.get('x-hub-signature-256') || 
                     request.headers.get('x-signature') ||
                     request.headers.get('signature');
    
    // Get event type from headers (varies by provider)
    const eventType = request.headers.get('x-github-event') ||
                     request.headers.get('x-gitlab-event') ||
                     request.headers.get('x-event-key') ||
                     body.event_type ||
                     'unknown';
    
    // Create webhook payload
    const webhookPayload: WebhookPayload = {
      event: eventType,
      integrationId,
      data: body,
      signature: signature || undefined,
      timestamp: Date.now(),
    };
    
    console.log(`Processing webhook for integration ${integrationId}, event: ${eventType}`);
    
    // Handle webhook
    await integrationManager.handleWebhook(integrationId, webhookPayload);
    
    console.log(`Webhook processed successfully for integration ${integrationId}`);
    
    return createSuccessResponse(
      null,
      undefined,
      'Webhook processed successfully'
    );
    
  } catch (error) {
    console.error(`Failed to process webhook for integration ${integrationId}:`, error);
    
    // Return 200 to prevent webhook retries for known issues
    if (error.message.includes('Integration not found')) {
      return createErrorResponse('Integration not found', 404);
    }
    
    return createErrorResponse('Webhook processing failed', 500);
  }
}

// Handle GET requests for webhook URL validation (used by some providers)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const integrationId = params.id;
  
  try {
    // Some webhook providers send GET requests for URL validation
    const challenge = request.nextUrl.searchParams.get('hub.challenge') ||
                     request.nextUrl.searchParams.get('challenge');
    
    if (challenge) {
      // Return the challenge for webhook URL verification
      return new Response(challenge, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    }
    
    // For other GET requests, return integration webhook info
    return createSuccessResponse({
      integrationId,
      webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/integrations/${integrationId}`,
      status: 'active',
    });
    
  } catch (error) {
    console.error(`Failed to handle webhook GET request for integration ${integrationId}:`, error);
    return createErrorResponse('Failed to process webhook request', 500);
  }
}