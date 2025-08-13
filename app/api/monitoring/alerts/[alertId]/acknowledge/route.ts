import { NextRequest, NextResponse } from 'next/server';
import { SystemMonitor } from '@/lib/monitoring/system-monitor';
import { verifySession } from '@/lib/auth/session';

interface RouteParams {
  params: {
    alertId: string;
  };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // Verify user has admin access
    const { user } = await verifySession(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { alertId } = params;
    const monitor = SystemMonitor.getInstance();
    
    await monitor.acknowledgeAlert(alertId, user.id);

    return NextResponse.json({
      message: 'Alert acknowledged successfully',
      alertId,
      acknowledgedBy: user.id,
      timestamp: Date.now(),
    });

  } catch (error) {
    console.error('Error acknowledging alert:', error);
    return NextResponse.json(
      { error: 'Failed to acknowledge alert' },
      { status: 500 }
    );
  }
}