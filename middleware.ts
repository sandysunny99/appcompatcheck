import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth/jwt';

export async function middleware(request: NextRequest) {
  const startTime = Date.now();
  
  // Clone the request URL for metrics
  const { pathname, method } = request;
  
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
  
  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Add performance metrics to response headers for debugging
  if (process.env.NODE_ENV === 'development') {
    response.headers.set('X-Response-Time', `${responseTime}ms`);
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