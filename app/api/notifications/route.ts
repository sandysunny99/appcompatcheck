import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse, withErrorHandling, validateQueryParams, PaginationSchema } from '@/lib/api/validation';
import { verifySession } from '@/lib/auth/session';
import { db } from '@/lib/db/drizzle';
import { notifications } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { z } from 'zod';

const NotificationQuerySchema = PaginationSchema.extend({
  status: z.enum(['pending', 'sent', 'delivered', 'failed']).optional(),
  type: z.enum(['email', 'sms', 'webhook', 'in_app']).optional(),
  unreadOnly: z.coerce.boolean().default(false),
});

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: Get user notifications
 *     description: Retrieve paginated list of notifications for the authenticated user
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
 *       - name: status
 *         in: query
 *         description: Filter by notification status
 *         schema:
 *           type: string
 *           enum: [pending, sent, delivered, failed]
 *       - name: type
 *         in: query
 *         description: Filter by notification type
 *         schema:
 *           type: string
 *           enum: [email, sms, webhook, in_app]
 *       - name: unreadOnly
 *         in: query
 *         description: Show only unread notifications
 *         schema:
 *           type: boolean
 *           default: false
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
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
 *                     notifications:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           type:
 *                             type: string
 *                           title:
 *                             type: string
 *                           message:
 *                             type: string
 *                           status:
 *                             type: string
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
 */
async function getHandler(request: NextRequest) {
  const session = await verifySession();
  
  const queryValidation = validateQueryParams(request, NotificationQuerySchema);
  if (!queryValidation.success) {
    return queryValidation.response;
  }
  
  const { page, limit, status, type, unreadOnly } = queryValidation.data;
  
  try {
    // Build query conditions
    const conditions = [eq(notifications.userId, session.user.id)];
    
    if (status) {
      conditions.push(eq(notifications.status, status));
    }
    
    if (type) {
      conditions.push(eq(notifications.type, type));
    }
    
    // TODO: Add unread filter when we have a read status field
    
    // Get total count
    const totalResult = await db
      .select({ count: notifications.id })
      .from(notifications)
      .where(and(...conditions));
    
    const total = totalResult.length;
    const totalPages = Math.ceil(total / limit);
    
    // Get notifications
    const userNotifications = await db
      .select({
        id: notifications.id,
        type: notifications.type,
        channel: notifications.channel,
        title: notifications.title,
        message: notifications.message,
        status: notifications.status,
        metadata: notifications.metadata,
        sentAt: notifications.sentAt,
        createdAt: notifications.createdAt,
      })
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);
    
    return createSuccessResponse(
      { notifications: userNotifications },
      { page, limit, total, totalPages }
    );
    
  } catch (error) {
    console.error('Failed to get notifications:', error);
    return createErrorResponse('Failed to retrieve notifications', 500);
  }
}

export const GET = withErrorHandling(getHandler);