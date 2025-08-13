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

      // Get organization stats
      const stats = await organizationService.getOrganizationStats(organizationId);

      return NextResponse.json({
        organization: req.tenant?.organization,
        stats,
      });

    } catch (error) {
      console.error('Error fetching organization:', error);
      return NextResponse.json(
        { error: 'Failed to fetch organization' },
        { status: 500 }
      );
    }
  },
  { requireAuth: true }
);

export const PUT = withTenant(
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
          !req.canAccess('manage_organization')) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }

      const body = await req.request.json();
      // TODO: Implement organization update logic
      
      return NextResponse.json({
        message: 'Organization update not yet implemented'
      });

    } catch (error) {
      console.error('Error updating organization:', error);
      return NextResponse.json(
        { error: 'Failed to update organization' },
        { status: 500 }
      );
    }
  },
  { 
    requireAuth: true,
    requiredPermissions: ['manage_organization']
  }
);