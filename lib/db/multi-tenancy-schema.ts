import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  json,
  unique,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users, organizations } from './schema';

// Organization invitations table
export const organizationInvitations = pgTable('organization_invitations', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').notNull().references(() => organizations.id),
  email: varchar('email', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull().default('user'), // user, org_admin
  token: varchar('token', { length: 255 }).notNull().unique(),
  invitedBy: integer('invited_by').notNull().references(() => users.id),
  acceptedAt: timestamp('accepted_at'),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  orgIdx: index('invitations_org_idx').on(table.organizationId),
  emailIdx: index('invitations_email_idx').on(table.email),
  tokenIdx: index('invitations_token_idx').on(table.token),
}));

// Organization members table for better role management
export const organizationMembers = pgTable('organization_members', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').notNull().references(() => organizations.id),
  userId: integer('user_id').notNull().references(() => users.id),
  role: varchar('role', { length: 50 }).notNull().default('user'), // user, org_admin, manager
  permissions: json('permissions'), // Array of specific permissions
  joinedAt: timestamp('joined_at').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  orgUserUnique: unique('org_user_unique').on(table.organizationId, table.userId),
  orgIdx: index('members_org_idx').on(table.organizationId),
  userIdx: index('members_user_idx').on(table.userId),
  roleIdx: index('members_role_idx').on(table.role),
}));

// Teams within organizations
export const teams = pgTable('teams', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').notNull().references(() => organizations.id),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  slug: varchar('slug', { length: 100 }).notNull(),
  isActive: boolean('is_active').notNull().default(true),
  settings: json('settings'),
  createdBy: integer('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  orgSlugUnique: unique('org_team_slug_unique').on(table.organizationId, table.slug),
  orgIdx: index('teams_org_idx').on(table.organizationId),
  createdByIdx: index('teams_created_by_idx').on(table.createdBy),
}));

// Team members
export const teamMembers = pgTable('team_members', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id').notNull().references(() => teams.id),
  userId: integer('user_id').notNull().references(() => users.id),
  role: varchar('role', { length: 50 }).notNull().default('member'), // member, team_lead
  joinedAt: timestamp('joined_at').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  teamUserUnique: unique('team_user_unique').on(table.teamId, table.userId),
  teamIdx: index('team_members_team_idx').on(table.teamId),
  userIdx: index('team_members_user_idx').on(table.userId),
}));

// Organization settings for advanced configuration
export const organizationSettings = pgTable('organization_settings', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').notNull().references(() => organizations.id).unique(),
  // Security settings
  enforceTwo Factor: boolean('enforce_two_factor').notNull().default(false),
  sessionTimeout: integer('session_timeout').notNull().default(3600), // seconds
  passwordPolicy: json('password_policy'), // Password complexity rules
  allowedDomains: json('allowed_domains'), // Email domains for auto-join
  // Scan settings
  maxScansPerMonth: integer('max_scans_per_month'),
  maxFileSize: integer('max_file_size').notNull().default(10485760), // 10MB default
  allowedFileTypes: json('allowed_file_types'),
  defaultRetentionDays: integer('default_retention_days').notNull().default(30),
  // Integration settings
  webhookUrl: varchar('webhook_url', { length: 500 }),
  slackWebhook: varchar('slack_webhook', { length: 500 }),
  emailNotifications: boolean('email_notifications').notNull().default(true),
  // Branding
  logoUrl: varchar('logo_url', { length: 500 }),
  primaryColor: varchar('primary_color', { length: 7 }).default('#0066cc'),
  // Billing
  billingEmail: varchar('billing_email', { length: 255 }),
  subscriptionId: varchar('subscription_id', { length: 255 }),
  subscriptionStatus: varchar('subscription_status', { length: 50 }).default('active'),
  trialEndsAt: timestamp('trial_ends_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  orgIdx: index('org_settings_org_idx').on(table.organizationId),
}));

// Organization usage tracking
export const organizationUsage = pgTable('organization_usage', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').notNull().references(() => organizations.id),
  month: varchar('month', { length: 7 }).notNull(), // YYYY-MM format
  scansCount: integer('scans_count').notNull().default(0),
  storageUsed: integer('storage_used').notNull().default(0), // bytes
  apiCallsCount: integer('api_calls_count').notNull().default(0),
  activeUsers: integer('active_users').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  orgMonthUnique: unique('org_month_unique').on(table.organizationId, table.month),
  orgIdx: index('usage_org_idx').on(table.organizationId),
  monthIdx: index('usage_month_idx').on(table.month),
}));

// Subscription plans configuration
export const subscriptionPlans = pgTable('subscription_plans', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  displayName: varchar('display_name', { length: 100 }).notNull(),
  description: text('description'),
  price: integer('price').notNull(), // cents
  currency: varchar('currency', { length: 3 }).notNull().default('USD'),
  billingInterval: varchar('billing_interval', { length: 20 }).notNull(), // monthly, yearly
  features: json('features').notNull(), // Feature limits and permissions
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  nameIdx: index('plans_name_idx').on(table.name),
  activeIdx: index('plans_active_idx').on(table.isActive),
}));

// Relations for new tables
export const organizationInvitationsRelations = relations(organizationInvitations, ({ one }) => ({
  organization: one(organizations, {
    fields: [organizationInvitations.organizationId],
    references: [organizations.id],
  }),
  invitedBy: one(users, {
    fields: [organizationInvitations.invitedBy],
    references: [users.id],
  }),
}));

export const organizationMembersRelations = relations(organizationMembers, ({ one }) => ({
  organization: one(organizations, {
    fields: [organizationMembers.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [organizationMembers.userId],
    references: [users.id],
  }),
}));

export const teamsRelations = relations(teams, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [teams.organizationId],
    references: [organizations.id],
  }),
  createdBy: one(users, {
    fields: [teams.createdBy],
    references: [users.id],
  }),
  teamMembers: many(teamMembers),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
}));

export const organizationSettingsRelations = relations(organizationSettings, ({ one }) => ({
  organization: one(organizations, {
    fields: [organizationSettings.organizationId],
    references: [organizations.id],
  }),
}));

export const organizationUsageRelations = relations(organizationUsage, ({ one }) => ({
  organization: one(organizations, {
    fields: [organizationUsage.organizationId],
    references: [organizations.id],
  }),
}));

// Type definitions
export type OrganizationInvitation = typeof organizationInvitations.$inferSelect;
export type NewOrganizationInvitation = typeof organizationInvitations.$inferInsert;
export type OrganizationMember = typeof organizationMembers.$inferSelect;
export type NewOrganizationMember = typeof organizationMembers.$inferInsert;
export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
export type TeamMember = typeof teamMembers.$inferSelect;
export type NewTeamMember = typeof teamMembers.$inferInsert;
export type OrganizationSettings = typeof organizationSettings.$inferSelect;
export type NewOrganizationSettings = typeof organizationSettings.$inferInsert;
export type OrganizationUsage = typeof organizationUsage.$inferSelect;
export type NewOrganizationUsage = typeof organizationUsage.$inferInsert;
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type NewSubscriptionPlan = typeof subscriptionPlans.$inferInsert;

// Enums
export enum OrganizationRole {
  USER = 'user',
  MANAGER = 'manager',
  ORG_ADMIN = 'org_admin',
}

export enum TeamRole {
  MEMBER = 'member',
  TEAM_LEAD = 'team_lead',
}

export enum InvitationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  EXPIRED = 'expired',
}