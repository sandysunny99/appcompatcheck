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
    const dateFrom = url.searchParams.get('dateFrom') ? new Date(url.searchParams.get('dateFrom')!) : undefined;
    const dateTo = url.searchParams.get('dateTo') ? new Date(url.searchParams.get('dateTo')!) : undefined;

    const auditLogger = AuditLogger.getInstance();
    const statistics = await auditLogger.getAuditStatistics(dateFrom, dateTo);

    return NextResponse.json(statistics);

  } catch (error) {
    console.error('Error fetching audit statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit statistics' },
      { status: 500 }
    );
  }
}