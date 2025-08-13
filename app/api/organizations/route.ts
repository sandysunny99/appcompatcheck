import { NextRequest, NextResponse } from 'next/server';
import { withTenant } from '@/lib/multi-tenancy/tenant-middleware';
import { organizationService } from '@/lib/multi-tenancy/organization-service';
import { OrganizationPlan } from '@/lib/db/schema';

export const GET = withTenant(
  async (req) => {
    try {
      const { searchParams } = new URL(req.request.url);
      const page = parseInt(searchParams.get('page') || '1', 10);
      const limit = parseInt(searchParams.get('limit') || '50', 10);

      // Only system admins can list all organizations
      if (!req.isSystemAdmin()) {
        // Regular users can only see their own organization
        if (!req.hasOrganization()) {
          return NextResponse.json({ organizations: [], total: 0 });
        }

        return NextResponse.json({
          organizations: [req.tenant?.organization],
          total: 1,
        });
      }

      // For system admins, implement full organization listing
      // This would need to be implemented with proper pagination
      // For now, return empty for non-admin users
      return NextResponse.json({
        organizations: [],
        total: 0,
        message: 'Organization listing not yet implemented for system admins'
      });

    } catch (error) {
      console.error('Error fetching organizations:', error);
      return NextResponse.json(
        { error: 'Failed to fetch organizations' },
        { status: 500 }
      );
    }
  },
  { requireAuth: true }
);

export const POST = withTenant(
  async (req) => {
    try {
      const body = await req.request.json();
      const { name, slug, plan = OrganizationPlan.FREE } = body;

      if (!name || !slug) {
        return NextResponse.json(
          { error: 'Name and slug are required' },
          { status: 400 }
        );
      }

      // Validate slug format
      if (!/^[a-z0-9-]+$/.test(slug)) {
        return NextResponse.json(
          { error: 'Slug must contain only lowercase letters, numbers, and hyphens' },
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

      const organization = await organizationService.createOrganization({
        name,
        slug,
        plan,
        ownerId: userId,
      });

      return NextResponse.json(
        { 
          organization,
          message: 'Organization created successfully'
        },
        { status: 201 }
      );

    } catch (error) {
      console.error('Error creating organization:', error);
      
      if (error instanceof Error && error.message.includes('already exists')) {
        return NextResponse.json(
          { error: error.message },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to create organization' },
        { status: 500 }
      );
    }
  },
  { requireAuth: true }
);