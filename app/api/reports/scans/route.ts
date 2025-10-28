import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';

export async function GET() {
  try {
    await requireAuth();
    
    // Mock scan data for demo
    const mockScans = [
      {
        id: 1,
        sessionId: crypto.randomUUID(),
        fileName: 'system-scan-2024-10-28.json',
        status: 'completed',
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        totalResults: 45,
        riskScore: 3.5,
        userFirstName: 'Demo',
        userLastName: 'User'
      },
      {
        id: 2,
        sessionId: crypto.randomUUID(),
        fileName: 'security-log-analysis.json',
        status: 'completed',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        completedAt: new Date(Date.now() - 86400000).toISOString(),
        totalResults: 32,
        riskScore: 2.8,
        userFirstName: 'Demo',
        userLastName: 'User'
      }
    ];

    return NextResponse.json({ success: true, scans: mockScans });
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
