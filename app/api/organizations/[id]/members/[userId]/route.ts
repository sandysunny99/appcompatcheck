import { NextRequest, NextResponse } from 'next/server';
import { withTenant, TenantValidator } from '@/lib/multi-tenancy/tenant-middleware';
import { organizationService } from '@/lib/multi-tenancy/organization-service';
import { OrganizationRole } from '@/lib/db/multi-tenancy-schema';

interface RouteParams {
  params: {
    id: string;
    userId: string;
  };
}

export const PUT = withTenant(
  async (req, { params }: RouteParams) => {
    try {
      const organizationId = parseInt(params.id, 10);
      const targetUserId = parseInt(params.userId, 10);

      if (isNaN(organizationId) || isNaN(targetUserId)) {
        return NextResponse.json(
          { error: 'Invalid organization or user ID' },
          { status: 400 }
        );
      }

      // Validate access and permissions
      if (!await TenantValidator.validateOrganizationParam(req, organizationId) ||
          !req.canAccess('manage_users')) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }

      const body = await req.request.json();
      const { role } = body;

      if (!role || !Object.values(OrganizationRole).includes(role)) {
        return NextResponse.json(
          { error: 'Valid role is required' },
          { status: 400 }
        );
      }

      await organizationService.updateMemberRole(organizationId, targetUserId, role);

      return NextResponse.json({
        message: 'Member role updated successfully'
      });

    } catch (error) {
      console.error('Error updating member role:', error);
      return NextResponse.json(
        { error: 'Failed to update member role' },
        { status: 500 }
      );
    }
  },
  { 
    requireAuth: true,
    requiredPermissions: ['manage_users']
  }
);

export const DELETE = withTenant(
  async (req, { params }: RouteParams) => {
    try {
      const organizationId = parseInt(params.id, 10);
      const targetUserId = parseInt(params.userId, 10);

      if (isNaN(organizationId) || isNaN(targetUserId)) {
        return NextResponse.json(
          { error: 'Invalid organization or user ID' },
          { status: 400 }
        );
      }

      // Validate access and permissions
      if (!await TenantValidator.validateOrganizationParam(req, organizationId) ||
          !req.canAccess('remove_users')) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }

      // Prevent users from removing themselves
      if (req.getUserId() === targetUserId) {
        return NextResponse.json(
          { error: 'Cannot remove yourself from organization' },
          { status: 400 }
        );
      }

      await organizationService.removeMember(organizationId, targetUserId);

      return NextResponse.json({
        message: 'Member removed successfully'
      });

    } catch (error) {
      console.error('Error removing member:', error);
      return NextResponse.json(
        { error: 'Failed to remove member' },
        { status: 500 }
      );
    }
  },
  { 
    requireAuth: true,
    requiredPermissions: ['remove_users']
  }
);