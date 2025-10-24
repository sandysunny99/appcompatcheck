import { db } from '@/lib/db/drizzle';
import { 
  organizations, 
  users, 
  NewOrganization, 
  Organization,
  User,
  OrganizationPlan 
} from '@/lib/db/schema';
import {
  organizationInvitations,
  organizationMembers,
  organizationSettings,
  organizationUsage,
  teams,
  teamMembers,
  NewOrganizationInvitation,
  NewOrganizationMember,
  NewOrganizationSettings,
  NewTeam,
  NewTeamMember,
  OrganizationRole,
  TeamRole,
} from '@/lib/db/multi-tenancy-schema';
import { eq, and, or, desc, count, sum } from 'drizzle-orm';
import { redis } from '@/lib/redis/client';
import { generateId } from '@/lib/utils/id-generator';
import { auditLogger } from '@/lib/logging/audit-logger';
import { sendEmail } from '@/lib/notifications/email-service';

export interface CreateOrganizationData {
  name: string;
  slug: string;
  plan?: OrganizationPlan;
  ownerId: number;
  settings?: {
    maxScansPerMonth?: number;
    maxFileSize?: number;
    allowedFileTypes?: string[];
    enforceTwoFactor?: boolean;
  };
}

export interface InviteUserData {
  email: string;
  role: OrganizationRole;
  organizationId: number;
  invitedBy: number;
}

export interface CreateTeamData {
  name: string;
  description?: string;
  organizationId: number;
  createdBy: number;
}

export interface OrganizationStats {
  totalMembers: number;
  activeMembers: number;
  totalTeams: number;
  monthlyScans: number;
  storageUsed: number;
  apiCalls: number;
}

// Main organization service
export class OrganizationService {
  
  // Create a new organization
  async createOrganization(data: CreateOrganizationData): Promise<Organization> {
    try {
      // Check if slug is already taken
      const existingOrg = await db
        .select()
        .from(organizations)
        .where(eq(organizations.slug, data.slug))
        .limit(1);

      if (existingOrg.length > 0) {
        throw new Error('Organization slug already exists');
      }

      // Create organization
      const [organization] = await db
        .insert(organizations)
        .values({
          name: data.name,
          slug: data.slug,
          plan: data.plan || OrganizationPlan.FREE,
          isActive: true,
        })
        .returning();

      // Add owner as organization admin
      await db.insert(organizationMembers).values({
        organizationId: organization.id,
        userId: data.ownerId,
        role: OrganizationRole.ORG_ADMIN,
        joinedAt: new Date(),
        isActive: true,
      });

      // Update user's organization ID
      await db
        .update(users)
        .set({ 
          organizationId: organization.id,
          role: 'org_admin'
        })
        .where(eq(users.id, data.ownerId));

      // Create default organization settings
      await db.insert(organizationSettings).values({
        organizationId: organization.id,
        maxScansPerMonth: data.settings?.maxScansPerMonth || (data.plan === OrganizationPlan.FREE ? 10 : 100),
        maxFileSize: data.settings?.maxFileSize || 10485760, // 10MB
        allowedFileTypes: data.settings?.allowedFileTypes || ['json', 'csv'],
        enforceTwoFactor: data.settings?.enforceTwoFactor || false,
      });

      // Initialize usage tracking for current month
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      await db.insert(organizationUsage).values({
        organizationId: organization.id,
        month: currentMonth,
        scansCount: 0,
        storageUsed: 0,
        apiCallsCount: 0,
        activeUsers: 1,
      });

      // Log audit event
      await auditLogger.logEvent({
        userId: data.ownerId.toString(),
        action: 'CREATE_ORGANIZATION',
        resource: 'organization',
        resourceId: organization.id.toString(),
        details: {
          organizationName: organization.name,
          plan: organization.plan,
        },
      });

      return organization;

    } catch (error) {
      console.error('Failed to create organization:', error);
      throw error;
    }
  }

