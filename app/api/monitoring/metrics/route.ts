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
    
    // Get recent metrics
    const recentMetrics = await monitor.getRecentMetrics(50);
    
    // Get current metrics (latest one)
    const currentMetrics = recentMetrics.length > 0 ? recentMetrics[0] : null;

    return NextResponse.json({
      current: currentMetrics,
      recent: recentMetrics,
      timestamp: Date.now(),
    });

  } catch (error) {
    console.error('Error fetching metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin access for manual metric collection
    const { user } = await verifySession(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const monitor = SystemMonitor.getInstance();
    
    // Start monitoring if not already started
    monitor.startMonitoring(30); // 30 second intervals

    return NextResponse.json({
      message: 'Monitoring started',
      timestamp: Date.now(),
    });

  } catch (error) {
    console.error('Error starting monitoring:', error);
    return NextResponse.json(
      { error: 'Failed to start monitoring' },
      { status: 500 }
    );
  }
}