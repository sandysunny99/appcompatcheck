import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';

export async function GET() {
  try {
    await requireAuth();
    
    // Mock activity data
    const mockActivities = [
      {
        id: 1,
        action: 'scan_completed',
        description: 'System scan completed successfully',
        metadata: { scanId: 1 },
        createdAt: new Date().toISOString(),
        userName: 'Demo User'
      },
      {
        id: 2,
        action: 'report_generated',
        description: 'Report generated and downloaded',
        metadata: { reportId: 1 },
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        userName: 'Demo User'
      }
    ];

    return NextResponse.json({ success: true, activities: mockActivities });
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
