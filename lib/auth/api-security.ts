/**
 * API Security Wrapper
 * 
 * Unified security checks for API routes including authentication,
 * authorization, rate limiting, and input validation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from './jwt';
import { checkRateLimit, RateLimiter } from './rate-limit';
import { checkCSRFProtection } from './csrf-protection';
import { checkAccountLockout } from './account-lockout';
import { logSecurityEvent } from '@/lib/logging/security-logger';

/**
 * Security options for API routes
 */
export interface SecurityOptions {
  /**
   * Require authentication
   */
  requireAuth?: boolean;
  
  /**
   * Required roles (if any)
   */
  requiredRoles?: string[];
  
  /**
   * Required permissions (if any)
   */
  requiredPermissions?: string[];
  
  /**
   * Rate limiter to use
   */
  rateLimiter?: RateLimiter;
  
  /**
   * Enable CSRF protection
   */
  csrfProtection?: boolean;
  
  /**
   * Check account lockout status
   */
  checkLockout?: boolean;
  
  /**
   * Log security events
   */
  logEvents?: boolean;
}

/**
 * Authenticated user context
 */
export interface AuthContext {
  userId: string;
  email: string;
  role: string;
  organizationId?: string;
  sessionId?: string;
}

/**
 * API handler with security context
 */
export type SecureAPIHandler = (
  request: NextRequest,
  context: AuthContext
) => Promise<Response>;

/**
 * Wrap API route with security checks
 */
