import { NextRequest, NextResponse } from 'next/server';
import { withTenant, TenantValidator } from '@/lib/multi-tenancy/tenant-middleware';
import { organizationService } from '@/lib/multi-tenancy/organization-service';
import { OrganizationRole } from '@/lib/db/multi-tenancy-schema';

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

      const { searchParams } = new URL(req.request.url);
      const page = parseInt(searchParams.get('page') || '1', 10);
      const limit = parseInt(searchParams.get('limit') || '50', 10);

      const result = await organizationService.getOrganizationMembers(
        organizationId,
        page,
        limit
      );

      return NextResponse.json(result);

    } catch (error) {
      console.error('Error fetching organization members:', error);
      return NextResponse.json(
        { error: 'Failed to fetch organization members' },
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
          !req.canAccess('invite_users')) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }

      const body = await req.request.json();
      const { email, role = OrganizationRole.USER } = body;

      if (!email) {
        return NextResponse.json(
          { error: 'Email is required' },
          { status: 400 }
        );
      }

      // Validate role
      if (!Object.values(OrganizationRole).includes(role)) {
        return NextResponse.json(
          { error: 'Invalid role' },
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

      const invitationToken = await organizationService.inviteUser({
        email,
        role,
        organizationId,
        invitedBy: userId,
      });

      return NextResponse.json(
        { 
          message: 'User invited successfully',
          invitationToken // In production, this shouldn't be returned
        },
        { status: 201 }
      );

    } catch (error) {
      console.error('Error inviting user:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('already a member') || 
            error.message.includes('pending invitation')) {
          return NextResponse.json(
            { error: error.message },
            { status: 409 }
          );
        }
      }

      return NextResponse.json(
        { error: 'Failed to invite user' },
        { status: 500 }
      );
    }
  },
  { 
    requireAuth: true,
    requiredPermissions: ['invite_users']
  }
);