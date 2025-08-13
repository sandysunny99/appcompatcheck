import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse, withErrorHandling, validateRequestBody, validateQueryParams, PaginationSchema } from '@/lib/api/validation';
import { verifySession } from '@/lib/auth/session';
import { RetentionService } from '@/lib/data-management/retention-service';
import { z } from 'zod';

const CreateRetentionRuleSchema = z.object({
  name: z.string().min(1).max(100),
  table: z.string().min(1),
  conditions: z.array(z.object({
    field: z.string(),
    operator: z.enum(['older_than', 'equals', 'not_equals', 'in', 'not_in']),
    value: z.any(),
    unit: z.enum(['days', 'weeks', 'months', 'years']).optional(),
  })).min(1),
  action: z.enum(['delete', 'archive']),
  schedule: z.string(), // Cron expression
});

const RetentionQuerySchema = PaginationSchema.extend({
  table: z.string().optional(),
  action: z.enum(['delete', 'archive']).optional(),
  enabled: z.coerce.boolean().optional(),
});

/**
 * @swagger
 * /api/data-management/retention:
 *   get:
 *     tags: [Data Management]
 *     summary: List retention rules
 *     description: Get paginated list of data retention rules for the organization
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
 *       - name: table
 *         in: query
 *         description: Filter by table name
 *         schema:
 *           type: string
 *       - name: action
 *         in: query
 *         description: Filter by action type
 *         schema:
 *           type: string
 *           enum: [delete, archive]
 *       - name: enabled
 *         in: query
 *         description: Filter by enabled status
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Retention rules retrieved successfully
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
 *                     rules:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           table:
 *                             type: string
 *                           enabled:
 *                             type: boolean
 *                           action:
 *                             type: string
 *                           schedule:
 *                             type: string
 *                           conditions:
 *                             type: array
 *                             items:
 *                               type: object
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
 *     tags: [Data Management]
 *     summary: Create retention rule
 *     description: Create a new data retention rule
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, table, conditions, action, schedule]
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 description: Rule name
 *               table:
 *                 type: string
 *                 minLength: 1
 *                 description: Database table name
 *               conditions:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required: [field, operator, value]
 *                   properties:
 *                     field:
 *                       type: string
 *                       description: Field name
 *                     operator:
 *                       type: string
 *                       enum: [older_than, equals, not_equals, in, not_in]
 *                       description: Comparison operator
 *                     value:
 *                       description: Comparison value
 *                     unit:
 *                       type: string
 *                       enum: [days, weeks, months, years]
 *                       description: Time unit for older_than operator
 *               action:
 *                 type: string
 *                 enum: [delete, archive]
 *                 description: Action to perform on matching records
 *               schedule:
 *                 type: string
 *                 description: Cron expression for scheduling
 *     responses:
 *       201:
 *         description: Retention rule created successfully
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
 *                     ruleId:
 *                       type: string
 *                 message:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

async function getHandler(request: NextRequest) {
  const session = await verifySession();
  
  const queryValidation = validateQueryParams(request, RetentionQuerySchema);
  if (!queryValidation.success) {
    return queryValidation.response;
  }
  
  const { page, limit, table, action, enabled } = queryValidation.data;
  
  try {
    // TODO: Get retention rules from database
    // const conditions = [eq(dataRetentionRules.organizationId, session.user.organizationId)];
    
    // if (table) conditions.push(eq(dataRetentionRules.table, table));
    // if (action) conditions.push(eq(dataRetentionRules.action, action));
    // if (enabled !== undefined) conditions.push(eq(dataRetentionRules.enabled, enabled));
    
    // const rules = await db.select()
    //   .from(dataRetentionRules)
    //   .where(and(...conditions))
    //   .orderBy(desc(dataRetentionRules.createdAt))
    //   .limit(limit)
    //   .offset((page - 1) * limit);
    
    // Mock data for demonstration
    const allRules = [
      {
        id: 'rule1',
        name: 'Archive old scans',
        table: 'scans',
        enabled: true,
        action: 'archive',
        schedule: '0 2 * * 0',
        conditions: [
          {
            field: 'created_at',
            operator: 'older_than',
            value: 90,
            unit: 'days',
          }
        ],
        createdAt: new Date().toISOString(),
      },
      {
        id: 'rule2',
        name: 'Delete old audit logs',
        table: 'audit_logs',
        enabled: true,
        action: 'delete',
        schedule: '0 3 * * 0',
        conditions: [
          {
            field: 'created_at',
            operator: 'older_than',
            value: 365,
            unit: 'days',
          }
        ],
        createdAt: new Date().toISOString(),
      },
    ];
    
    // Apply filters
    let filteredRules = allRules;
    if (table) filteredRules = filteredRules.filter(rule => rule.table === table);
    if (action) filteredRules = filteredRules.filter(rule => rule.action === action);
    if (enabled !== undefined) filteredRules = filteredRules.filter(rule => rule.enabled === enabled);
    
    const total = filteredRules.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const rules = filteredRules.slice(startIndex, endIndex);
    
    return createSuccessResponse(
      { rules },
      { page, limit, total, totalPages }
    );
    
  } catch (error) {
    console.error('Failed to get retention rules:', error);
    return createErrorResponse('Failed to retrieve retention rules', 500);
  }
}

async function postHandler(request: NextRequest) {
  const session = await verifySession();
  
  const bodyValidation = await validateRequestBody(request, CreateRetentionRuleSchema);
  if (!bodyValidation.success) {
    return bodyValidation.response;
  }
  
  const { name, table, conditions, action, schedule } = bodyValidation.data;
  
  try {
    const retentionService = RetentionService.getInstance();
    
    const ruleId = await retentionService.createRetentionRule({
      name,
      enabled: true,
      table,
      conditions,
      action,
      schedule,
      organizationId: session.user.organizationId,
    });
    
    return createSuccessResponse(
      { ruleId },
      undefined,
      `Retention rule "${name}" created successfully`,
      201
    );
    
  } catch (error) {
    console.error('Failed to create retention rule:', error);
    return createErrorResponse('Failed to create retention rule', 500);
  }
}

export const GET = withErrorHandling(getHandler);
export const POST = withErrorHandling(postHandler);