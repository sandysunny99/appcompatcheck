import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth/jwt';
import { tenantContextService, TenantContext } from './tenant-context';

export interface RequestWithTenant extends NextRequest {
  tenant?: TenantContext;
}

// Tenant-aware request wrapper
export class TenantRequest {
  private _tenant?: TenantContext;
  
  constructor(
    public request: NextRequest,
    tenant?: TenantContext
  ) {
    this._tenant = tenant;
  }

  get tenant(): TenantContext | undefined {
    return this._tenant;
  }

  set tenant(context: TenantContext | undefined) {
    this._tenant = context;
  }

  // Helper methods for common checks
  canAccess(permission: string): boolean {
    return this._tenant?.permissions.includes(permission) || 
           this._tenant?.isSystemAdmin || 
           false;
  }

  isSystemAdmin(): boolean {
    return this._tenant?.isSystemAdmin || false;
  }

  hasOrganization(): boolean {
    return !!this._tenant?.organization;
  }

  getOrganizationId(): number | null {
    return this._tenant?.organization?.id || null;
  }

  getUserId(): number | null {
    return this._tenant?.user.id || null;
  }

  getOrganizationRole(): string | null {
    return this._tenant?.organizationRole || null;
  }
}

// Middleware function to extract and validate tenant context
export async function withTenantContext(
  request: NextRequest,
  requireAuth: boolean = true,
  requiredPermissions: string[] = []
): Promise<{ request: TenantRequest; error?: NextResponse }> {
  
  try {
    let tenant: TenantContext | undefined;

    if (requireAuth) {
      // Extract JWT token
      const token = request.cookies.get('auth-token')?.value ||
                    request.headers.get('authorization')?.replace('Bearer ', '');

      if (!token) {
        return {
          request: new TenantRequest(request),
          error: NextResponse.json(
            { error: 'Authentication required' },
            { status: 401 }
          )
        };
      }

      try {
        // Verify token and get user ID
        const payload = await verifyJWT(token);
        const userId = parseInt(payload.userId, 10);

        // Get organization ID from header or use user's default
        const orgHeader = request.headers.get('x-organization-id');
        const organizationId = orgHeader ? parseInt(orgHeader, 10) : undefined;

        // Get tenant context
        tenant = await tenantContextService.getTenantContext(userId, organizationId);

      } catch (error) {
        return {
          request: new TenantRequest(request),
          error: NextResponse.json(
            { error: 'Invalid authentication token' },
            { status: 401 }
          )
        };
      }
    }

    // Check required permissions
    if (requiredPermissions.length > 0 && tenant) {
      const hasAllPermissions = requiredPermissions.every(permission =>
        tenant.permissions.includes(permission) || tenant.isSystemAdmin
      );

      if (!hasAllPermissions) {
        return {
          request: new TenantRequest(request, tenant),
          error: NextResponse.json(
            { error: 'Insufficient permissions' },
            { status: 403 }
          )
        };
      }
    }

    return {
      request: new TenantRequest(request, tenant)
    };

  } catch (error) {
    console.error('Tenant middleware error:', error);
    return {
      request: new TenantRequest(request),
      error: NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    };
  }
}

// API route wrapper for tenant-aware handlers
export function withTenant(
  handler: (req: TenantRequest) => Promise<NextResponse>,
  options: {
    requireAuth?: boolean;
    requiredPermissions?: string[];
    allowedRoles?: string[];
  } = {}
) {
  const {
    requireAuth = true,
    requiredPermissions = [],
    allowedRoles = []
  } = options;

  return async (request: NextRequest): Promise<NextResponse> => {
    const { request: tenantRequest, error } = await withTenantContext(
      request,
      requireAuth,
      requiredPermissions
    );

    if (error) {
      return error;
    }

    // Check allowed roles if specified
    if (allowedRoles.length > 0 && tenantRequest.tenant) {
      const userRole = tenantRequest.tenant.organizationRole || 
                       tenantRequest.tenant.user.role;
      
      if (!allowedRoles.includes(userRole) && !tenantRequest.tenant.isSystemAdmin) {
        return NextResponse.json(
          { error: 'Access denied for your role' },
          { status: 403 }
        );
      }
    }

    try {
      return await handler(tenantRequest);
    } catch (error) {
      console.error('Handler error:', error);
      return NextResponse.json(
        { error: 'Request failed' },
        { status: 500 }
      );
    }
  };
}

// Organization-scoped query builder
export class OrganizationScopedQuery {
  private context: TenantContext;

  constructor(context: TenantContext) {
    this.context = context;
  }

