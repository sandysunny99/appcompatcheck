import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, Permission, hasPermission } from '@/lib/auth/session';
import { db } from '@/lib/db/drizzle';
import {
  scans,
  scanResults,
  compatibilityRules,
  fileUploads,
  ActivityType,
  ScanStatus,
} from '@/lib/db/schema';
import { eq, and, or, desc, isNull } from 'drizzle-orm';
import { logActivity } from '@/lib/db/queries';
import {
  CompatibilityAnalysisEngine,
  AnalysisContext,
  calculateOverallRiskScore,
} from '@/lib/compatibility/analysis-engine';
import { processUploadedFile } from '@/lib/upload/file-handler';
import { headers } from 'next/headers';
import crypto from 'crypto';
import path from 'path';

// Initialize analysis engine
const analysisEngine = new CompatibilityAnalysisEngine();

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await requireAuth();
    
    // Check permissions
    if (!hasPermission(session, Permission.SCAN_CREATE)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get client info for logging
    const headersList = await headers();
    const ipAddress = headersList.get('x-forwarded-for') || 
                     headersList.get('x-real-ip') || 
                     request.ip || 
                     'unknown';
    const userAgent = headersList.get('user-agent') || 'unknown';

    const body = await request.json();
    const { fileUploadId, scanName, dataType = 'security_log' } = body;

    if (!fileUploadId) {
      return NextResponse.json(
        { error: 'File upload ID is required' },
        { status: 400 }
      );
    }

    // Verify file upload exists and belongs to user
    const [fileUpload] = await db
      .select()
      .from(fileUploads)
      .where(
        and(
          eq(fileUploads.id, fileUploadId),
          session.user.organizationId
            ? or(
                eq(fileUploads.userId, session.user.id),
                eq(fileUploads.organizationId, session.user.organizationId)
              )
            : eq(fileUploads.userId, session.user.id)
        )
      )
      .limit(1);

    if (!fileUpload) {
      return NextResponse.json(
        { error: 'File not found or access denied' },
        { status: 404 }
      );
    }

    // Create scan session
    const sessionId = crypto.randomUUID();
    const [scanSession] = await db
      .insert(scans)
      .values({
        sessionId,
        userId: session.user.id,
        organizationId: session.user.organizationId,
        name: scanName || `Scan of ${fileUpload.originalName}`,
        status: ScanStatus.PENDING,
        fileType: fileUpload.fileType,
        fileName: fileUpload.originalName,
        fileSize: fileUpload.fileSize,
      })
      .returning();

    // Log scan creation
    await logActivity({
      userId: session.user.id,
      organizationId: session.user.organizationId,
      action: ActivityType.SCAN_CREATED,
      entityType: 'scan_session',
      entityId: scanSession.id,
      description: `Scan created: ${scanSession.name}`,
      ipAddress,
      userAgent,
      metadata: {
        sessionId,
        fileUploadId,
        dataType,
      },
    });

    // Start background analysis (in a real app, this would be queued)
    // For this demo, we'll run it immediately
    processScanInBackground(scanSession.id, fileUpload.filePath, dataType, {
      sessionId,
      userId: session.user.id,
      organizationId: session.user.organizationId,
      dataType,
      rules: [], // Will be loaded in background
    });

    return NextResponse.json({
      success: true,
      data: {
        scanId: scanSession.id,
        sessionId,
        status: scanSession.status,
        name: scanSession.name,
        createdAt: scanSession.createdAt,
      },
    });

  } catch (error) {
    console.error('Scan creation error:', error);

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (error instanceof Error && error.message === 'Insufficient permissions') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get scan results
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    
    const { searchParams } = new URL(request.url);
    const scanId = searchParams.get('scanId');
    const sessionId = searchParams.get('sessionId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    let whereClause;
    if (scanId) {
      whereClause = eq(scans.id, parseInt(scanId));
    } else if (sessionId) {
      whereClause = eq(scans.sessionId, sessionId);
    } else {
      // Get all scans for user/organization
      whereClause = session.user.organizationId
        ? or(
            eq(scans.userId, session.user.id),
            eq(scans.organizationId, session.user.organizationId)
          )
        : eq(scans.userId, session.user.id);
    }

    const scans = await db
      .select()
      .from(scans)
      .where(whereClause)
      .orderBy(desc(scans.createdAt))
      .limit(limit)
      .offset(offset);

    // If requesting specific scan, include results
    if ((scanId || sessionId) && scans.length > 0) {
      const scan = scans[0];
      const results = await db
        .select()
        .from(scanResults)
        .where(eq(scanResults.scanSessionId, scan.id))
        .orderBy(desc(scanResults.createdAt));

      return NextResponse.json({
        success: true,
        data: {
          scan,
          results,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: scans,
      pagination: {
        page,
        limit,
        total: scans.length,
      },
    });

  } catch (error) {
    console.error('Get scan error:', error);

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Background scan processing function
async function processScanInBackground(
  scanSessionId: number,
  filePath: string,
  dataType: 'security_log' | 'compatibility_data',
  context: AnalysisContext
) {
  try {
    // Update scan status to running
    await db
      .update(scans)
      .set({
        status: ScanStatus.RUNNING,
        startedAt: new Date(),
      })
      .where(eq(scans.id, scanSessionId));

    // Load compatibility rules
    const rules = await db
      .select()
      .from(compatibilityRules)
      .where(
        and(
          eq(compatibilityRules.isActive, true),
          context.organizationId
            ? or(
                isNull(compatibilityRules.organizationId),
                eq(compatibilityRules.organizationId, context.organizationId)
              )
            : isNull(compatibilityRules.organizationId)
        )
      );

    context.rules = rules;

    // Process uploaded file
    const fileExtension = path.extname(filePath).toLowerCase();
    const fileType = fileExtension === '.json' ? 'application/json' : 'text/csv';
    
    const processResult = await processUploadedFile(filePath, fileType, dataType);
    
    if (processResult.validRows === 0) {
      throw new Error('No valid data found in uploaded file');
    }

    // Update scan with total checks
    await db
      .update(scans)
      .set({
        totalChecks: processResult.validRows * rules.length,
      })
      .where(eq(scans.id, scanSessionId));

    // Run compatibility analysis
    const analysisResults = await analysisEngine.analyzeData(
      processResult.data as any[],
      context
    );

    // Save results to database
    const scanResultsToInsert = analysisResults.map(result => ({
      scanSessionId,
      ruleId: result.ruleId,
      status: result.status,
      severity: result.severity,
      message: result.message,
      details: result.details,
      recommendations: result.recommendations,
      affectedComponents: result.affectedComponents,
      metadata: result.metadata,
    }));

    if (scanResultsToInsert.length > 0) {
      await db.insert(scanResults).values(scanResultsToInsert);
    }

    // Calculate overall risk score
    const riskScore = calculateOverallRiskScore(analysisResults);
    
    // Count results by status
    const completedChecks = analysisResults.length;
    const failedChecks = analysisResults.filter(r => r.status === 'failed').length;

    // Update scan status to completed
    await db
      .update(scans)
      .set({
        status: ScanStatus.COMPLETED,
        completedAt: new Date(),
        completedChecks,
        failedChecks,
        riskScore,
      })
      .where(eq(scans.id, scanSessionId));

    // Log scan completion
    await logActivity({
      userId: context.userId,
      organizationId: context.organizationId,
      action: ActivityType.SCAN_COMPLETED,
      entityType: 'scan_session',
      entityId: scanSessionId,
      description: `Scan completed with risk score: ${(riskScore * 100).toFixed(1)}%`,
      metadata: {
        sessionId: context.sessionId,
        totalChecks: completedChecks,
        failedChecks,
        riskScore,
        analysisResults: analysisResults.length,
      },
    });

    console.log(`Scan ${scanSessionId} completed successfully`);

  } catch (error) {
    console.error(`Scan ${scanSessionId} failed:`, error);

    // Update scan status to failed
    await db
      .update(scans)
      .set({
        status: ScanStatus.FAILED,
        completedAt: new Date(),
      })
      .where(eq(scans.id, scanSessionId));

    // Log scan failure
    await logActivity({
      userId: context.userId,
      organizationId: context.organizationId,
      action: ActivityType.SCAN_FAILED,
      entityType: 'scan_session',
      entityId: scanSessionId,
      description: `Scan failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      metadata: {
        sessionId: context.sessionId,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
}