  // Invite user to organization
  async inviteUser(data: InviteUserData): Promise<string> {
    try {
      // Check if user is already a member
      const existingMember = await db
        .select()
        .from(organizationMembers)
        .where(
          and(
            eq(organizationMembers.organizationId, data.organizationId),
            eq(organizationMembers.userId, 
              db.select({ id: users.id }).from(users).where(eq(users.email, data.email)).limit(1)
            )
          )
        )
        .limit(1);

      if (existingMember.length > 0) {
        throw new Error('User is already a member of this organization');
      }

      // Check for existing invitation
      const existingInvitation = await db
        .select()
        .from(organizationInvitations)
        .where(
          and(
            eq(organizationInvitations.organizationId, data.organizationId),
            eq(organizationInvitations.email, data.email),
            eq(organizationInvitations.acceptedAt, null)
          )
        )
        .limit(1);

      if (existingInvitation.length > 0) {
        throw new Error('User already has a pending invitation');
      }

      // Generate invitation token
      const token = generateId();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

      // Create invitation
      const [invitation] = await db
        .insert(organizationInvitations)
        .values({
          organizationId: data.organizationId,
          email: data.email,
          role: data.role,
          token,
          invitedBy: data.invitedBy,
          expiresAt,
        })
        .returning();

      // Get organization details for email
      const [organization] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, data.organizationId))
        .limit(1);

      // Send invitation email
      await sendEmail({
        to: data.email,
        subject: `Invitation to join ${organization.name}`,
        template: 'organization-invitation',
        data: {
          organizationName: organization.name,
          inviteUrl: `${process.env.NEXT_PUBLIC_APP_URL}/invite/${token}`,
          role: data.role,
          expiresAt: expiresAt.toLocaleDateString(),
        },
      });

      // Log audit event
      await auditLogger.logEvent({
        userId: data.invitedBy.toString(),
        action: 'INVITE_USER',
        resource: 'organization',
        resourceId: data.organizationId.toString(),
        details: {
          invitedEmail: data.email,
          role: data.role,
        },
      });

