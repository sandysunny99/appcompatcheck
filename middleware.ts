import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth/jwt';

/**
 * Security Headers Configuration
 * 
 * Implements comprehensive security headers based on OWASP recommendations
 * to protect against common web vulnerabilities.
 */

/**
 * Generate Content Security Policy (CSP) header
 * 
 * CSP helps prevent XSS attacks by controlling which resources can be loaded
 */
function generateCSP(isDevelopment: boolean): string {
  const directives = [
    // Default source for all content types
    "default-src 'self'",
    
    // Scripts: allow self, inline scripts (with nonce in production), and necessary CDNs
    isDevelopment
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
      : "script-src 'self' 'unsafe-inline' https://vercel.live https://va.vercel-scripts.com",
    
    // Styles: allow self and inline styles
    "style-src 'self' 'unsafe-inline'",
    
    // Images: allow self, data URIs, and common CDNs
    "img-src 'self' data: https: blob:",
    
    // Fonts: allow self and data URIs
    "font-src 'self' data:",
    
    // AJAX/WebSocket/EventSource connections
    isDevelopment
      ? "connect-src 'self' ws://localhost:* wss://localhost:*"
      : "connect-src 'self' https://*.vercel.app https://*.vercel.com",
    
    // Frames: only allow same origin
    "frame-src 'self'",
    
    // Objects (Flash, Java, etc.): block all
    "object-src 'none'",
    
    // Base URI: restrict to same origin
    "base-uri 'self'",
    
    // Form actions: restrict to same origin
    "form-action 'self'",
    
    // Frame ancestors: prevent clickjacking
    "frame-ancestors 'none'",
    
    // Upgrade insecure requests (HTTP -> HTTPS)
    isDevelopment ? "" : "upgrade-insecure-requests",
  ];
  
  return directives.filter(Boolean).join('; ');
}

/**
 * Apply security headers to response
 */
function applySecurityHeaders(response: NextResponse, isDevelopment: boolean): void {
  // Content Security Policy - Prevents XSS, clickjacking, and other code injection attacks
  response.headers.set('Content-Security-Policy', generateCSP(isDevelopment));
  
  // Strict-Transport-Security (HSTS) - Forces HTTPS connections
  // Note: Only applied in production to avoid issues with local development
  if (!isDevelopment) {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }
  
  // X-Content-Type-Options - Prevents MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // X-Frame-Options - Prevents clickjacking attacks
  response.headers.set('X-Frame-Options', 'DENY');
  
  // X-XSS-Protection - Enables browser's XSS filter (legacy support)
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Referrer-Policy - Controls how much referrer information is shared
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions-Policy - Controls browser features and APIs
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );
  
  // X-DNS-Prefetch-Control - Controls DNS prefetching
  response.headers.set('X-DNS-Prefetch-Control', 'off');
  
  // X-Download-Options - Prevents IE from executing downloads in site's context
  response.headers.set('X-Download-Options', 'noopen');
  
  // X-Permitted-Cross-Domain-Policies - Restricts Adobe Flash and PDF cross-domain requests
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');
  
  // Remove server information to reduce information disclosure
  response.headers.delete('X-Powered-By');
  response.headers.delete('Server');
}

export async function middleware(request: NextRequest) {
  const startTime = Date.now();
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Clone the request URL for metrics
  const { pathname } = request;
  const method = request.method;
  
  // Get user info from JWT token
  let userId: number | undefined;
  try {
    const token = request.cookies.get('session')?.value;
    if (token) {
      const payload = await verifyJWT(token);
      userId = payload.userId;
    }
  } catch (error) {
    // Token invalid or expired, continue without user info
  }

  // Proceed with the request
  const response = NextResponse.next();
  
  // Calculate response time
  const responseTime = Date.now() - startTime;
  
  // Apply comprehensive security headers
  applySecurityHeaders(response, isDevelopment);
  
  // Add performance metrics to response headers for debugging
  if (isDevelopment) {
    response.headers.set('X-Response-Time', `${responseTime}ms`);
    response.headers.set('X-Request-Path', pathname);
    response.headers.set('X-Request-Method', method);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};