import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse, withErrorHandling, validateRequestBody } from '@/lib/api/validation';
import { verifySession } from '@/lib/auth/session';
import { db } from '@/lib/db/drizzle';
import { notificationPreferences } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const NotificationPreferencesSchema = z.object({
  email: z.object({
    enabled: z.boolean(),
    events: z.array(z.string()).default([]),
    quietHours: z.object({
      enabled: z.boolean(),
      start: z.string(), // HH:MM format
      end: z.string(),   // HH:MM format
      timezone: z.string().default('UTC'),
    }).optional(),
  }),
  sms: z.object({
    enabled: z.boolean(),
    events: z.array(z.string()).default([]),
    phoneNumber: z.string().optional(),
  }),
  webhooks: z.object({
    enabled: z.boolean(),
    events: z.array(z.string()).default([]),
    url: z.string().url().optional(),
  }),
  inApp: z.object({
    enabled: z.boolean(),
    events: z.array(z.string()).default([]),
  }),
});

/**
 * @swagger
 * /api/notifications/preferences:
 *   get:
 *     tags: [Notifications]
 *     summary: Get notification preferences
 *     description: Get the current user's notification preferences
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Preferences retrieved successfully
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
 *                     preferences:
 *                       type: object
 *                       properties:
 *                         email:
 *                           type: object
 *                           properties:
 *                             enabled:
 *                               type: boolean
 *                             events:
 *                               type: array
 *                               items:
 *                                 type: string
 *                             quietHours:
 *                               type: object
 *                               properties:
 *                                 enabled:
 *                                   type: boolean
 *                                 start:
 *                                   type: string
 *                                 end:
 *                                   type: string
 *                                 timezone:
 *                                   type: string
 *                         sms:
 *                           type: object
 *                           properties:
 *                             enabled:
 *                               type: boolean
 *                             events:
 *                               type: array
 *                               items:
 *                                 type: string
 *                             phoneNumber:
 *                               type: string
 *                         webhooks:
 *                           type: object
 *                           properties:
 *                             enabled:
 *                               type: boolean
 *                             events:
 *                               type: array
 *                               items:
 *                                 type: string
 *                             url:
 *                               type: string
 *                         inApp:
 *                           type: object
 *                           properties:
 *                             enabled:
 *                               type: boolean
 *                             events:
 *                               type: array
 *                               items:
 *                                 type: string
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *   put:
 *     tags: [Notifications]
 *     summary: Update notification preferences
 *     description: Update the current user's notification preferences
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: object
 *                 properties:
 *                   enabled:
 *                     type: boolean
 *                   events:
 *                     type: array
 *                     items:
 *                       type: string
 *                   quietHours:
 *                     type: object
 *                     properties:
 *                       enabled:
 *                         type: boolean
 *                       start:
 *                         type: string
 *                       end:
 *                         type: string
 *                       timezone:
 *                         type: string
 *               sms:
 *                 type: object
 *                 properties:
 *                   enabled:
 *                     type: boolean
 *                   events:
 *                     type: array
 *                     items:
 *                       type: string
 *                   phoneNumber:
 *                     type: string
 *               webhooks:
 *                 type: object
 *                 properties:
 *                   enabled:
 *                     type: boolean
 *                   events:
 *                     type: array
 *                     items:
 *                       type: string
 *                   url:
 *                     type: string
 *               inApp:
 *                 type: object
 *                 properties:
 *                   enabled:
 *                     type: boolean
 *                   events:
 *                     type: array
 *                     items:
 *                       type: string
 *     responses:
 *       200:
 *         description: Preferences updated successfully
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
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

// Default notification preferences
const defaultPreferences = {
  email: {
    enabled: true,
    events: ['scan_completed', 'vulnerability_detected', 'report_generated'],
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00',
      timezone: 'UTC',
    },
  },
  sms: {
    enabled: false,
    events: ['critical_vulnerability'],
  },
  webhooks: {
    enabled: false,
    events: [],
  },
  inApp: {
    enabled: true,
    events: ['scan_completed', 'vulnerability_detected', 'report_generated', 'team_invitation'],
  },
};

async function getHandler() {
  const session = await verifySession();
  
  try {
    const userPreferences = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, session.user.id))
      .limit(1);
    
    const preferences = userPreferences.length > 0 
      ? JSON.parse(userPreferences[0].preferences as string)
      : defaultPreferences;
    
    return createSuccessResponse({ preferences });
    
  } catch (error) {
    console.error('Failed to get notification preferences:', error);
    return createErrorResponse('Failed to retrieve preferences', 500);
  }
}

async function putHandler(request: NextRequest) {
  const session = await verifySession();
  
  const bodyValidation = await validateRequestBody(request, NotificationPreferencesSchema);
  if (!bodyValidation.success) {
    return bodyValidation.response;
  }
  
  const preferences = bodyValidation.data;
  
  try {
    // Upsert user preferences
    await db
      .insert(notificationPreferences)
      .values({
        userId: session.user.id,
        preferences: JSON.stringify(preferences),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: notificationPreferences.userId,
        set: {
          preferences: JSON.stringify(preferences),
          updatedAt: new Date(),
        },
      });
    
    return createSuccessResponse(
      null,
      undefined,
      'Notification preferences updated successfully'
    );
    
  } catch (error) {
    console.error('Failed to update notification preferences:', error);
    return createErrorResponse('Failed to update preferences', 500);
  }
}

export const GET = withErrorHandling(getHandler);
export const PUT = withErrorHandling(putHandler);