      return token;

    } catch (error) {
      console.error('Failed to invite user:', error);
      throw error;
    }
  }

  // Accept organization invitation
  async acceptInvitation(token: string, userId: number): Promise<void> {
    try {
      // Find invitation
      const [invitation] = await db
        .select()
        .from(organizationInvitations)
        .where(
          and(
            eq(organizationInvitations.token, token),
            eq(organizationInvitations.acceptedAt, null)
          )
        )
        .limit(1);

      if (!invitation) {
        throw new Error('Invalid or expired invitation');
      }

      if (new Date() > invitation.expiresAt) {
        throw new Error('Invitation has expired');
      }

      // Get user details
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (user.email !== invitation.email) {
        throw new Error('Invitation email does not match user email');
      }

      // Add user to organization
      await db.insert(organizationMembers).values({
        organizationId: invitation.organizationId,
        userId,
        role: invitation.role,
        joinedAt: new Date(),
        isActive: true,
      });

      // Update user's organization ID if they don't have one
      if (!user.organizationId) {
        await db
          .update(users)
          .set({ organizationId: invitation.organizationId })
          .where(eq(users.id, userId));
      }

      // Mark invitation as accepted
      await db
        .update(organizationInvitations)
        .set({ acceptedAt: new Date() })
        .where(eq(organizationInvitations.id, invitation.id));

      // Update organization usage - increment active users
      const currentMonth = new Date().toISOString().slice(0, 7);
      await db
        .update(organizationUsage)
        .set({ 
          activeUsers: db.raw('active_users + 1')
        })
        .where(
          and(
            eq(organizationUsage.organizationId, invitation.organizationId),
            eq(organizationUsage.month, currentMonth)
          )
        );

      // Log audit event
      await auditLogger.logEvent({
        userId: userId.toString(),
        action: 'ACCEPT_INVITATION',
        resource: 'organization',
        resourceId: invitation.organizationId.toString(),
        details: {
          role: invitation.role,
        },
      });

    } catch (error) {
      console.error('Failed to accept invitation:', error);
      throw error;
    }
  }

  // Create team within organization
  async createTeam(data: CreateTeamData): Promise<{ id: number; name: string; slug: string }> {
    try {
      // Generate unique slug
      const baseSlug = data.name.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      let slug = baseSlug;
      let counter = 1;
      
      while (true) {
        const existing = await db
          .select()
          .from(teams)
          .where(
            and(
              eq(teams.organizationId, data.organizationId),
              eq(teams.slug, slug)
            )
          )
          .limit(1);

        if (existing.length === 0) break;
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      // Create team
      const [team] = await db
        .insert(teams)
        .values({
          organizationId: data.organizationId,
          name: data.name,
          description: data.description || null,
          slug,
          createdBy: data.createdBy,
          isActive: true,
        })
        .returning({ id: teams.id, name: teams.name, slug: teams.slug });

      // Add creator as team lead
      await db.insert(teamMembers).values({
        teamId: team.id,
        userId: data.createdBy,
        role: TeamRole.TEAM_LEAD,
        joinedAt: new Date(),
        isActive: true,
      });

      // Log audit event
      await auditLogger.logEvent({
        userId: data.createdBy.toString(),
        action: 'CREATE_TEAM',
        resource: 'team',
        resourceId: team.id.toString(),
        details: {
          teamName: team.name,
          organizationId: data.organizationId,
        },
      });

      return team;

    } catch (error) {
      console.error('Failed to create team:', error);
      throw error;
    }
  }

  // Add user to team
  async addTeamMember(teamId: number, userId: number, role: TeamRole = TeamRole.MEMBER): Promise<void> {
    try {
      // Check if user is already a team member
      const existing = await db
        .select()
        .from(teamMembers)
        .where(
          and(
            eq(teamMembers.teamId, teamId),
            eq(teamMembers.userId, userId)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        throw new Error('User is already a member of this team');
      }

      // Add team member
      await db.insert(teamMembers).values({
        teamId,
        userId,
        role,
        joinedAt: new Date(),
        isActive: true,
      });

      // Log audit event
      await auditLogger.logEvent({
        userId: userId.toString(),
        action: 'ADD_TEAM_MEMBER',
        resource: 'team',
        resourceId: teamId.toString(),
        details: { role },
      });

    } catch (error) {
      console.error('Failed to add team member:', error);
      throw error;
    }
  }

  // Get organization statistics
  async getOrganizationStats(organizationId: number): Promise<OrganizationStats> {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);

      // Get member counts
      const memberStats = await db
        .select({
          total: count(),
          active: count(organizationMembers.isActive),
        })
        .from(organizationMembers)
        .where(eq(organizationMembers.organizationId, organizationId));

      // Get team count
      const teamStats = await db
        .select({ count: count() })
        .from(teams)
        .where(
          and(
            eq(teams.organizationId, organizationId),
            eq(teams.isActive, true)
          )
        );

      // Get usage stats for current month
      const [usageStats] = await db
        .select()
        .from(organizationUsage)
        .where(
          and(
            eq(organizationUsage.organizationId, organizationId),
            eq(organizationUsage.month, currentMonth)
          )
        )
        .limit(1);

      return {
        totalMembers: memberStats[0]?.total || 0,
        activeMembers: memberStats[0]?.active || 0,
        totalTeams: teamStats[0]?.count || 0,
        monthlyScans: usageStats?.scansCount || 0,
        storageUsed: usageStats?.storageUsed || 0,
        apiCalls: usageStats?.apiCallsCount || 0,
      };

    } catch (error) {
      console.error('Failed to get organization stats:', error);
      return {
        totalMembers: 0,
        activeMembers: 0,
        totalTeams: 0,
        monthlyScans: 0,
        storageUsed: 0,
        apiCalls: 0,
      };
    }
  }

  // Get organization members with pagination
  async getOrganizationMembers(
    organizationId: number,
    page: number = 1,
    limit: number = 50
  ): Promise<{
    members: Array<{
      id: number;
      user: {
        id: number;
        name: string;
        email: string;
      };
      role: string;
      joinedAt: Date;
      isActive: boolean;
    }>;
    total: number;
  }> {
    try {
      const offset = (page - 1) * limit;

      // Get members with user details
      const members = await db
        .select({
          id: organizationMembers.id,
          userId: organizationMembers.userId,
          userName: users.name,
          userEmail: users.email,
          role: organizationMembers.role,
          joinedAt: organizationMembers.joinedAt,
          isActive: organizationMembers.isActive,
        })
        .from(organizationMembers)
        .innerJoin(users, eq(organizationMembers.userId, users.id))
        .where(eq(organizationMembers.organizationId, organizationId))
        .orderBy(desc(organizationMembers.joinedAt))
        .limit(limit)
        .offset(offset);

      // Get total count
      const [{ count: total }] = await db
        .select({ count: count() })
        .from(organizationMembers)
        .where(eq(organizationMembers.organizationId, organizationId));

      return {
        members: members.map(m => ({
          id: m.id,
          user: {
            id: m.userId,
            name: m.userName || '',
            email: m.userEmail,
          },
          role: m.role,
          joinedAt: m.joinedAt,
          isActive: m.isActive,
        })),
        total,
      };

    } catch (error) {
      console.error('Failed to get organization members:', error);
      return { members: [], total: 0 };
    }
  }

  // Update organization member role
  async updateMemberRole(organizationId: number, userId: number, role: OrganizationRole): Promise<void> {
    try {
      await db
        .update(organizationMembers)
        .set({ 
          role,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(organizationMembers.organizationId, organizationId),
            eq(organizationMembers.userId, userId)
          )
        );

      // Log audit event
      await auditLogger.logEvent({
        userId: userId.toString(),
        action: 'UPDATE_MEMBER_ROLE',
        resource: 'organization',
        resourceId: organizationId.toString(),
        details: { newRole: role },
      });

    } catch (error) {
      console.error('Failed to update member role:', error);
      throw error;
    }
  }

  // Remove member from organization
  async removeMember(organizationId: number, userId: number): Promise<void> {
    try {
      // Deactivate member instead of deleting
      await db
        .update(organizationMembers)
        .set({ 
          isActive: false,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(organizationMembers.organizationId, organizationId),
            eq(organizationMembers.userId, userId)
          )
        );

      // Remove from all teams in the organization
      const userTeams = await db
        .select({ teamId: teamMembers.teamId })
        .from(teamMembers)
        .innerJoin(teams, eq(teamMembers.teamId, teams.id))
        .where(
          and(
            eq(teamMembers.userId, userId),
            eq(teams.organizationId, organizationId)
          )
        );

      for (const team of userTeams) {
        await db
          .update(teamMembers)
          .set({ isActive: false })
          .where(
            and(
              eq(teamMembers.teamId, team.teamId),
              eq(teamMembers.userId, userId)
            )
          );
      }

      // Update user's organization ID if this was their primary org
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (user.organizationId === organizationId) {
        await db
          .update(users)
          .set({ organizationId: null })
          .where(eq(users.id, userId));
      }

      // Log audit event
      await auditLogger.logEvent({
        userId: userId.toString(),
        action: 'REMOVE_MEMBER',
        resource: 'organization',
        resourceId: organizationId.toString(),
      });

    } catch (error) {
      console.error('Failed to remove member:', error);
      throw error;
    }
  }

  // Check if user has access to organization
  async hasOrganizationAccess(userId: number, organizationId: number): Promise<boolean> {
    try {
      const [member] = await db
        .select()
        .from(organizationMembers)
        .where(
          and(
            eq(organizationMembers.userId, userId),
            eq(organizationMembers.organizationId, organizationId),
            eq(organizationMembers.isActive, true)
          )
        )
        .limit(1);

      return !!member;

    } catch (error) {
      console.error('Failed to check organization access:', error);
      return false;
    }
  }

  // Get user's organization role
  async getUserOrganizationRole(userId: number, organizationId: number): Promise<OrganizationRole | null> {
    try {
      const [member] = await db
        .select({ role: organizationMembers.role })
        .from(organizationMembers)
        .where(
          and(
            eq(organizationMembers.userId, userId),
            eq(organizationMembers.organizationId, organizationId),
            eq(organizationMembers.isActive, true)
          )
        )
        .limit(1);

      return member?.role as OrganizationRole || null;

    } catch (error) {
      console.error('Failed to get user organization role:', error);
      return null;
    }
  }

  // Update organization usage statistics
  async updateUsageStats(
    organizationId: number,
    updates: {
      scansCount?: number;
      storageUsed?: number;
      apiCallsCount?: number;
    }
  ): Promise<void> {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);

      // Ensure usage record exists for current month
      await db
        .insert(organizationUsage)
        .values({
          organizationId,
          month: currentMonth,
          scansCount: 0,
          storageUsed: 0,
          apiCallsCount: 0,
          activeUsers: 0,
        })
        .onConflictDoNothing();

      // Update usage statistics
      const updateData: any = { updatedAt: new Date() };
      
      if (updates.scansCount !== undefined) {
        updateData.scansCount = db.raw(`scans_count + ${updates.scansCount}`);
      }
      if (updates.storageUsed !== undefined) {
        updateData.storageUsed = db.raw(`storage_used + ${updates.storageUsed}`);
      }
      if (updates.apiCallsCount !== undefined) {
        updateData.apiCallsCount = db.raw(`api_calls_count + ${updates.apiCallsCount}`);
      }

      await db
        .update(organizationUsage)
        .set(updateData)
        .where(
          and(
            eq(organizationUsage.organizationId, organizationId),
            eq(organizationUsage.month, currentMonth)
          )
        );

    } catch (error) {
      console.error('Failed to update usage stats:', error);
    }
  }
}

export const organizationService = new OrganizationService();