import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  uuid,
  varchar,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

// Users table - Updated to match existing database structure
export const users = pgTable(
  'users',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    name: varchar('name', { length: 100 }),
    email: varchar('email', { length: 255 }).notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    role: varchar('role', { length: 50 }).notNull().default('user'),
    organizationId: integer('organization_id'),
    isActive: boolean('is_active').notNull().default(true),
    lastLoginAt: timestamp('last_login_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    emailIdx: uniqueIndex('users_email_idx').on(table.email),
    orgIdx: index('users_org_idx').on(table.organizationId),
  })
)

// Organizations table
export const organizations = pgTable(
  'organizations',
  {
    id: varchar('id', { length: 32 }).primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    description: text('description'),
    logo: text('logo'),
    website: text('website'),
    plan: varchar('plan', { length: 50 }).notNull().default('free'),
    billingEmail: varchar('billing_email', { length: 255 }),
    isActive: boolean('is_active').notNull().default(true),
    settings: jsonb('settings').default({}),
    limits: jsonb('limits').default({}),
    usage: jsonb('usage').default({}),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    slugIdx: uniqueIndex('organizations_slug_idx').on(table.slug),
    planIdx: index('organizations_plan_idx').on(table.plan),
  })
)

// Scans table
export const scans = pgTable(
  'scans',
  {
    id: varchar('id', { length: 32 }).primaryKey(),
    organizationId: varchar('organization_id', { length: 32 }).notNull(),
    userId: varchar('user_id', { length: 32 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    type: varchar('type', { length: 50 }).notNull(),
    status: varchar('status', { length: 50 }).notNull().default('pending'),
    priority: varchar('priority', { length: 20 }).notNull().default('medium'),
    config: jsonb('config').notNull().default({}),
    files: jsonb('files').default([]),
    results: jsonb('results').default({}),
    metrics: jsonb('metrics').default({}),
    progress: integer('progress').notNull().default(0),
    error: text('error'),
    startedAt: timestamp('started_at'),
    completedAt: timestamp('completed_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    orgIdx: index('scans_organization_idx').on(table.organizationId),
    userIdx: index('scans_user_idx').on(table.userId),
    statusIdx: index('scans_status_idx').on(table.status),
    typeIdx: index('scans_type_idx').on(table.type),
    createdAtIdx: index('scans_created_at_idx').on(table.createdAt),
  })
)

// Reports table
export const reports = pgTable(
  'reports',
  {
    id: varchar('id', { length: 32 }).primaryKey(),
    organizationId: varchar('organization_id', { length: 32 }).notNull(),
    userId: varchar('user_id', { length: 32 }).notNull(),
    scanId: varchar('scan_id', { length: 32 }),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    type: varchar('type', { length: 50 }).notNull(),
    format: varchar('format', { length: 20 }).notNull().default('json'),
    status: varchar('status', { length: 50 }).notNull().default('pending'),
    config: jsonb('config').default({}),
    data: jsonb('data').default({}),
    fileUrl: text('file_url'),
    expiresAt: timestamp('expires_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    orgIdx: index('reports_organization_idx').on(table.organizationId),
    userIdx: index('reports_user_idx').on(table.userId),
    scanIdx: index('reports_scan_idx').on(table.scanId),
    statusIdx: index('reports_status_idx').on(table.status),
    typeIdx: index('reports_type_idx').on(table.type),
  })
)

// Notifications table
export const notifications = pgTable(
  'notifications',
  {
    id: varchar('id', { length: 32 }).primaryKey(),
    organizationId: varchar('organization_id', { length: 32 }),
    userId: varchar('user_id', { length: 32 }).notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    message: text('message').notNull(),
    type: varchar('type', { length: 50 }).notNull().default('info'),
    category: varchar('category', { length: 50 }).notNull().default('general'),
    priority: varchar('priority', { length: 20 }).notNull().default('medium'),
    isRead: boolean('is_read').notNull().default(false),
    readAt: timestamp('read_at'),
    data: jsonb('data').default({}),
    expiresAt: timestamp('expires_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index('notifications_user_idx').on(table.userId),
    orgIdx: index('notifications_organization_idx').on(table.organizationId),
    typeIdx: index('notifications_type_idx').on(table.type),
    isReadIdx: index('notifications_is_read_idx').on(table.isRead),
    createdAtIdx: index('notifications_created_at_idx').on(table.createdAt),
  })
)

// Activity logs table
export const activityLogs = pgTable(
  'activity_logs',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    userId: integer('user_id'),
    organizationId: integer('organization_id'),
    action: varchar('action').notNull(),
    entityType: varchar('entity_type'),
    entityId: integer('entity_id'),
    description: text('description'),
    ipAddress: varchar('ip_address'),
    userAgent: text('user_agent'),
    metadata: jsonb('metadata'),
    timestamp: timestamp('timestamp').notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index('activity_logs_user_idx').on(table.userId),
    orgIdx: index('activity_logs_organization_idx').on(table.organizationId),
    actionIdx: index('activity_logs_action_idx').on(table.action),
    timestampIdx: index('activity_logs_timestamp_idx').on(table.timestamp),
  })
)

