import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { hasPermission, Permission } from '@/lib/auth/permissions';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    
    // Check permissions
    if (!hasPermission(session, Permission.REPORT_READ)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { reportType, filters, includeDetails = true } = body;

    // Get hostname
    const hostname = os.hostname();
    
    // Generate timestamp
    const timestamp = new Date().toISOString();
    const formattedTimestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    
    // Generate report data
    const reportData = await generateReportData({
      userId: session.user.id,
      organizationId: session.user.organizationId,
      reportType,
      filters,
      includeDetails,
      hostname,
      timestamp,
    });

    // Create filename with timestamp
    const filename = `report-${reportType}-${formattedTimestamp}.json`;
    const reportsDir = path.join(process.cwd(), 'reports');
    
    // Ensure reports directory exists
    try {
      await fs.mkdir(reportsDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    const filepath = path.join(reportsDir, filename);
    
    // Save report to file
    await fs.writeFile(filepath, JSON.stringify(reportData, null, 2), 'utf-8');

    // Return report data and file info
    return NextResponse.json({
      success: true,
      report: reportData,
      file: {
        filename,
        path: filepath,
        size: Buffer.byteLength(JSON.stringify(reportData)),
      },
      message: 'Report generated and saved successfully',
    });

  } catch (error) {
    console.error('Report generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}

async function generateReportData(params: {
  userId: number;
  organizationId?: number;
  reportType: string;
  filters: any;
  includeDetails: boolean;
  hostname: string;
  timestamp: string;
}) {
  const {
    userId,
    organizationId,
    reportType,
    filters,
    includeDetails,
    hostname,
    timestamp,
  } = params;

  // Generate report based on type
  const report = {
    metadata: {
      reportId: `RPT-${Date.now()}`,
      reportType,
      generatedAt: timestamp,
      generatedBy: userId,
      organizationId,
      hostname,
      version: '1.0.0',
    },
    filters: filters || {},
    summary: await generateSummary(reportType, filters),
    data: includeDetails ? await generateDetailedData(reportType, filters) : null,
    statistics: await generateStatistics(reportType, filters),
  };

  return report;
}

async function generateSummary(reportType: string, filters: any) {
  // Mock summary data - replace with actual data fetching
  return {
    totalScans: 156,
    totalIssues: 42,
    criticalIssues: 5,
    highPriorityIssues: 12,
    mediumPriorityIssues: 18,
    lowPriorityIssues: 7,
    resolvedIssues: 28,
    openIssues: 14,
    scanSuccessRate: 94.2,
    averageScanTime: '2.5 minutes',
  };
}

async function generateDetailedData(reportType: string, filters: any) {
  // Mock detailed data - replace with actual data fetching
  return {
    scans: [
      {
        scanId: 'SCN-001',
        scanDate: new Date().toISOString(),
        status: 'completed',
        duration: '2m 30s',
        issuesFound: 8,
        filesScanned: 245,
        linesAnalyzed: 12450,
      },
      {
        scanId: 'SCN-002',
        scanDate: new Date(Date.now() - 86400000).toISOString(),
        status: 'completed',
        duration: '2m 15s',
        issuesFound: 5,
        filesScanned: 230,
        linesAnalyzed: 11800,
      },
    ],
    issues: [
      {
        issueId: 'ISS-001',
        severity: 'critical',
        category: 'security',
        title: 'SQL Injection Vulnerability',
        file: 'database.ts',
        line: 142,
        description: 'Unsanitized user input in SQL query',
        status: 'open',
      },
      {
        issueId: 'ISS-002',
        severity: 'high',
        category: 'compatibility',
        title: 'Deprecated API Usage',
        file: 'api/auth.ts',
        line: 89,
        description: 'Using deprecated authentication method',
        status: 'open',
      },
    ],
    trends: {
      issuesByDay: [
        { date: '2024-01-20', count: 15 },
        { date: '2024-01-21', count: 12 },
        { date: '2024-01-22', count: 8 },
      ],
      scansByDay: [
        { date: '2024-01-20', count: 24 },
        { date: '2024-01-21', count: 28 },
        { date: '2024-01-22', count: 32 },
      ],
    },
  };
}

async function generateStatistics(reportType: string, filters: any) {
  // Mock statistics - replace with actual calculations
  return {
    codeQualityScore: 87.5,
    securityScore: 92.3,
    compatibilityScore: 89.1,
    performanceScore: 91.8,
    overallScore: 90.2,
    comparisonToPreviousReport: {
      codeQuality: +2.3,
      security: +1.5,
      compatibility: -0.8,
      performance: +3.2,
    },
  };
}

// GET endpoint to list all reports
export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    
    if (!hasPermission(session, Permission.REPORT_READ)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const reportsDir = path.join(process.cwd(), 'reports');
    
    try {
      await fs.mkdir(reportsDir, { recursive: true });
      const files = await fs.readdir(reportsDir);
      
      const reports = await Promise.all(
        files
          .filter(file => file.endsWith('.json'))
          .map(async (file) => {
            const filepath = path.join(reportsDir, file);
            const stats = await fs.stat(filepath);
            const content = await fs.readFile(filepath, 'utf-8');
            const reportData = JSON.parse(content);
            
            return {
              filename: file,
              size: stats.size,
              createdAt: stats.birthtime,
              modifiedAt: stats.mtime,
              metadata: reportData.metadata,
            };
          })
      );

      // Sort by creation date, newest first
      reports.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      return NextResponse.json({
        success: true,
        reports,
        total: reports.length,
      });

    } catch (error) {
      // Directory doesn't exist or is empty
      return NextResponse.json({
        success: true,
        reports: [],
        total: 0,
      });
    }

  } catch (error) {
    console.error('List reports error:', error);
    return NextResponse.json(
      { error: 'Failed to list reports' },
      { status: 500 }
    );
  }
}
