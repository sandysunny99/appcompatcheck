import { NextRequest, NextResponse } from 'next/server';
import { AuditLogger } from '@/lib/logging/audit-logger';
import { verifySession } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  try {
    // Verify user has admin access
    const { user } = await verifySession(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { dateFrom, dateTo, format = 'json' } = body;

    if (!dateFrom || !dateTo) {
      return NextResponse.json(
        { error: 'Missing required fields: dateFrom, dateTo' },
        { status: 400 }
      );
    }

    const auditLogger = AuditLogger.getInstance();
    const report = await auditLogger.generateAuditReport(
      new Date(dateFrom),
      new Date(dateTo),
      format
    );

    // Set appropriate headers based on format
    if (format === 'csv') {
      return new NextResponse(report.events as string, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="audit-report-${dateFrom}-${dateTo}.csv"`,
        },
      });
    }

    return NextResponse.json(report);

  } catch (error) {
    console.error('Error generating audit report:', error);
    return NextResponse.json(
      { error: 'Failed to generate audit report' },
      { status: 500 }
    );
  }
}