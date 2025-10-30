import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { hasPermission, Permission } from '@/lib/auth/permissions';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    
    if (!hasPermission(session, Permission.SYSTEM_SETTINGS)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { id } = params;

    // Mock integration data - replace with actual database query
    const integration = {
      id,
      name: 'GitHub',
      provider: 'github',
      type: 'version_control',
      status: 'active',
      description: 'Connect to GitHub repositories for automated scanning',
      configured: true,
      lastSync: new Date().toISOString(),
      config: {
        apiToken: '***',
        organization: 'my-org',
        repositories: ['repo1', 'repo2'],
        webhooksEnabled: true,
      },
      stats: {
        totalScans: 145,
        successfulScans: 132,
        failedScans: 13,
        lastScanAt: new Date().toISOString(),
      },
    };

    return NextResponse.json({
      success: true,
      integration,
    });

  } catch (error) {
    console.error('Failed to fetch integration:', error);
    return NextResponse.json(
      { error: 'Failed to fetch integration' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    
    if (!hasPermission(session, Permission.SYSTEM_SETTINGS)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await req.json();
    const { status, config } = body;

    // Mock integration update - replace with actual database update
    return NextResponse.json({
      success: true,
      message: 'Integration updated successfully',
    });

  } catch (error) {
    console.error('Failed to update integration:', error);
    return NextResponse.json(
      { error: 'Failed to update integration' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    
    if (!hasPermission(session, Permission.SYSTEM_SETTINGS)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { id } = params;

    // Mock integration deletion - replace with actual database delete
    return NextResponse.json({
      success: true,
      message: 'Integration deleted successfully',
    });

  } catch (error) {
    console.error('Failed to delete integration:', error);
    return NextResponse.json(
      { error: 'Failed to delete integration' },
      { status: 500 }
    );
  }
}
