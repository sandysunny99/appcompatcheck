import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { hasPermission, Permission } from '@/lib/auth/permissions';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    
    if (!hasPermission(session, Permission.SYSTEM_SETTINGS)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Mock integrations data - replace with actual database query
    const integrations = [
      {
        id: '1',
        name: 'GitHub',
        provider: 'github',
        type: 'version_control',
        status: 'active',
        description: 'Connect to GitHub repositories for automated scanning',
        icon: 'github',
        configured: true,
        lastSync: new Date().toISOString(),
        config: {
          repositories: 12,
          webhooksEnabled: true,
        },
      },
      {
        id: '2',
        name: 'Jira',
        provider: 'jira',
        type: 'ticketing_system',
        status: 'active',
        description: 'Automatically create tickets for critical vulnerabilities',
        icon: 'jira',
        configured: true,
        lastSync: new Date().toISOString(),
        config: {
          projectKey: 'VULN',
          autoCreateTickets: true,
        },
      },
      {
        id: '3',
        name: 'Snyk',
        provider: 'snyk',
        type: 'security_scanner',
        status: 'inactive',
        description: 'Enhanced vulnerability scanning with Snyk',
        icon: 'shield',
        configured: false,
        lastSync: null,
        config: {},
      },
      {
        id: '4',
        name: 'Slack',
        provider: 'slack',
        type: 'notification',
        status: 'inactive',
        description: 'Receive scan notifications in Slack',
        icon: 'slack',
        configured: false,
        lastSync: null,
        config: {},
      },
    ];

    return NextResponse.json({
      success: true,
      integrations,
    });

  } catch (error) {
    console.error('Failed to fetch integrations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch integrations' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    
    if (!hasPermission(session, Permission.SYSTEM_SETTINGS)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { provider, config } = body;

    // Mock integration creation - replace with actual database insert
    const newIntegration = {
      id: Date.now().toString(),
      provider,
      status: 'active',
      config,
      organizationId: session.user.organizationId,
      createdAt: new Date().toISOString(),
      createdBy: session.user.id,
    };

    return NextResponse.json({
      success: true,
      integration: newIntegration,
      message: 'Integration configured successfully',
    });

  } catch (error) {
    console.error('Failed to create integration:', error);
    return NextResponse.json(
      { error: 'Failed to create integration' },
      { status: 500 }
    );
  }
}
