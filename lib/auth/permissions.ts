import { SessionData } from './session';
import { UserRole } from '../db/schema';

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
  if (!session || !session.user || !session.user.role) return false;
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

export function getRolePermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

export function canAccessResource(
  session: SessionData | null,
  resource: string,
  action: 'read' | 'write' | 'delete'
): boolean {
  if (!session || !session.user) return false;
  
  // Map resource and action to permission
  const permissionMap: Record<string, Record<string, Permission>> = {
    user: {
      read: Permission.USER_READ,
      write: Permission.USER_WRITE,
      delete: Permission.USER_DELETE,
    },
    scan: {
      read: Permission.SCAN_READ,
      write: Permission.SCAN_CREATE,
      delete: Permission.SCAN_DELETE,
    },
    report: {
      read: Permission.REPORT_READ,
      write: Permission.REPORT_CREATE,
      delete: Permission.REPORT_DELETE,
    },
    rule: {
      read: Permission.RULE_READ,
      write: Permission.RULE_WRITE,
      delete: Permission.RULE_DELETE,
    },
    organization: {
      read: Permission.ORG_READ,
      write: Permission.ORG_WRITE,
      delete: Permission.ORG_WRITE, // Same as write for orgs
    },
  };
  
  const permission = permissionMap[resource]?.[action];
  return permission ? hasPermission(session, permission) : false;
}