import { compare, hash } from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NewUser, User, UserRole, ActivityType } from '@/lib/db/schema';
import { sessionManager } from '@/lib/db/redis';
import { logActivity } from '@/lib/db/queries';
import crypto from 'crypto';

const key = new TextEncoder().encode(process.env.AUTH_SECRET);
const SALT_ROUNDS = 10;

export async function hashPassword(password: string) {
  return hash(password, SALT_ROUNDS);
}

export async function comparePasswords(
  plainTextPassword: string,
  hashedPassword: string
) {
  return compare(plainTextPassword, hashedPassword);
}

export type SessionData = {
  user: {
    id: number;
    email: string;
    name?: string;
    role: UserRole;
    organizationId?: number;
  };
  sessionId: string;
  expires: string;
  lastActivity: string;
  ipAddress?: string;
  userAgent?: string;
};

export async function signToken(payload: SessionData) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1 day from now')
    .sign(key);
}

export async function verifyToken(input: string) {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ['HS256'],
  });
  return payload as SessionData;
}

export async function getSession(): Promise<SessionData | null> {
  try {
    const sessionCookie = (await cookies()).get('session')?.value;
    if (!sessionCookie) return null;

    // Verify JWT token
    const tokenData = await verifyToken(sessionCookie);
    if (!tokenData) return null;

    // Check Redis session
    const sessionData = await sessionManager.getSession<SessionData>(tokenData.sessionId);
    if (!sessionData) {
      // Session expired or doesn't exist in Redis, clear cookie
      await clearSession();
      return null;
    }

    // Check if session is expired
    if (new Date(sessionData.expires) < new Date()) {
      await clearSession();
      await sessionManager.deleteSession(tokenData.sessionId);
      return null;
    }

    // Update last activity
    sessionData.lastActivity = new Date().toISOString();
    await sessionManager.updateSession(tokenData.sessionId, sessionData);

    return sessionData;
  } catch (error) {
    console.error('Session verification error:', error);
    await clearSession();
    return null;
  }
}

export async function setSession(
  user: User,
  ipAddress?: string,
  userAgent?: string
): Promise<string> {
  const sessionId = crypto.randomUUID();
  const expiresInOneDay = new Date(Date.now() + 24 * 60 * 60 * 1000);
  
  const sessionData: SessionData = {
    user: {
      id: user.id,
      email: user.email,
      name: user.name || undefined,
      role: user.role as UserRole,
      organizationId: user.organizationId || undefined,
    },
    sessionId,
    expires: expiresInOneDay.toISOString(),
    lastActivity: new Date().toISOString(),
    ipAddress,
    userAgent,
  };

  // Store session in Redis
  await sessionManager.createSession(sessionId, sessionData);

  // Create JWT token with sessionId
  const tokenPayload = {
    sessionId,
    userId: user.id,
    expires: expiresInOneDay.toISOString(),
  };
  
  const encryptedSession = await signToken(tokenPayload);
  
  // Set HTTP-only cookie
  (await cookies()).set('session', encryptedSession, {
    expires: expiresInOneDay,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });

  // Log activity
  await logActivity({
    userId: user.id,
    organizationId: user.organizationId,
    action: ActivityType.SIGN_IN,
    description: 'User signed in',
    ipAddress,
    userAgent,
    metadata: { sessionId },
  });

  return sessionId;
}

// Clear session
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}

// Destroy session (logout)
export async function destroySession(
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  const session = await getSession();
  if (!session) return;

  // Remove from Redis
  await sessionManager.deleteSession(session.sessionId);
  
  // Clear cookie
  await clearSession();

  // Log activity
  await logActivity({
    userId: session.user.id,
    organizationId: session.user.organizationId,
    action: ActivityType.SIGN_OUT,
    description: 'User signed out',
    ipAddress,
    userAgent,
    metadata: { sessionId: session.sessionId },
  });
}

// Extend session
export async function extendSession(): Promise<void> {
  const session = await getSession();
  if (!session) return;

  const newExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  session.expires = newExpires.toISOString();
  session.lastActivity = new Date().toISOString();
  
  await sessionManager.extendSession(session.sessionId);
}

// Role-based access control functions
export function hasRole(session: SessionData | null, ...roles: UserRole[]): boolean {
  if (!session) return false;
  return roles.includes(session.user.role);
}

export function isAdmin(session: SessionData | null): boolean {
  return hasRole(session, UserRole.ADMIN);
}

