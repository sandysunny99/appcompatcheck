import { NextRequest, NextResponse } from 'next/server';
import { withTenant } from '@/lib/multi-tenancy/tenant-middleware';
import { organizationService } from '@/lib/multi-tenancy/organization-service';

interface RouteParams {
  params: {
    token: string;
  };
}

export const GET = withTenant(
  async (req, { params }: RouteParams) => {
    try {
      const { token } = params;

      if (!token) {
        return NextResponse.json(
          { error: 'Invalid invitation token' },
          { status: 400 }
        );
      }

      // TODO: Implement invitation validation
      // This would fetch invitation details without accepting it
      return NextResponse.json({
        message: 'Invitation validation not yet implemented'
      });

    } catch (error) {
      console.error('Error validating invitation:', error);
      return NextResponse.json(
        { error: 'Failed to validate invitation' },
        { status: 500 }
      );
    }
  },
  { requireAuth: false }
);

export const POST = withTenant(
  async (req, { params }: RouteParams) => {
    try {
      const { token } = params;

      if (!token) {
        return NextResponse.json(
          { error: 'Invalid invitation token' },
          { status: 400 }
        );
      }

      const userId = req.getUserId();
      if (!userId) {
        return NextResponse.json(
          { error: 'User authentication required' },
          { status: 401 }
        );
      }

      await organizationService.acceptInvitation(token, userId);

      return NextResponse.json({
        message: 'Invitation accepted successfully'
      });

    } catch (error) {
      console.error('Error accepting invitation:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('Invalid') || 
            error.message.includes('expired') ||
            error.message.includes('email does not match')) {
          return NextResponse.json(
            { error: error.message },
            { status: 400 }
          );
        }
      }

      return NextResponse.json(
        { error: 'Failed to accept invitation' },
        { status: 500 }
      );
    }
  },
  { requireAuth: true }
);