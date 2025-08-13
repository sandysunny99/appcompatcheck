import { NextRequest } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { createSuccessResponse, withErrorHandling } from '@/lib/api/validation';

/**
 * @swagger
 * /api/user:
 *   get:
 *     tags: [Users]
 *     summary: Get current user profile
 *     description: Retrieve the profile information for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
async function handler(request: NextRequest) {
  const user = await getUser();
  return createSuccessResponse(user);
}

export const GET = withErrorHandling(handler);
