import { NextRequest, NextResponse } from 'next/server';
import { AuditLogger } from '@/lib/logging/audit-logger';
import { verifySession } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  try {
    // Verify user has admin access
    const { user } = await verifySession(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const dateFrom = url.searchParams.get('dateFrom') ? new Date(url.searchParams.get('dateFrom')!) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dateTo = url.searchParams.get('dateTo') ? new Date(url.searchParams.get('dateTo')!) : new Date();

    const auditLogger = AuditLogger.getInstance();
    const complianceReport = await auditLogger.getComplianceReport(dateFrom, dateTo);

    return NextResponse.json({
      ...complianceReport,
      reportPeriod: {
        from: dateFrom.toISOString(),
        to: dateTo.toISOString(),
      },
      generatedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error generating compliance report:', error);
    return NextResponse.json(
      { error: 'Failed to generate compliance report' },
      { status: 500 }
    );
  }
}