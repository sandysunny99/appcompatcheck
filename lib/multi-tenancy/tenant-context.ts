import { db } from '@/lib/db/drizzle';
import { users, organizations } from '@/lib/db/schema';
import { organizationMembers, OrganizationRole } from '@/lib/db/multi-tenancy-schema';
import { eq, and } from 'drizzle-orm';
import { redis } from '@/lib/redis/client';

export interface TenantContext {
  user: {
    id: number;
    email: string;
    name: string;
    role: string;
  };
  organization?: {
    id: number;
    name: string;
    slug: string;
    plan: string;
    isActive: boolean;
  };
  organizationRole?: OrganizationRole;
  permissions: string[];
  isSystemAdmin: boolean;
}

export interface TenantPermissions {
  // Organization permissions
  canManageOrganization: boolean;
  canInviteUsers: boolean;
  canRemoveUsers: boolean;
  canManageTeams: boolean;
  canViewAllScans: boolean;
  canManageRules: boolean;
  canViewReports: boolean;
  canManageSettings: boolean;
  
  // Scan permissions
  canCreateScans: boolean;
  canDeleteScans: boolean;
  canViewOwnScans: boolean;
  canViewTeamScans: boolean;
  
  // System permissions
  canAccessAdmin: boolean;
  canViewAuditLogs: boolean;
  canManageSystem: boolean;
}

// Tenant context service
export class TenantContextService {
  private static CACHE_TTL = 300; // 5 minutes

  // Get full tenant context for a user
  async getTenantContext(userId: number, organizationId?: number): Promise<TenantContext> {
    const cacheKey = `tenant_context:${userId}:${organizationId || 'default'}`;
    
    try {
      // Try to get from cache first
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      // Get user details
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        throw new Error('User not found');
      }

      const context: TenantContext = {
        user: {
          id: user.id,
          email: user.email,
          name: user.name || '',
          role: user.role,
        },
        permissions: [],
        isSystemAdmin: user.role === 'admin',
      };

      // Get organization context if user belongs to one
      const targetOrgId = organizationId || user.organizationId;
      
      if (targetOrgId) {
        // Get organization details
        const [org] = await db
          .select()
          .from(organizations)
          .where(eq(organizations.id, targetOrgId))
          .limit(1);

        if (org) {
          context.organization = {
            id: org.id,
            name: org.name,
            slug: org.slug,
            plan: org.plan,
            isActive: org.isActive,
          };

          // Get organization role
          const [member] = await db
            .select({ role: organizationMembers.role })
            .from(organizationMembers)
            .where(
              and(
                eq(organizationMembers.userId, userId),
                eq(organizationMembers.organizationId, targetOrgId),
                eq(organizationMembers.isActive, true)
              )
            )
            .limit(1);

          if (member) {
            context.organizationRole = member.role as OrganizationRole;
            context.permissions = this.calculatePermissions(context);
          }
        }
      }

      // If user has no organization role but is system admin, give them permissions
      if (!context.organizationRole && context.isSystemAdmin) {
        context.permissions = this.getSystemAdminPermissions();
      }

      // Cache the context
      await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(context));

