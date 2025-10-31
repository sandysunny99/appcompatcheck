import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission, Permission } from '@/lib/auth/permissions';
import { db } from '@/lib/db/drizzle';
import { 
  scans, 
  users, 
  organizations,
  activityLogs 
} from '@/lib/db/schema';
import { eq, and, or, desc } from 'drizzle-orm';
import { ReportData } from '@/lib/reports/report-generator';

interface RouteParams {
  params: {
    scanId: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user.role, Permission.REPORT_GENERATE)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const scanId = params.scanId;
    if (!scanId) {
      return NextResponse.json({ error: 'Invalid scan ID' }, { status: 400 });
    }

    // Fetch scan with user and organization data
    const [scanData] = await db
      .select({
        // Scan data
        id: scans.id,
        name: scans.name,
        description: scans.description,
        type: scans.type,
        status: scans.status,
        results: scans.results,
        metrics: scans.metrics,
        progress: scans.progress,
        files: scans.files,
        config: scans.config,
        error: scans.error,
        createdAt: scans.createdAt,
        completedAt: scans.completedAt,
        startedAt: scans.startedAt,
        
        // User data
        userFirstName: users.firstName,
        userLastName: users.lastName,
        userEmail: users.email,
        
        // Organization data
        organizationName: organizations.name,
        organizationDomain: organizations.domain,
      })
      .from(scans)
      .leftJoin(users, eq(scans.userId, users.id))
      .leftJoin(organizations, eq(users.organizationId, organizations.id))
      .where(
        and(
          eq(scans.id, scanId),
          session.user.organizationId
            ? or(
                eq(scans.userId, session.user.id),
                eq(scans.organizationId, session.user.organizationId)
              )
            : eq(scans.userId, session.user.id)
        )
      )
      .limit(1);

    if (!scanData) {
      return NextResponse.json({ error: 'Scan not found' }, { status: 404 });
    }

    // Parse results from JSONB
    const resultsData = (scanData.results as any) || {};
    const results = Array.isArray(resultsData) ? resultsData : (resultsData.results || []);
    const metricsData = (scanData.metrics as any) || {};

    // Calculate summary statistics
    const totalResults = results.length;
    const resultsByStatus = results.reduce((acc: Record<string, number>, result: any) => {
      const status = result.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const resultsBySeverity = results.reduce((acc: Record<string, number>, result: any) => {
      const severity = result.severity || 'unknown';
      acc[severity] = (acc[severity] || 0) + 1;
      return acc;
    }, {});

    const resultsByCategory = results.reduce((acc: Record<string, number>, result: any) => {
      const category = result.category || 'unknown';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    const riskDistribution = {
      critical: resultsBySeverity.critical || 0,
      high: resultsBySeverity.high || 0,
      medium: resultsBySeverity.medium || 0,
      low: resultsBySeverity.low || 0,
    };

    // Calculate risk score from results
    let riskScore = metricsData.riskScore || 0;
    if (riskScore === 0 && results.length > 0) {
      // Calculate simple risk score based on severity distribution
      const weights = { critical: 10, high: 7, medium: 4, low: 1 };
      const totalWeight = 
        (riskDistribution.critical * weights.critical) +
        (riskDistribution.high * weights.high) +
        (riskDistribution.medium * weights.medium) +
        (riskDistribution.low * weights.low);
      const maxWeight = results.length * weights.critical;
      riskScore = maxWeight > 0 ? (totalWeight / maxWeight) * 10 : 0;
    }

    // Build the report data structure
    const reportData: ReportData = {
      scanSession: {
        id: scanData.id,
        sessionId: scanData.id, // Use id as sessionId since schema uses id
        fileName: scanData.name,
        status: scanData.status,
        createdAt: scanData.createdAt.toISOString(),
        completedAt: scanData.completedAt?.toISOString(),
        totalChecks: results.length,
        completedChecks: results.filter((r: any) => r.status === 'completed' || r.status === 'pass' || r.status === 'fail').length,
        riskScore: parseFloat(riskScore.toFixed(2)),
      },
      results: results.map((result: any, index: number) => ({
        id: result.id || index + 1,
        ruleId: result.ruleId || 0,
        ruleName: result.ruleName || result.name || 'Unknown Rule',
        ruleDescription: result.ruleDescription || result.description || '',
        category: result.category || 'unknown',
        severity: result.severity || 'medium',
        status: result.status || 'info',
        message: result.message || '',
        confidence: result.confidence || 0.5,
        affectedItems: result.affectedItems || result.affected || [],
        recommendations: result.recommendations || result.recommendation || [],
        createdAt: result.createdAt || scanData.createdAt.toISOString(),
      })),
      summary: {
        totalResults,
        resultsByStatus,
        resultsBySeverity,
        resultsByCategory,
        riskDistribution,
      },
      organization: scanData.organizationName ? {
        name: scanData.organizationName,
        domain: scanData.organizationDomain || undefined,
      } : undefined,
      user: {
        firstName: scanData.userFirstName || 'Unknown',
        lastName: scanData.userLastName || 'User',
        email: scanData.userEmail || 'unknown@example.com',
      },
    };

    // Add system information from scan results if available
    if (resultsData.systemInformation) {
      reportData.systemInfo = {
        lastLogin: resultsData.systemInformation.capturedAt,
        ipAddress: resultsData.systemInformation.ipAddress || undefined,
        userAgent: resultsData.systemInformation.userAgent || undefined,
        deviceName: resultsData.systemInformation.hostname || resultsData.systemInformation.deviceName || undefined,
        hostname: resultsData.systemInformation.hostname || undefined,
        platform: resultsData.systemInformation.platform || undefined,
        architecture: resultsData.systemInformation.architecture || undefined,
        osVersion: resultsData.systemInformation.osVersion || undefined,
        username: resultsData.systemInformation.username || undefined,
      };
    }

    return NextResponse.json(reportData);

  } catch (error) {
    console.error('Failed to fetch report data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