export function withSecurity(
  handler: SecureAPIHandler,
  options: SecurityOptions = {}
): (request: NextRequest) => Promise<Response> {
  return async (request: NextRequest): Promise<Response> => {
    try {
      const {
        requireAuth = true,
        requiredRoles = [],
        requiredPermissions = [],
        rateLimiter,
        csrfProtection = false,
        checkLockout = false,
        logEvents = true,
      } = options;
      
      // 1. Rate Limiting
      if (rateLimiter) {
        const rateLimitResponse = await checkRateLimit(request, rateLimiter);
        if (rateLimitResponse) {
          if (logEvents) {
            await logSecurityEvent({
              type: 'rate_limit_exceeded',
              ipAddress: getClientIP(request),
              userAgent: request.headers.get('user-agent') || undefined,
              severity: 'medium',
            });
          }
          return rateLimitResponse;
        }
      }
      
      // 2. Authentication
      let authContext: AuthContext | null = null;
      
      if (requireAuth) {
        const authHeader = request.headers.get('authorization');
        const cookieToken = request.cookies.get('session')?.value || request.cookies.get('auth-token')?.value;
        const token = authHeader?.replace('Bearer ', '') || cookieToken;
        
        if (!token) {
          return NextResponse.json(
            {
              error: 'Unauthorized',
              message: 'Authentication required',
            },
            { status: 401 }
          );
        }
        
        try {
          const payload = await verifyJWT(token);
          authContext = {
            userId: payload.userId.toString(),
            email: payload.email,
            role: payload.role,
            organizationId: payload.organizationId?.toString(),
            sessionId: token,
          };
        } catch (error) {
          if (logEvents) {
            await logSecurityEvent({
              type: 'invalid_token',
              ipAddress: getClientIP(request),
              userAgent: request.headers.get('user-agent') || undefined,
              severity: 'high',
              metadata: { error: error instanceof Error ? error.message : 'Unknown error' },
            });
          }
          
          return NextResponse.json(
            {
              error: 'Unauthorized',
              message: 'Invalid or expired token',
            },
            { status: 401 }
          );
        }
        
        // 3. Account Lockout Check
        if (checkLockout) {
          const lockoutStatus = await checkAccountLockout(authContext.email);
          if (lockoutStatus.locked && lockoutStatus.response) {
            return lockoutStatus.response;
          }
        }
        
        // 4. Role-Based Access Control
        if (requiredRoles.length > 0) {
          if (!requiredRoles.includes(authContext.role)) {
            if (logEvents) {
              await logSecurityEvent({
                type: 'permission_denied',
                userId: authContext.userId,
                email: authContext.email,
                ipAddress: getClientIP(request),
                severity: 'high',
                metadata: {
                  requiredRoles,
                  userRole: authContext.role,
                },
              });
            }
            
            return NextResponse.json(
              {
                error: 'Forbidden',
                message: 'Insufficient permissions',
              },
              { status: 403 }
            );
          }
        }
        
        // 5. Permission-Based Access Control
        // TODO: Implement permission checking system
        if (requiredPermissions.length > 0) {
          // For now, just log
          console.log('Permission check required:', requiredPermissions);
        }
      }
      
      // 6. CSRF Protection
      if (csrfProtection && authContext) {
        const csrfResponse = await checkCSRFProtection(request, authContext.sessionId);
        if (csrfResponse) {
          if (logEvents) {
            await logSecurityEvent({
              type: 'csrf_violation',
              userId: authContext.userId,
              email: authContext.email,
              ipAddress: getClientIP(request),
              severity: 'high',
            });
          }
          return csrfResponse;
        }
      }
      
      // 7. Call the actual handler
      if (!authContext && requireAuth) {
        return NextResponse.json(
          {
            error: 'Unauthorized',
            message: 'Authentication required',
          },
          { status: 401 }
        );
      }
      
      const response = await handler(request, authContext!);
      
      // 8. Log successful access (if enabled)
      if (logEvents && authContext) {
        await logSecurityEvent({
          type: 'api_access',
          userId: authContext.userId,
          email: authContext.email,
          ipAddress: getClientIP(request),
          userAgent: request.headers.get('user-agent') || undefined,
          severity: 'low',
          metadata: {
            method: request.method,
            path: new URL(request.url).pathname,
            status: response.status,
          },
        });
      }
      
      return response;
    } catch (error) {
      console.error('Security wrapper error:', error);
      
      return NextResponse.json(
        {
          error: 'Internal Server Error',
          message: 'An unexpected error occurred',
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Get client IP address from request
 */
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfIp = request.headers.get('cf-connecting-ip'); // Cloudflare
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  return cfIp || realIp || 'unknown';
}

/**
 * Convenience function for public routes (no auth required)
 */
export function withPublicSecurity(
  handler: (request: NextRequest) => Promise<Response>,
  options: Omit<SecurityOptions, 'requireAuth'> = {}
): (request: NextRequest) => Promise<Response> {
  return withSecurity(
    async (req) => handler(req),
    {
      ...options,
      requireAuth: false,
    }
  );
}

/**
 * Convenience function for admin-only routes
 */
export function withAdminSecurity(
  handler: SecureAPIHandler,
  options: Omit<SecurityOptions, 'requiredRoles'> = {}
): (request: NextRequest) => Promise<Response> {
  return withSecurity(handler, {
    ...options,
    requiredRoles: ['admin', 'owner'],
  });
}

/**
 * Convenience function for owner-only routes
 */
export function withOwnerSecurity(
  handler: SecureAPIHandler,
  options: Omit<SecurityOptions, 'requiredRoles'> = {}
): (request: NextRequest) => Promise<Response> {
  return withSecurity(handler, {
    ...options,
    requiredRoles: ['owner'],
  });
}

/**
 * Extract and validate request body
 */
export async function getValidatedBody<T>(
  request: NextRequest,
  schema: { parse: (data: any) => T }
): Promise<{ data: T; error: null } | { data: null; error: Response }> {
  try {
    const body = await request.json();
    const data = schema.parse(body);
    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error: NextResponse.json(
        {
          error: 'Validation Error',
          message: 'Invalid request body',
          details: error,
        },
        { status: 400 }
      ),
    };
  }
}

/**
 * Check if user has specific permission
 * TODO: Implement actual permission system
 */
export function hasPermission(context: AuthContext, permission: string): boolean {
  // For now, admins and owners have all permissions
  if (context.role === 'admin' || context.role === 'owner') {
    return true;
  }
  
  // TODO: Implement granular permission checking
  return false;
}

/**
 * Check if user owns the resource
 */
export function isResourceOwner(context: AuthContext, resourceUserId: string): boolean {
  return context.userId === resourceUserId;
}

/**
 * Check if user belongs to the organization
 */
export function isOrganizationMember(context: AuthContext, organizationId: string): boolean {
  return context.organizationId === organizationId;
}
