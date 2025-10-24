import { desc, and, eq, isNull, or, count } from 'drizzle-orm';
import { db } from './drizzle';
import {
  activityLogs,
  users,
  organizations,
  scans,
  scanResults,
  compatibilityRules,
  fileUploads,
  reports,
  notifications,
  apiKeys,
  ActivityType,
  UserRole,
  NewActivityLog,
  NewUser,
  User,
} from './schema';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/session';
import { hashPassword } from '@/lib/auth/session';

export async function getUser() {
  const sessionCookie = (await cookies()).get('session');
  if (!sessionCookie || !sessionCookie.value) {
    return null;
  }

  const sessionData = await verifyToken(sessionCookie.value);
  if (
    !sessionData ||
    !sessionData.user ||
    typeof sessionData.user.id !== 'number'
  ) {
    return null;
  }

  if (new Date(sessionData.expires) < new Date()) {
    return null;
  }

  const user = await db
    .select()
    .from(users)
    .where(and(eq(users.id, sessionData.user.id), isNull(users.deletedAt)))
    .limit(1);

  if (user.length === 0) {
    return null;
  }

  return user[0];
}

export async function getActivityLogs(limit: number = 10, userId?: number) {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const targetUserId = userId && user.role === UserRole.ADMIN ? userId : user.id;

  return await db
    .select({
      id: activityLogs.id,
      action: activityLogs.action,
      entityType: activityLogs.entityType,
      entityId: activityLogs.entityId,
      description: activityLogs.description,
      timestamp: activityLogs.timestamp,
      ipAddress: activityLogs.ipAddress,
      userAgent: activityLogs.userAgent,
      metadata: activityLogs.metadata,
      userName: users.name,
      userEmail: users.email,
    })
    .from(activityLogs)
    .leftJoin(users, eq(activityLogs.userId, users.id))
    .where(
      user.role === UserRole.ADMIN
        ? undefined
        : or(
            eq(activityLogs.userId, targetUserId),
            eq(activityLogs.organizationId, user.organizationId!)
          )
    )
    .orderBy(desc(activityLogs.timestamp))
    .limit(limit);
}

// Log activity function
export async function logActivity(data: {
  userId?: number;
  organizationId?: number;
  action: ActivityType;
  entityType?: string;
  entityId?: number;
  description?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
}): Promise<void> {
  try {
    const activityData: NewActivityLog = {
      userId: data.userId,
      organizationId: data.organizationId,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      description: data.description,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      metadata: data.metadata,
    };

    await db.insert(activityLogs).values(activityData);
  } catch (error) {
    console.error('Failed to log activity:', error);
    // Don't throw - activity logging should not break the main flow
  }
}

// User management functions
export async function createUser(userData: {
  email: string;
  password: string;
  name?: string;
  role?: UserRole;
  organizationId?: number;
}): Promise<User> {
  const passwordHash = await hashPassword(userData.password);
  
  const newUser: NewUser = {
    email: userData.email,
    passwordHash,
    name: userData.name,
    role: userData.role || UserRole.USER,
    organizationId: userData.organizationId,
  };

  const [user] = await db.insert(users).values(newUser).returning();
  
  // Log user creation
  await logActivity({
    userId: user.id,
    organizationId: user.organizationId,
    action: ActivityType.SIGN_UP,
    description: `User account created: ${user.email}`,
    entityType: 'user',
    entityId: user.id,
  });

  return user;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.email, email), isNull(users.deletedAt)))
    .limit(1);

  return user || null;
}

export async function getUserById(id: number): Promise<User | null> {
  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.id, id), isNull(users.deletedAt)))
    .limit(1);

  return user || null;
}

export async function updateUserLastLogin(userId: number): Promise<void> {
  await db
    .update(users)
    .set({ lastLoginAt: new Date() })
    .where(eq(users.id, userId));
}

// Organization functions
export async function getUserOrganization(userId: number) {
  const user = await getUserById(userId);
  if (!user || !user.organizationId) return null;

  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, user.organizationId))
    .limit(1);

  return org || null;
}

// Dashboard statistics
export async function getDashboardStats(userId: number, organizationId?: number) {
  const whereClause = organizationId
    ? eq(scans.organizationId, organizationId)
    : eq(scans.userId, userId);

  const [totalScans] = await db
    .select({ count: count() })
    .from(scans)
    .where(whereClause);

  const [completedScans] = await db
    .select({ count: count() })
    .from(scans)
    .where(and(whereClause, eq(scans.status, 'completed')));

  const [totalReports] = await db
    .select({ count: count() })
    .from(reports)
    .where(
      organizationId
        ? eq(reports.organizationId, organizationId)
        : eq(reports.userId, userId)
    );

  const [totalRules] = await db
    .select({ count: count() })
    .from(compatibilityRules)
    .where(eq(compatibilityRules.isActive, true));

  return {
    totalScans: totalScans.count,
    completedScans: completedScans.count,
    totalReports: totalReports.count,
    totalRules: totalRules.count,
  };
}

// Recent scans for dashboard
export async function getRecentScans(userId: number, organizationId?: number, limit: number = 5) {
  const whereClause = organizationId
    ? eq(scans.organizationId, organizationId)
    : eq(scans.userId, userId);

  return await db
    .select({
      id: scans.id,
      sessionId: scans.sessionId,
      name: scans.name,
      status: scans.status,
      riskScore: scans.riskScore,
      totalChecks: scans.totalChecks,
      completedChecks: scans.completedChecks,
      failedChecks: scans.failedChecks,
      createdAt: scans.createdAt,
      userName: users.name,
      userEmail: users.email,
    })
    .from(scans)
    .leftJoin(users, eq(scans.userId, users.id))
    .where(whereClause)
    .orderBy(desc(scans.createdAt))
    .limit(limit);
}