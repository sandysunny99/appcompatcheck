import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse, withErrorHandling, validateRequestBody, validateQueryParams, PaginationSchema } from '@/lib/api/validation';
import { verifySession } from '@/lib/auth/session';
import { BackupService } from '@/lib/data-management/backup-service';
import { z } from 'zod';

const CreateBackupSchema = z.object({
  name: z.string().min(1).max(100),
  tables: z.array(z.string()).min(1),
  schedule: z.object({
    frequency: z.enum(['hourly', 'daily', 'weekly', 'monthly']),
    time: z.string().optional(),
    dayOfWeek: z.number().min(0).max(6).optional(),
    dayOfMonth: z.number().min(1).max(31).optional(),
    timezone: z.string().default('UTC'),
  }),
  retention: z.object({
    daily: z.number().min(1).max(365).default(7),
    weekly: z.number().min(1).max(52).default(4),
    monthly: z.number().min(1).max(12).default(12),
    yearly: z.number().min(1).max(10).default(5),
  }),
  storage: z.object({
    type: z.enum(['local', 's3', 'gcs', 'azure']),
    config: z.record(z.any()),
  }),
  encryption: z.object({
    enabled: z.boolean().default(true),
    algorithm: z.enum(['aes-256-gcm', 'aes-256-cbc']).default('aes-256-gcm'),
  }),
});

const BackupQuerySchema = PaginationSchema.extend({
  status: z.enum(['pending', 'running', 'completed', 'failed']).optional(),
});

/**
 * @swagger
 * /api/data-management/backups:
 *   get:
 *     tags: [Data Management]
 *     summary: List backups
 *     description: Get paginated list of backup jobs for the organization
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
 *         description: Filter by backup status
 *         schema:
 *           type: string
 *           enum: [pending, running, completed, failed]
 *     responses:
 *       200:
 *         description: Backups retrieved successfully
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
 *                     backups:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           configurationId:
 *                             type: string
 *                           status:
 *                             type: string
 *                           startTime:
 *                             type: string
 *                             format: date-time
 *                           endTime:
 *                             type: string
 *                             format: date-time
 *                           size:
 *                             type: integer
 *                           recordCount:
 *                             type: integer
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
 *     summary: Create backup
 *     description: Create a new backup configuration and trigger initial backup
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, tables, schedule, storage]
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 description: Backup configuration name
 *               tables:
 *                 type: array
 *                 items:
 *                   type: string
 *                 minItems: 1
 *                 description: Database tables to backup
 *               schedule:
 *                 type: object
 *                 required: [frequency]
 *                 properties:
 *                   frequency:
 *                     type: string
 *                     enum: [hourly, daily, weekly, monthly]
 *                   time:
 *                     type: string
 *                     description: Time in HH:MM format
 *                   dayOfWeek:
 *                     type: integer
 *                     minimum: 0
 *                     maximum: 6
 *                     description: Day of week (0 = Sunday)
 *                   dayOfMonth:
 *                     type: integer
 *                     minimum: 1
 *                     maximum: 31
 *                     description: Day of month
 *                   timezone:
 *                     type: string
 *                     default: UTC
 *               retention:
 *                 type: object
 *                 properties:
 *                   daily:
 *                     type: integer
 *                     minimum: 1
 *                     maximum: 365
 *                     default: 7
 *                   weekly:
 *                     type: integer
 *                     minimum: 1
 *                     maximum: 52
 *                     default: 4
 *                   monthly:
 *                     type: integer
 *                     minimum: 1
 *                     maximum: 12
 *                     default: 12
 *                   yearly:
 *                     type: integer
 *                     minimum: 1
 *                     maximum: 10
 *                     default: 5
 *               storage:
 *                 type: object
 *                 required: [type, config]
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: [local, s3, gcs, azure]
 *                   config:
 *                     type: object
 *                     description: Storage-specific configuration
 *               encryption:
 *                 type: object
 *                 properties:
 *                   enabled:
 *                     type: boolean
 *                     default: true
 *                   algorithm:
 *                     type: string
 *                     enum: [aes-256-gcm, aes-256-cbc]
 *                     default: aes-256-gcm
 *     responses:
 *       201:
 *         description: Backup created successfully
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
 *                     configurationId:
 *                       type: string
 *                     backupJobId:
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
  
  const queryValidation = validateQueryParams(request, BackupQuerySchema);
  if (!queryValidation.success) {
    return queryValidation.response;
  }
  
  const { page, limit, status } = queryValidation.data;
  
  try {
    const backupService = BackupService.getInstance();
    const backups = await backupService.listBackups(session.user.organizationId, limit * page);
    
    // Filter by status if provided
    const filteredBackups = status 
      ? backups.filter(backup => backup.status === status)
      : backups;
    
    const total = filteredBackups.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedBackups = filteredBackups.slice(startIndex, endIndex);
    
    return createSuccessResponse(
      { backups: paginatedBackups },
      { page, limit, total, totalPages }
    );
    
  } catch (error) {
    console.error('Failed to get backups:', error);
    return createErrorResponse('Failed to retrieve backups', 500);
  }
}

async function postHandler(request: NextRequest) {
  const session = await verifySession();
  
  const bodyValidation = await validateRequestBody(request, CreateBackupSchema);
  if (!bodyValidation.success) {
    return bodyValidation.response;
  }
  
  const { name, tables, schedule, retention, storage, encryption } = bodyValidation.data;
  
  try {
    // TODO: Save backup configuration to database
    const configurationId = `config_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // const backupConfig: BackupConfiguration = {
    //   id: configurationId,
    //   name,
    //   enabled: true,
    //   schedule,
    //   retention,
    //   storage,
    //   encryption,
    //   tables,
    //   organizationId: session.user.organizationId,
    //   createdAt: new Date(),
    //   updatedAt: new Date(),
    // };
    
    // await db.insert(backupConfigurations).values(backupConfig);
    
    // Trigger initial backup
    const backupService = BackupService.getInstance();
    const backupJobId = await backupService.createBackup(configurationId);
    
    return createSuccessResponse(
      {
        configurationId,
        backupJobId,
      },
      undefined,
      `Backup configuration "${name}" created and initial backup started`,
      201
    );
    
  } catch (error) {
    console.error('Failed to create backup:', error);
    return createErrorResponse('Failed to create backup', 500);
  }
}

export const GET = withErrorHandling(getHandler);
export const POST = withErrorHandling(postHandler);