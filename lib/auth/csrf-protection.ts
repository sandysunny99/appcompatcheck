/**
 * CSRF Protection Implementation
 * 
 * Prevents Cross-Site Request Forgery attacks using double-submit
 * cookie pattern and synchronizer tokens.
 */

import { randomBytes } from 'crypto';
import { csrfConfig } from './config';
import { redis } from '@/lib/db/redis';

/**
 * Generate a secure CSRF token
 */
export function generateCSRFToken(): string {
  return randomBytes(csrfConfig.tokenLength).toString('hex');
}

/**
 * Store CSRF token in Redis with expiration
 */
export async function storeCSRFToken(sessionId: string, token: string): Promise<void> {
  const key = `csrf:${sessionId}`;
  const expirySeconds = csrfConfig.tokenExpiresIn * 60;
  
  try {
    await redis.set(key, token, 'EX', expirySeconds);
  } catch (error) {
    console.error('Error storing CSRF token:', error);
  }
}

/**
 * Verify CSRF token
 */
export async function verifyCSRFToken(sessionId: string, token: string): Promise<boolean> {
  if (!csrfConfig.enabled) {
    return true; // CSRF protection disabled
  }
  
  const key = `csrf:${sessionId}`;
  
  try {
    const storedToken = await redis.get(key);
    return storedToken === token;
  } catch (error) {
    console.error('Error verifying CSRF token:', error);
    return false;
  }
}

/**
 * Delete CSRF token (on logout)
 */
export async function deleteCSRFToken(sessionId: string): Promise<void> {
  const key = `csrf:${sessionId}`;
  
  try {
    await redis.del(key);
  } catch (error) {
    console.error('Error deleting CSRF token:', error);
  }
}

/**
 * Check if request requires CSRF protection
 */
export function requiresCSRFProtection(request: Request): boolean {
  if (!csrfConfig.enabled) {
    return false;
  }
  
  const method = request.method;
  const url = new URL(request.url);
  
  // Check if method requires protection
  if (!csrfConfig.protectedMethods.includes(method as any)) {
    return false;
  }
  
  // Check if path is exempt
  for (const exemptPath of csrfConfig.exemptPaths) {
    if (url.pathname.startsWith(exemptPath)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Middleware for CSRF protection
 */
export async function checkCSRFProtection(
  request: Request,
  sessionId?: string
): Promise<Response | null> {
  if (!requiresCSRFProtection(request)) {
    return null; // No protection needed
  }
  
  if (!sessionId) {
    return new Response(
      JSON.stringify({
        error: 'Unauthorized',
        message: 'Session required for this action',
      }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
  
  // Get token from header or cookie
  const tokenFromHeader = request.headers.get(csrfConfig.headerName);
  const cookies = request.headers.get('cookie') || '';
  const tokenFromCookie = cookies
    .split(';')
    .find(c => c.trim().startsWith(`${csrfConfig.cookieName}=`))
    ?.split('=')[1];
  
  const token = tokenFromHeader || tokenFromCookie;
  
  if (!token) {
    return new Response(
      JSON.stringify({
        error: 'Forbidden',
        message: 'CSRF token missing',
      }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
  
  const valid = await verifyCSRFToken(sessionId, token);
  
  if (!valid) {
    return new Response(
      JSON.stringify({
        error: 'Forbidden',
        message: 'Invalid CSRF token',
      }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
  
  return null; // Token valid, allow request
}

export { csrfConfig };
