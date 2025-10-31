import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, Permission, hasPermission } from '@/lib/auth/session';
import { db } from '@/lib/db/drizzle';
import {
  scans,
  ActivityType,
} from '@/lib/db/schema';
import { eq, and, or, desc } from 'drizzle-orm';
import { logActivity } from '@/lib/db/queries';
import {
  CompatibilityAnalysisEngine,
  AnalysisContext,
  calculateOverallRiskScore,
} from '@/lib/compatibility/analysis-engine';
import { headers } from 'next/headers';
import crypto from 'crypto';
import { getSystemInformation } from '@/lib/utils/system-info';

// Initialize analysis engine
const analysisEngine = new CompatibilityAnalysisEngine();

// Scan status enum (since it's not in schema)
const ScanStatus = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

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
    const { 
      scanName, 
      scanType = 'compatibility',
      description,
      files = [],
      config = {},
      dataType = 'security_log',
      clientSystemInfo = {} // Client-side system information
    } = body;

    if (!scanName) {
      return NextResponse.json(
        { error: 'Scan name is required' },
        { status: 400 }
      );
    }

    // Create scan session
    const sessionId = crypto.randomUUID();
    const scanId = crypto.randomUUID().substring(0, 32);
    
    const [scanSession] = await db
      .insert(scans)
      .values({
        id: scanId,
        userId: session.user.id.toString(),
        organizationId: session.user.organizationId?.toString() || '',
        name: scanName,
        description: description || null,
        type: scanType,
        status: ScanStatus.PENDING,
        priority: 'medium',
        config: {
          sessionId,
          dataType,
          ...config,
        },
        files: files,
        results: {},
        metrics: {},
        progress: 0,
      })
      .returning();

    // Log scan creation
    await logActivity({
      userId: session.user.id,
      organizationId: session.user.organizationId,
      action: ActivityType.SCAN_CREATED,
      entityType: 'scan',
      entityId: scanSession.id,
      description: `Scan created: ${scanSession.name}`,
      ipAddress,
      userAgent,
      metadata: {
        sessionId,
        scanType,
        dataType,
      },
    });

    // Start background analysis (in a real app, this would be queued)
    // For this demo, we'll run it immediately
    processScanInBackground(scanSession.id, {
      sessionId,
      userId: session.user.id,
      organizationId: session.user.organizationId,
      dataType,
      rules: [], // Will be loaded in background
      files,
      clientSystemInfo, // Pass client info to background processor
    });

    return NextResponse.json({
      success: true,
      data: {
        scanId: scanSession.id,
        sessionId,
        status: scanSession.status,
        name: scanSession.name,
        type: scanSession.type,
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    let whereClause;
    if (scanId) {
      whereClause = and(
        eq(scans.id, scanId),
        session.user.organizationId
          ? or(
              eq(scans.userId, session.user.id.toString()),
              eq(scans.organizationId, session.user.organizationId.toString())
            )
          : eq(scans.userId, session.user.id.toString())
      );
    } else {
      // Get all scans for user/organization
      whereClause = session.user.organizationId
        ? or(
            eq(scans.userId, session.user.id.toString()),
            eq(scans.organizationId, session.user.organizationId.toString())
          )
        : eq(scans.userId, session.user.id.toString());
    }

    const scansList = await db
      .select()
      .from(scans)
      .where(whereClause)
      .orderBy(desc(scans.createdAt))
      .limit(limit)
      .offset(offset);

    // If requesting specific scan, include detailed results
    if (scanId && scansList.length > 0) {
      const scan = scansList[0];
      
      return NextResponse.json({
        success: true,
        data: {
          scan: {
            id: scan.id,
            name: scan.name,
            description: scan.description,
            type: scan.type,
            status: scan.status,
            priority: scan.priority,
            progress: scan.progress,
            error: scan.error,
            startedAt: scan.startedAt,
            completedAt: scan.completedAt,
            createdAt: scan.createdAt,
            updatedAt: scan.updatedAt,
          },
          config: scan.config,
          files: scan.files,
          results: scan.results,
          metrics: scan.metrics,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: scansList.map(scan => ({
        id: scan.id,
        name: scan.name,
        description: scan.description,
        type: scan.type,
        status: scan.status,
        priority: scan.priority,
        progress: scan.progress,
        startedAt: scan.startedAt,
        completedAt: scan.completedAt,
        createdAt: scan.createdAt,
      })),
      pagination: {
        page,
        limit,
        total: scansList.length,
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
  scanId: string,
  context: AnalysisContext & { files?: any[]; clientSystemInfo?: any }
) {
  try {
    // Capture system information (server + client)
    const systemInfo = await getSystemInformation(context.clientSystemInfo);
    
    // Update scan status to running
    await db
      .update(scans)
      .set({
        status: ScanStatus.RUNNING,
        startedAt: new Date(),
        progress: 10,
      })
      .where(eq(scans.id, scanId));

    // Load compatibility rules from config or use defaults
    // Since there's no compatibilityRules table, we'll use a default set
    const defaultRules = [
      {
        id: 'rule-1',
        name: 'Security Check',
        category: 'security',
        severity: 'high',
        isActive: true,
      },
      {
        id: 'rule-2',
        name: 'Performance Check',
        category: 'performance',
        severity: 'medium',
        isActive: true,
      },
      {
        id: 'rule-3',
        name: 'Compatibility Check',
        category: 'compatibility',
        severity: 'medium',
        isActive: true,
      },
    ];

    context.rules = defaultRules as any[];

    // Update progress
    await db
      .update(scans)
      .set({
        progress: 30,
      })
      .where(eq(scans.id, scanId));

    // Generate mock analysis data based on files
    // In a real implementation, this would process actual file data
    const mockData = [
      {
        id: 1,
        component: 'Component A',
        version: '1.0.0',
        status: 'passed',
      },
      {
        id: 2,
        component: 'Component B',
        version: '2.5.0',
        status: 'warning',
      },
      {
        id: 3,
        component: 'Component C',
        version: '3.0.0',
        status: 'failed',
      },
    ];

    // Update progress
    await db
      .update(scans)
      .set({
        progress: 50,
      })
      .where(eq(scans.id, scanId));

    // Run compatibility analysis
    const analysisResults = await analysisEngine.analyzeData(
      mockData as any[],
      context
    );

    // Update progress
    await db
      .update(scans)
      .set({
        progress: 75,
      })
      .where(eq(scans.id, scanId));

    // Calculate overall risk score
    const riskScore = calculateOverallRiskScore(analysisResults);
    
    // Count results by status
    const completedChecks = analysisResults.length;
    const failedChecks = analysisResults.filter(r => r.status === 'failed').length;
    const warningChecks = analysisResults.filter(r => r.status === 'warning').length;
    const passedChecks = analysisResults.filter(r => r.status === 'passed').length;

    // Group results by severity
    const resultsBySeverity = analysisResults.reduce((acc: Record<string, number>, result: any) => {
      const severity = result.severity || 'unknown';
      acc[severity] = (acc[severity] || 0) + 1;
      return acc;
    }, {});

    // Update scan status to completed with results, metrics, and system information
    await db
      .update(scans)
      .set({
        status: ScanStatus.COMPLETED,
        completedAt: new Date(),
        progress: 100,
        results: {
          items: analysisResults,
          summary: {
            total: completedChecks,
            passed: passedChecks,
            warning: warningChecks,
            failed: failedChecks,
          },
          bySeverity: resultsBySeverity,
          systemInformation: systemInfo,
        },
        metrics: {
          riskScore,
          completedChecks,
          failedChecks,
          warningChecks,
          passedChecks,
          totalRules: defaultRules.length,
          totalComponents: mockData.length,
          scanDuration: 0, // Will be calculated by client
        },
      })
      .where(eq(scans.id, scanId));

    // Log scan completion
    await logActivity({
      userId: context.userId,
      organizationId: context.organizationId,
      action: ActivityType.SCAN_COMPLETED,
      entityType: 'scan',
      entityId: scanId,
      description: `Scan completed with risk score: ${(riskScore * 100).toFixed(1)}%`,
      metadata: {
        sessionId: context.sessionId,
        totalChecks: completedChecks,
        failedChecks,
        warningChecks,
        passedChecks,
        riskScore,
      },
    });

    console.log(`Scan ${scanId} completed successfully`);

  } catch (error) {
    console.error(`Scan ${scanId} failed:`, error);

    // Update scan status to failed
    await db
      .update(scans)
      .set({
        status: ScanStatus.FAILED,
        completedAt: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
        progress: 0,
      })
      .where(eq(scans.id, scanId));

    // Log scan failure
    await logActivity({
      userId: context.userId,
      organizationId: context.organizationId,
      action: ActivityType.SCAN_FAILED,
      entityType: 'scan',
      entityId: scanId,
      description: `Scan failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      metadata: {
        sessionId: context.sessionId,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
}
