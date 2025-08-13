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
    const alerts = monitor.getActiveAlerts();
    const alertRules = monitor.getAlertRules();

    return NextResponse.json({
      alerts,
      rules: alertRules,
      timestamp: Date.now(),
    });

  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}