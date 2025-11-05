import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse, withErrorHandling, validateRequestBody, validateQueryParams, PaginationSchema } from '@/lib/api/validation';
import { verifySession } from '@/lib/auth/session';
import { JobQueue } from '@/lib/notifications/job-queue';
import { NotificationEvents } from '@/lib/notifications/events';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const BulkNotificationSchema = z.object({
  userIds: z.array(z.string()).optional(),
  organizationIds: z.array(z.string()).optional(),
  allUsers: z.boolean().default(false),
  event: z.string(),
  type: z.string(),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  metadata: z.record(z.any()).optional(),
  scheduleAt: z.string().datetime().optional(),
});

const QueueStatsQuerySchema = PaginationSchema.extend({
  status: z.enum(['completed', 'failed']).optional(),
});

/**
 * @swagger
 * /api/admin/notifications:
 *   post:
 *     tags: [Admin, Notifications]
 *     summary: Send bulk notifications
 *     description: Send notifications to multiple users or entire organization (Admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [event, type, title, message]
 *             properties:
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Specific user IDs to notify
 *               organizationIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Organization IDs to notify (all users in orgs)
 *               allUsers:
 *                 type: boolean
 *                 default: false
 *                 description: Send to all users in the system
 *               event:
 *                 type: string
 *                 description: Event type identifier
 *               type:
 *                 type: string
 *                 description: Notification type
 *               title:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 200
 *                 description: Notification title
 *               message:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 1000
 *                 description: Notification message
 *               metadata:
 *                 type: object
 *                 description: Additional metadata
 *               scheduleAt:
 *                 type: string
 *                 format: date-time
 *                 description: Schedule notification for later delivery
 *     responses:
 *       200:
 *         description: Notifications queued successfully
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
 *                     queuedCount:
 *                       type: integer
 *                     scheduledFor:
 *                       type: string
 *                       format: date-time
 *                 message:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *   get:
 *     tags: [Admin, Notifications]
 *     summary: Get notification queue statistics
 *     description: Get statistics and recent jobs from notification queue (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: status
 *         in: query
 *         description: Filter job results by status
 *         schema:
 *           type: string
 *           enum: [completed, failed]
 *       - name: page
 *         in: query
 *         description: Page number for job results
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - name: limit
 *         in: query
 *         description: Items per page for job results
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *     responses:
 *       200:
 *         description: Queue statistics retrieved successfully
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
 *                     stats:
 *                       type: object
 *                       properties:
 *                         pending:
 *                           type: integer
 *                         completed:
 *                           type: integer
 *                         failed:
 *                           type: integer
 *                     recentJobs:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           jobId:
 *                             type: string
 *                           type:
 *                             type: string
 *                           attempts:
 *                             type: integer
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           completedAt:
 *                             type: string
 *                             format: date-time
 *                           failedAt:
 *                             type: string
 *                             format: date-time
 *                           error:
 *                             type: string
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */

async function postHandler(request: NextRequest) {
  const session = await verifySession();
  
  // Check if user is admin
  if (session.user.role !== 'admin') {
    return createErrorResponse('Admin access required', 403);
  }
  
  const bodyValidation = await validateRequestBody(request, BulkNotificationSchema);
  if (!bodyValidation.success) {
    return bodyValidation.response;
  }
  
  const {
    userIds,
    organizationIds,
    allUsers,
    event,
    type,
    title,
    message,
    metadata,
    scheduleAt
  } = bodyValidation.data;
  
  try {
    let targetUserIds: string[] = [];
    
    // Get target user IDs based on the request
    if (allUsers) {
      const allUsersResult = await db.select({ id: users.id }).from(users);
      targetUserIds = allUsersResult.map(user => String(user.id));
    } else if (organizationIds && organizationIds.length > 0) {
      // Get all users from specified organizations
      const orgUsers = await db
        .select({ userId: users.id })
        .from(users)
        .where(eq(users.organizationId, parseInt(organizationIds[0]))); // Simplified to use first org ID
      
      targetUserIds = orgUsers.map(user => String(user.userId));
    } else if (userIds && userIds.length > 0) {
      targetUserIds = userIds;
    } else {
      return createErrorResponse('Must specify userIds, organizationIds, or set allUsers to true', 400);
    }
    
    if (targetUserIds.length === 0) {
      return createErrorResponse('No users found matching the criteria', 400);
    }
    
    // Send bulk notification
    const scheduledFor = scheduleAt ? new Date(scheduleAt) : undefined;
    
    await NotificationEvents.sendBulkNotification({
      userIds: targetUserIds,
      event,
      type,
      title,
      message,
      metadata,
      scheduleAt: scheduledFor,
    });
    
    return createSuccessResponse(
      {
        queuedCount: targetUserIds.length,
        scheduledFor: scheduledFor?.toISOString(),
      },
      undefined,
      `Notifications queued for ${targetUserIds.length} users${scheduledFor ? ` and scheduled for ${scheduledFor.toISOString()}` : ''}`
    );
    
  } catch (error) {
    console.error('Failed to send bulk notifications:', error);
    return createErrorResponse('Failed to queue bulk notifications', 500);
  }
}

async function getHandler(request: NextRequest) {
  const session = await verifySession();
  
  // Check if user is admin
  if (session.user.role !== 'admin') {
    return createErrorResponse('Admin access required', 403);
  }
  
  const queryValidation = validateQueryParams(request, QueueStatsQuerySchema);
  if (!queryValidation.success) {
    return queryValidation.response;
  }
  
  const { status, page, limit } = queryValidation.data;
  
  try {
    const jobQueue = JobQueue.getInstance();
    
    // Get queue statistics
    const stats = await jobQueue.getQueueStats();
    
    // Get recent jobs if status filter is provided
    let recentJobs: any[] = [];
    let total = 0;
    
    if (status) {
      const allJobs = await jobQueue.getRecentJobs(status, 1000); // Get more for pagination
      total = allJobs.length;
      
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      recentJobs = allJobs.slice(startIndex, endIndex);
    }
    
    const response = {
      stats,
      recentJobs: status ? recentJobs : undefined,
    };
    
    const pagination = status ? {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    } : undefined;
    
    return createSuccessResponse(response, pagination);
    
  } catch (error) {
    console.error('Failed to get queue statistics:', error);
    return createErrorResponse('Failed to retrieve queue statistics', 500);
  }
}

export const POST = withErrorHandling(postHandler);
export const GET = withErrorHandling(getHandler);