  // Add organization filter to queries
  addOrganizationFilter(query: any): any {
    // System admins can see all data
    if (this.context.isSystemAdmin) {
      return query;
    }

    // Users must be scoped to their organization
    if (this.context.organization) {
      return query.where('organization_id', this.context.organization.id);
    }

    // Users without organization should see no organizational data
    return query.where('organization_id', -1); // Impossible condition
  }

  // Add user filter for personal resources
  addUserFilter(query: any): any {
    if (this.context.isSystemAdmin || 
        this.context.permissions.includes('view_all_scans')) {
      return this.addOrganizationFilter(query);
    }

    // Regular users can only see their own data
    return query
      .where('user_id', this.context.user.id)
      .where('organization_id', this.context.organization?.id || -1);
  }

  // Validate resource access
  canAccessResource(
    resourceOrgId: number | null,
    resourceUserId?: number | null
  ): boolean {
    // System admins can access everything
    if (this.context.isSystemAdmin) {
      return true;
    }

    // No organization context means no access to organizational resources
    if (!this.context.organization) {
      return false;
    }

    // Resource must belong to same organization
    if (resourceOrgId !== this.context.organization.id) {
      return false;
    }

    // If there's a specific user ID, check permissions
    if (resourceUserId !== null && resourceUserId !== undefined) {
      return resourceUserId === this.context.user.id || 
             this.context.permissions.includes('view_all_scans');
    }

    return true;
  }

  // Get organization ID for queries
  getOrganizationId(): number | null {
    return this.context.organization?.id || null;
  }

  // Get user ID
  getUserId(): number {
    return this.context.user.id;
  }
}

// Route parameter validators
export class TenantValidator {
  
  // Validate organization access from route parameters
  static async validateOrganizationParam(
    tenantRequest: TenantRequest,
    orgId: string | number
  ): Promise<boolean> {
    const organizationId = typeof orgId === 'string' ? parseInt(orgId, 10) : orgId;
    
    if (isNaN(organizationId)) {
      return false;
    }

    // System admins can access any organization
    if (tenantRequest.isSystemAdmin()) {
      return true;
    }

    // Users can only access their own organization
    return tenantRequest.getOrganizationId() === organizationId;
  }

  // Validate user access (for user management endpoints)
  static async validateUserParam(
    tenantRequest: TenantRequest,
    userId: string | number
  ): Promise<boolean> {
    const targetUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    
    if (isNaN(targetUserId)) {
      return false;
    }

    // System admins can access any user
    if (tenantRequest.isSystemAdmin()) {
      return true;
    }

    // Users can access themselves
    if (tenantRequest.getUserId() === targetUserId) {
      return true;
    }

    // Org admins and managers can access users in their organization
    if (tenantRequest.canAccess('manage_users') || 
        tenantRequest.canAccess('view_all_scans')) {
      // Additional validation would be needed to ensure target user 
      // is in the same organization
      return true;
    }

    return false;
  }

  // Validate resource ownership
  static validateResourceOwnership(
    tenantRequest: TenantRequest,
    resourceOrgId: number | null,
    resourceUserId?: number | null
  ): boolean {
    // System admins can access everything
    if (tenantRequest.isSystemAdmin()) {
      return true;
    }

    const userOrgId = tenantRequest.getOrganizationId();
    const currentUserId = tenantRequest.getUserId();

    // Must belong to same organization
    if (resourceOrgId !== userOrgId) {
      return false;
    }

    // If resource has a specific owner, check permissions
    if (resourceUserId !== null && resourceUserId !== undefined) {
      return resourceUserId === currentUserId || 
             tenantRequest.canAccess('view_all_scans');
    }

    return true;
  }
}

// Error responses for tenant-related issues
export class TenantErrorResponses {
  
  static noOrganization(): NextResponse {
    return NextResponse.json(
      { 
        error: 'No organization associated with user',
        code: 'NO_ORGANIZATION'
      },
      { status: 400 }
    );
  }

  static invalidOrganization(): NextResponse {
    return NextResponse.json(
      { 
        error: 'Invalid or inaccessible organization',
        code: 'INVALID_ORGANIZATION'
      },
      { status: 403 }
    );
  }

  static insufficientPermissions(required: string[]): NextResponse {
    return NextResponse.json(
      { 
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: required
      },
      { status: 403 }
    );
  }

  static resourceNotFound(): NextResponse {
    return NextResponse.json(
      { 
        error: 'Resource not found or access denied',
        code: 'RESOURCE_NOT_FOUND'
      },
      { status: 404 }
    );
  }
}