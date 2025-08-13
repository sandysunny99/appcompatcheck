import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission, Permission } from '@/lib/auth/permissions';
import { db } from '@/lib/db/drizzle';
import { 
  scanSessions, 
  scanResults, 
  compatibilityRules, 
  users, 
  organizations 
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

    const scanId = parseInt(params.scanId);
    if (isNaN(scanId)) {
      return NextResponse.json({ error: 'Invalid scan ID' }, { status: 400 });
    }

    // Fetch scan session with user and organization data
    const [scanSession] = await db
      .select({
        // Scan session data
        id: scanSessions.id,
        sessionId: scanSessions.sessionId,
        fileName: scanSessions.fileName,
        status: scanSessions.status,
        createdAt: scanSessions.createdAt,
        completedAt: scanSessions.completedAt,
        totalChecks: scanSessions.totalChecks,
        completedChecks: scanSessions.completedChecks,
        riskScore: scanSessions.riskScore,
        
        // User data
        userFirstName: users.firstName,
        userLastName: users.lastName,
        userEmail: users.email,
        
        // Organization data
        organizationName: organizations.name,
        organizationDomain: organizations.domain,
      })
      .from(scanSessions)
      .leftJoin(users, eq(scanSessions.userId, users.id))
      .leftJoin(organizations, eq(users.organizationId, organizations.id))
      .where(
        and(
          eq(scanSessions.id, scanId),
          session.user.organizationId
            ? or(
                eq(scanSessions.userId, session.user.id),
                eq(scanSessions.organizationId, session.user.organizationId)
              )
            : eq(scanSessions.userId, session.user.id)
        )
      )
      .limit(1);

    if (!scanSession) {
      return NextResponse.json({ error: 'Scan not found' }, { status: 404 });
    }

    // Fetch scan results with rule information
    const results = await db
      .select({
        id: scanResults.id,
        ruleId: scanResults.ruleId,
        ruleName: compatibilityRules.name,
        ruleDescription: compatibilityRules.description,
        category: compatibilityRules.category,
        severity: compatibilityRules.severity,
        status: scanResults.status,
        message: scanResults.message,
        confidence: scanResults.confidence,
        affectedItems: scanResults.affectedItems,
        recommendations: scanResults.recommendations,
        createdAt: scanResults.createdAt,
      })
      .from(scanResults)
      .leftJoin(compatibilityRules, eq(scanResults.ruleId, compatibilityRules.id))
      .where(eq(scanResults.scanSessionId, scanId))
      .orderBy(desc(scanResults.confidence), desc(scanResults.createdAt));

    // Calculate summary statistics
    const totalResults = results.length;
    const resultsByStatus = results.reduce((acc, result) => {
      acc[result.status] = (acc[result.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const resultsBySeverity = results.reduce((acc, result) => {
      if (result.severity) {
        acc[result.severity] = (acc[result.severity] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const resultsByCategory = results.reduce((acc, result) => {
      if (result.category) {
        acc[result.category] = (acc[result.category] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const riskDistribution = {
      critical: resultsBySeverity.critical || 0,
      high: resultsBySeverity.high || 0,
      medium: resultsBySeverity.medium || 0,
      low: resultsBySeverity.low || 0,
    };

    // Build the report data structure
    const reportData: ReportData = {
      scanSession: {
        id: scanSession.id,
        sessionId: scanSession.sessionId,
        fileName: scanSession.fileName,
        status: scanSession.status,
        createdAt: scanSession.createdAt.toISOString(),
        completedAt: scanSession.completedAt?.toISOString(),
        totalChecks: scanSession.totalChecks || 0,
        completedChecks: scanSession.completedChecks || 0,
        riskScore: scanSession.riskScore || undefined,
      },
      results: results.map(result => ({
        id: result.id,
        ruleId: result.ruleId,
        ruleName: result.ruleName || 'Unknown Rule',
        ruleDescription: result.ruleDescription || '',
        category: result.category || 'unknown',
        severity: result.severity || 'medium',
        status: result.status as 'pass' | 'fail' | 'warning' | 'info',
        message: result.message,
        confidence: result.confidence,
        affectedItems: result.affectedItems ? JSON.parse(result.affectedItems) : undefined,
        recommendations: result.recommendations ? JSON.parse(result.recommendations) : undefined,
        createdAt: result.createdAt.toISOString(),
      })),
      summary: {
        totalResults,
        resultsByStatus,
        resultsBySeverity,
        resultsByCategory,
        riskDistribution,
      },
      organization: scanSession.organizationName ? {
        name: scanSession.organizationName,
        domain: scanSession.organizationDomain || undefined,
      } : undefined,
      user: {
        firstName: scanSession.userFirstName || 'Unknown',
        lastName: scanSession.userLastName || 'User',
        email: scanSession.userEmail || 'unknown@example.com',
      },
    };

    return NextResponse.json(reportData);

  } catch (error) {
    console.error('Failed to fetch report data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}