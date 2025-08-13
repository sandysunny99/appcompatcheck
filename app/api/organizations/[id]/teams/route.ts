import { NextRequest, NextResponse } from 'next/server';
import { withTenant, TenantValidator } from '@/lib/multi-tenancy/tenant-middleware';
import { organizationService } from '@/lib/multi-tenancy/organization-service';

interface RouteParams {
  params: {
    id: string;
  };
}

export const GET = withTenant(
  async (req, { params }: RouteParams) => {
    try {
      const organizationId = parseInt(params.id, 10);

      if (isNaN(organizationId)) {
        return NextResponse.json(
          { error: 'Invalid organization ID' },
          { status: 400 }
        );
      }

      // Validate access to organization
      if (!await TenantValidator.validateOrganizationParam(req, organizationId)) {
        return NextResponse.json(
          { error: 'Access denied to this organization' },
          { status: 403 }
        );
      }

      // TODO: Implement team listing
      return NextResponse.json({
        teams: [],
        total: 0,
        message: 'Team listing not yet fully implemented'
      });

    } catch (error) {
      console.error('Error fetching teams:', error);
      return NextResponse.json(
        { error: 'Failed to fetch teams' },
        { status: 500 }
      );
    }
  },
  { requireAuth: true }
);

export const POST = withTenant(
  async (req, { params }: RouteParams) => {
    try {
      const organizationId = parseInt(params.id, 10);

      if (isNaN(organizationId)) {
        return NextResponse.json(
          { error: 'Invalid organization ID' },
          { status: 400 }
        );
      }

      // Validate access and permissions
      if (!await TenantValidator.validateOrganizationParam(req, organizationId) ||
          !req.canAccess('manage_teams')) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }

      const body = await req.request.json();
      const { name, description } = body;

      if (!name) {
        return NextResponse.json(
          { error: 'Team name is required' },
          { status: 400 }
        );
      }

      const userId = req.getUserId();
      if (!userId) {
        return NextResponse.json(
          { error: 'User ID not found' },
          { status: 400 }
        );
      }

      const team = await organizationService.createTeam({
        name,
        description,
        organizationId,
        createdBy: userId,
      });

      return NextResponse.json(
        { 
          team,
          message: 'Team created successfully'
        },
        { status: 201 }
      );

    } catch (error) {
      console.error('Error creating team:', error);
      return NextResponse.json(
        { error: 'Failed to create team' },
        { status: 500 }
      );
    }
  },
  { 
    requireAuth: true,
    requiredPermissions: ['manage_teams']
  }
);