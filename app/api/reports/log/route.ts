import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { logActivity } from '@/lib/db/activity';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { scanId, format, options } = body;

    // Log the report generation activity
    await logActivity(
      session.user.id,
      'report_generated',
      `Generated ${format.toUpperCase()} report for scan #${scanId}`,
      {
        scanId,
        format,
        options: {
          includeSummary: options.includeSummary,
          includeDetails: options.includeDetails,
          includeRecommendations: options.includeRecommendations,
          includeCharts: options.includeCharts,
          hasFilters: !!(options.filterBy?.severity || options.filterBy?.status || options.filterBy?.category),
        },
      },
      session.user.organizationId
    );

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Failed to log report generation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}