// API keys table
export const apiKeys = pgTable(
  'api_keys',
  {
    id: varchar('id', { length: 32 }).primaryKey(),
    organizationId: varchar('organization_id', { length: 32 }).notNull(),
    userId: varchar('user_id', { length: 32 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    key: varchar('key', { length: 255 }).notNull().unique(),
    permissions: jsonb('permissions').default([]),
    isActive: boolean('is_active').notNull().default(true),
    lastUsed: timestamp('last_used'),
    expiresAt: timestamp('expires_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    keyIdx: uniqueIndex('api_keys_key_idx').on(table.key),
    orgIdx: index('api_keys_organization_idx').on(table.organizationId),
    userIdx: index('api_keys_user_idx').on(table.userId),
    isActiveIdx: index('api_keys_is_active_idx').on(table.isActive),
  })
)

// Integrations table
export const integrations = pgTable(
  'integrations',
  {
    id: varchar('id', { length: 32 }).primaryKey(),
    organizationId: varchar('organization_id', { length: 32 }).notNull(),
    userId: varchar('user_id', { length: 32 }).notNull(),
    provider: varchar('provider', { length: 50 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    config: jsonb('config').notNull().default({}),
    credentials: jsonb('credentials').default({}), // encrypted
    isActive: boolean('is_active').notNull().default(true),
    lastSync: timestamp('last_sync'),
    syncStatus: varchar('sync_status', { length: 50 }).default('idle'),
    syncError: text('sync_error'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    orgIdx: index('integrations_organization_idx').on(table.organizationId),
    userIdx: index('integrations_user_idx').on(table.userId),
    providerIdx: index('integrations_provider_idx').on(table.provider),
    isActiveIdx: index('integrations_is_active_idx').on(table.isActive),
  })
)

// Webhooks table
export const webhooks = pgTable(
  'webhooks',
  {
    id: varchar('id', { length: 32 }).primaryKey(),
    organizationId: varchar('organization_id', { length: 32 }).notNull(),
    userId: varchar('user_id', { length: 32 }).notNull(),
    url: text('url').notNull(),
    events: jsonb('events').notNull().default([]),
    secret: varchar('secret', { length: 255 }),
    isActive: boolean('is_active').notNull().default(true),
    lastDelivery: timestamp('last_delivery'),
    deliveryStatus: varchar('delivery_status', { length: 50 }).default('pending'),
    failureCount: integer('failure_count').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    orgIdx: index('webhooks_organization_idx').on(table.organizationId),
    userIdx: index('webhooks_user_idx').on(table.userId),
    isActiveIdx: index('webhooks_is_active_idx').on(table.isActive),
  })
)

// Enums
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  ORG_ADMIN = 'org_admin',
  MANAGER = 'manager',
}

export enum ActivityType {
  SIGN_IN = 'SIGN_IN',
  SIGN_UP = 'SIGN_UP',
  SIGN_OUT = 'SIGN_OUT',
  UPDATE_PASSWORD = 'UPDATE_PASSWORD',
  DELETE_ACCOUNT = 'DELETE_ACCOUNT',
  UPDATE_ACCOUNT = 'UPDATE_ACCOUNT',
  SCAN_CREATED = 'SCAN_CREATED',
  SCAN_COMPLETED = 'SCAN_COMPLETED',
  SCAN_FAILED = 'SCAN_FAILED',
  FILE_UPLOADED = 'FILE_UPLOADED',
}

// Type exports for TypeScript
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Organization = typeof organizations.$inferSelect
export type NewOrganization = typeof organizations.$inferInsert
export type Scan = typeof scans.$inferSelect
export type NewScan = typeof scans.$inferInsert
export type Report = typeof reports.$inferSelect
export type NewReport = typeof reports.$inferInsert
export type Notification = typeof notifications.$inferSelect
export type NewNotification = typeof notifications.$inferInsert
export type ActivityLog = typeof activityLogs.$inferSelect
export type NewActivityLog = typeof activityLogs.$inferInsert
export type ApiKey = typeof apiKeys.$inferSelect
export type NewApiKey = typeof apiKeys.$inferInsert
export type Integration = typeof integrations.$inferSelect
export type NewIntegration = typeof integrations.$inferInsert
export type Webhook = typeof webhooks.$inferSelect
export type NewWebhook = typeof webhooks.$inferInsert