      return context;

    } catch (error) {
      console.error('Failed to get tenant context:', error);
      throw error;
    }
  }

  // Calculate permissions based on roles
  private calculatePermissions(context: TenantContext): string[] {
    const permissions: string[] = [];
    const { organizationRole, isSystemAdmin, organization } = context;

    // System admin has all permissions
    if (isSystemAdmin) {
      return this.getSystemAdminPermissions();
    }

    // Organization-specific permissions
    if (organizationRole && organization?.isActive) {
      switch (organizationRole) {
        case OrganizationRole.ORG_ADMIN:
          permissions.push(
            'manage_organization',
            'invite_users',
            'remove_users',
            'manage_teams',
            'view_all_scans',
            'manage_rules',
            'view_reports',
            'manage_settings',
            'create_scans',
            'delete_scans',
            'view_own_scans',
            'view_team_scans',
            'view_audit_logs'
          );
          break;

        case OrganizationRole.MANAGER:
          permissions.push(
            'invite_users',
            'manage_teams',
            'view_all_scans',
            'view_reports',
            'create_scans',
            'delete_scans',
            'view_own_scans',
            'view_team_scans',
            'manage_rules'
          );
          break;

        case OrganizationRole.USER:
          permissions.push(
            'create_scans',
            'view_own_scans',
            'view_team_scans'
          );
          break;
      }

      // Plan-specific permissions
      if (organization.plan === 'enterprise') {
        permissions.push('advanced_reporting', 'api_access', 'sso_login');
      } else if (organization.plan === 'pro') {
        permissions.push('api_access', 'advanced_reporting');
      }
    }

    return permissions;
  }

  // Get all system admin permissions
  private getSystemAdminPermissions(): string[] {
    return [
      // Organization permissions
      'manage_organization',
      'invite_users',
      'remove_users',
      'manage_teams',
      'view_all_scans',
      'manage_rules',
      'view_reports',
      'manage_settings',
      
      // Scan permissions
      'create_scans',
      'delete_scans',
      'view_own_scans',
      'view_team_scans',
      
      // System permissions
      'access_admin',
      'view_audit_logs',
      'manage_system',
      'manage_users',
      'manage_organizations',
      
      // Advanced features
      'advanced_reporting',
      'api_access',
      'sso_login',
      'webhook_access',
    ];
  }

  // Check if user has specific permission
  async hasPermission(userId: number, permission: string, organizationId?: number): Promise<boolean> {
    try {
      const context = await this.getTenantContext(userId, organizationId);
      return context.permissions.includes(permission) || context.isSystemAdmin;
    } catch (error) {
      console.error('Failed to check permission:', error);
      return false;
    }
  }

  // Get tenant permissions object for easier checking
  async getTenantPermissions(userId: number, organizationId?: number): Promise<TenantPermissions> {
    try {
      const context = await this.getTenantContext(userId, organizationId);
      const permissions = context.permissions;
      const isSystemAdmin = context.isSystemAdmin;

      return {
        // Organization permissions
        canManageOrganization: permissions.includes('manage_organization') || isSystemAdmin,
        canInviteUsers: permissions.includes('invite_users') || isSystemAdmin,
        canRemoveUsers: permissions.includes('remove_users') || isSystemAdmin,
        canManageTeams: permissions.includes('manage_teams') || isSystemAdmin,
        canViewAllScans: permissions.includes('view_all_scans') || isSystemAdmin,
        canManageRules: permissions.includes('manage_rules') || isSystemAdmin,
        canViewReports: permissions.includes('view_reports') || isSystemAdmin,
        canManageSettings: permissions.includes('manage_settings') || isSystemAdmin,
        
        // Scan permissions
        canCreateScans: permissions.includes('create_scans') || isSystemAdmin,
        canDeleteScans: permissions.includes('delete_scans') || isSystemAdmin,
        canViewOwnScans: permissions.includes('view_own_scans') || isSystemAdmin,
        canViewTeamScans: permissions.includes('view_team_scans') || isSystemAdmin,
        
        // System permissions
        canAccessAdmin: permissions.includes('access_admin') || isSystemAdmin,
        canViewAuditLogs: permissions.includes('view_audit_logs') || isSystemAdmin,
        canManageSystem: permissions.includes('manage_system') || isSystemAdmin,
      };

    } catch (error) {
      console.error('Failed to get tenant permissions:', error);
      // Return restrictive permissions on error
      return {
        canManageOrganization: false,
        canInviteUsers: false,
        canRemoveUsers: false,
        canManageTeams: false,
        canViewAllScans: false,
        canManageRules: false,
        canViewReports: false,
        canManageSettings: false,
        canCreateScans: false,
        canDeleteScans: false,
        canViewOwnScans: false,
        canViewTeamScans: false,
        canAccessAdmin: false,
        canViewAuditLogs: false,
        canManageSystem: false,
      };
    }
  }

  // Invalidate cached context
  async invalidateContext(userId: number, organizationId?: number): Promise<void> {
    try {
      const patterns = [
        `tenant_context:${userId}:*`,
        `tenant_context:*:${organizationId || 'default'}`,
      ];

      for (const pattern of patterns) {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      }
    } catch (error) {
      console.error('Failed to invalidate context cache:', error);
    }
  }

  // Switch organization context (for users who belong to multiple orgs)
  async switchOrganization(userId: number, newOrganizationId: number): Promise<TenantContext> {
    try {
      // Verify user has access to the new organization
      const [member] = await db
        .select()
        .from(organizationMembers)
        .where(
          and(
            eq(organizationMembers.userId, userId),
            eq(organizationMembers.organizationId, newOrganizationId),
            eq(organizationMembers.isActive, true)
          )
        )
        .limit(1);

      if (!member) {
        throw new Error('User does not have access to this organization');
      }

      // Invalidate old context
      await this.invalidateContext(userId);

      // Get new context
      return await this.getTenantContext(userId, newOrganizationId);

    } catch (error) {
      console.error('Failed to switch organization:', error);
      throw error;
    }
  }

  // Middleware helper to extract tenant context from request
  async getContextFromRequest(userId: number, headers: Record<string, string>): Promise<TenantContext> {
    // Check for organization header (for API calls)
    const orgHeader = headers['x-organization-id'];
    const organizationId = orgHeader ? parseInt(orgHeader, 10) : undefined;

    return await this.getTenantContext(userId, organizationId);
  }
}

// Data isolation utility class
export class TenantDataIsolation {
  
  // Add organization filter to query based on context
  static addOrganizationFilter(query: any, context: TenantContext): any {
    // System admins can see all data
    if (context.isSystemAdmin) {
      return query;
    }

    // Users must be scoped to their organization
    if (context.organization) {
      return query.where(eq('organization_id', context.organization.id));
    }

    // Users without organization should see no organizational data
    return query.where(eq('organization_id', -1)); // Impossible condition
  }

  // Check if user can access specific resource
  static canAccessResource(
    context: TenantContext,
    resourceOrgId: number | null,
    resourceUserId?: number
  ): boolean {
    // System admins can access everything
    if (context.isSystemAdmin) {
      return true;
    }

    // No organization context means no access to organizational resources
    if (!context.organization) {
      return false;
    }

    // Resource must belong to same organization
    if (resourceOrgId !== context.organization.id) {
      return false;
    }

    // If there's a specific user ID, check if it matches current user
    // (for personal resources within organization)
    if (resourceUserId !== undefined) {
      return resourceUserId === context.user.id || 
             context.permissions.includes('view_all_scans');
    }

    return true;
  }

  // Validate organization ownership of resource
  static validateOrganizationAccess(
    userOrgId: number | null,
    resourceOrgId: number | null,
    isSystemAdmin: boolean = false
  ): boolean {
    if (isSystemAdmin) return true;
    if (!userOrgId || !resourceOrgId) return false;
    return userOrgId === resourceOrgId;
  }
}

export const tenantContextService = new TenantContextService();