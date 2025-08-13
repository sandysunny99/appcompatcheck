import { NextRequest, NextResponse } from 'next/server';
import { SystemMonitor } from '@/lib/monitoring/system-monitor';
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

    const monitor = SystemMonitor.getInstance();
    const healthSummary = await monitor.getHealthSummary();

    return NextResponse.json(healthSummary);

  } catch (error) {
    console.error('Error fetching health summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch health summary' },
      { status: 500 }
    );
  }
}