export function isOrgAdmin(session: SessionData | null): boolean {
  return hasRole(session, UserRole.ORG_ADMIN, UserRole.ADMIN);
}

export function canAccessOrganization(
  session: SessionData | null,
  organizationId: number
): boolean {
  if (!session) return false;
  if (isAdmin(session)) return true;
  return session.user.organizationId === organizationId;
}

// Permission system
export enum Permission {
  // User permissions
  USER_READ = 'user:read',
  USER_WRITE = 'user:write',
  USER_DELETE = 'user:delete',
  
  // Scan permissions
  SCAN_CREATE = 'scan:create',
  SCAN_READ = 'scan:read',
  SCAN_DELETE = 'scan:delete',
  
  // Report permissions
  REPORT_CREATE = 'report:create',
  REPORT_READ = 'report:read',
  REPORT_DELETE = 'report:delete',
  
  // Rule permissions
  RULE_CREATE = 'rule:create',
  RULE_READ = 'rule:read',
  RULE_WRITE = 'rule:write',
  RULE_DELETE = 'rule:delete',
  
  // Organization permissions
  ORG_READ = 'org:read',
  ORG_WRITE = 'org:write',
  ORG_MANAGE_USERS = 'org:manage_users',
  
  // Admin permissions
  ADMIN_USERS = 'admin:users',
  ADMIN_ORGANIZATIONS = 'admin:organizations',
  ADMIN_SYSTEM = 'admin:system',
}

// Role-based permissions mapping
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.USER]: [
    Permission.USER_READ,
    Permission.SCAN_CREATE,
    Permission.SCAN_READ,
    Permission.REPORT_CREATE,
    Permission.REPORT_READ,
    Permission.RULE_READ,
  ],
  [UserRole.ORG_ADMIN]: [
    Permission.USER_READ,
    Permission.USER_WRITE,
    Permission.SCAN_CREATE,
    Permission.SCAN_READ,
    Permission.SCAN_DELETE,
    Permission.REPORT_CREATE,
    Permission.REPORT_READ,
    Permission.REPORT_DELETE,
    Permission.RULE_CREATE,
    Permission.RULE_READ,
    Permission.RULE_WRITE,
    Permission.RULE_DELETE,
    Permission.ORG_READ,
    Permission.ORG_WRITE,
    Permission.ORG_MANAGE_USERS,
  ],
  [UserRole.ADMIN]: [
    ...Object.values(Permission),
  ],
};

export function hasPermission(
  session: SessionData | null,
  permission: Permission
): boolean {
  if (!session) return false;
  const rolePermissions = ROLE_PERMISSIONS[session.user.role] || [];
  return rolePermissions.includes(permission);
}

export function hasAnyPermission(
  session: SessionData | null,
  ...permissions: Permission[]
): boolean {
  return permissions.some(permission => hasPermission(session, permission));
}

export function hasAllPermissions(
  session: SessionData | null,
  ...permissions: Permission[]
): boolean {
  return permissions.every(permission => hasPermission(session, permission));
}

// Session validation middleware
export async function requireAuth(): Promise<SessionData> {
  const session = await getSession();
  if (!session) {
    throw new Error('Authentication required');
  }
  return session;
}

export async function requireRole(...roles: UserRole[]): Promise<SessionData> {
  const session = await requireAuth();
  if (!hasRole(session, ...roles)) {
    throw new Error('Insufficient permissions');
  }
  return session;
}

export async function requirePermission(permission: Permission): Promise<SessionData> {
  const session = await requireAuth();
  if (!hasPermission(session, permission)) {
    throw new Error('Insufficient permissions');
  }
  return session;
}

// Get user from session
export async function getCurrentUser(): Promise<SessionData['user'] | null> {
  const session = await getSession();
  return session?.user || null;
}

// Check if user is authenticated
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session !== null;
}

// Verify session for API routes
export async function verifySession(request?: Request): Promise<SessionData> {
  const session = await getSession();
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}

// Get all active sessions for a user
export async function getUserSessions(userId: number): Promise<SessionData[]> {
  // This would require storing user sessions in Redis with a pattern
  // For now, we'll return empty array - this can be implemented later
  return [];
}

// Revoke all sessions for a user
export async function revokeAllUserSessions(userId: number): Promise<void> {
  // This would require finding and deleting all sessions for a user
  // For now, this is a placeholder - can be implemented later
}

// Security headers helper
export function getSecurityHeaders() {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  };
}
