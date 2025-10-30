/**
 * Rate Limiting Implementation
 * 
 * Prevents brute force attacks by limiting the number of requests
 * from a single IP address or user account within a time window.
 * 
 * Uses Redis for distributed rate limiting across multiple servers.
 */

import { redis } from '@/lib/db/redis';

export interface RateLimitConfig {
  /**
   * Maximum number of requests allowed in the time window
   */
  maxRequests: number;
  
  /**
   * Time window in seconds
   */
  windowSeconds: number;
  
  /**
   * Optional: Block duration in seconds after limit is exceeded
   */
  blockDurationSeconds?: number;
}

export interface RateLimitResult {
  /**
   * Whether the request is allowed
   */
  allowed: boolean;
  
  /**
   * Number of requests remaining in the current window
   */
  remaining: number;
  
  /**
   * Unix timestamp when the limit will reset
   */
  resetAt: number;
  
  /**
   * Total number of requests allowed in the window
   */
  limit: number;
  
  /**
   * Whether the IP/user is currently blocked
   */
  blocked?: boolean;
  
  /**
   * Unix timestamp when the block will expire (if blocked)
   */
  blockedUntil?: number;
}

/**
 * Rate limiter class using sliding window algorithm with Redis
 */
export class RateLimiter {
  private config: Required<RateLimitConfig>;
  
  constructor(config: RateLimitConfig) {
    this.config = {
      ...config,
      blockDurationSeconds: config.blockDurationSeconds || 900, // Default: 15 minutes
    };
  }
  
  /**
   * Check if a request should be allowed based on rate limiting
   * 
   * @param identifier - Unique identifier (IP address, user ID, etc.)
   * @returns Rate limit result with allowed status and metadata
   */
  async checkLimit(identifier: string): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = now - (this.config.windowSeconds * 1000);
    
    const key = `ratelimit:${identifier}`;
    const blockKey = `ratelimit:block:${identifier}`;
    
    try {
      // Check if identifier is currently blocked
      const blockExpiry = await redis.get(blockKey);
      if (blockExpiry) {
        const blockedUntil = parseInt(blockExpiry, 10);
        if (blockedUntil > now) {
          return {
            allowed: false,
            remaining: 0,
            resetAt: blockedUntil,
            limit: this.config.maxRequests,
            blocked: true,
            blockedUntil,
          };
        }
        // Block has expired, remove it
        await redis.del(blockKey);
      }
      
      // Remove old entries outside the current window
      await redis.zremrangebyscore(key, 0, windowStart);
      
      // Count requests in the current window
      const requestCount = await redis.zcard(key);
      
      // Check if limit exceeded
      if (requestCount >= this.config.maxRequests) {
        // Block the identifier
        const blockUntil = now + (this.config.blockDurationSeconds * 1000);
        await redis.set(
          blockKey,
          blockUntil.toString(),
          'EX',
          this.config.blockDurationSeconds
        );
        
        return {
          allowed: false,
          remaining: 0,
          resetAt: blockUntil,
          limit: this.config.maxRequests,
          blocked: true,
          blockedUntil: blockUntil,
        };
      }
      
      // Add current request to the window
      await redis.zadd(key, now, `${now}-${Math.random()}`);
      
      // Set expiry on the key (cleanup)
      await redis.expire(key, this.config.windowSeconds);
      
      const remaining = this.config.maxRequests - requestCount - 1;
      const resetAt = windowStart + (this.config.windowSeconds * 1000);
      
      return {
        allowed: true,
        remaining: Math.max(0, remaining),
        resetAt,
        limit: this.config.maxRequests,
      };
    } catch (error) {
      console.error('Rate limiting error:', error);
      // Fail open: allow the request if Redis is unavailable
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetAt: now + (this.config.windowSeconds * 1000),
        limit: this.config.maxRequests,
      };
    }
  }
  
  /**
   * Reset rate limit for a specific identifier
   * 
   * @param identifier - Unique identifier to reset
   */
  async resetLimit(identifier: string): Promise<void> {
    const key = `ratelimit:${identifier}`;
    const blockKey = `ratelimit:block:${identifier}`;
    
    try {
      await redis.del(key);
      await redis.del(blockKey);
    } catch (error) {
      console.error('Error resetting rate limit:', error);
    }
  }
  
  /**
   * Get current rate limit status without incrementing the counter
   * 
   * @param identifier - Unique identifier to check
   */
  async getStatus(identifier: string): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = now - (this.config.windowSeconds * 1000);
    
    const key = `ratelimit:${identifier}`;
    const blockKey = `ratelimit:block:${identifier}`;
    
    try {
      // Check if blocked
      const blockExpiry = await redis.get(blockKey);
      if (blockExpiry) {
        const blockedUntil = parseInt(blockExpiry, 10);
        if (blockedUntil > now) {
          return {
            allowed: false,
            remaining: 0,
            resetAt: blockedUntil,
            limit: this.config.maxRequests,
            blocked: true,
            blockedUntil,
          };
        }
      }
      
      // Remove old entries
      await redis.zremrangebyscore(key, 0, windowStart);
      
      // Count requests
      const requestCount = await redis.zcard(key);
      const remaining = Math.max(0, this.config.maxRequests - requestCount);
      const resetAt = windowStart + (this.config.windowSeconds * 1000);
      
      return {
        allowed: remaining > 0,
        remaining,
        resetAt,
        limit: this.config.maxRequests,
      };
    } catch (error) {
      console.error('Error getting rate limit status:', error);
      return {
        allowed: true,
        remaining: this.config.maxRequests,
        resetAt: now + (this.config.windowSeconds * 1000),
        limit: this.config.maxRequests,
      };
    }
  }
}

/**
 * Pre-configured rate limiters for common use cases
 */

// Authentication rate limiter: 5 login attempts per 15 minutes
export const authRateLimiter = new RateLimiter({
  maxRequests: 5,
  windowSeconds: 900, // 15 minutes
  blockDurationSeconds: 1800, // Block for 30 minutes after exceeding limit
});

// Registration rate limiter: 3 registrations per hour per IP
export const registrationRateLimiter = new RateLimiter({
  maxRequests: 3,
  windowSeconds: 3600, // 1 hour
  blockDurationSeconds: 3600, // Block for 1 hour
});

// API rate limiter: 100 requests per minute
export const apiRateLimiter = new RateLimiter({
  maxRequests: 100,
  windowSeconds: 60, // 1 minute
  blockDurationSeconds: 300, // Block for 5 minutes
});

// Password reset rate limiter: 3 requests per hour
export const passwordResetRateLimiter = new RateLimiter({
  maxRequests: 3,
  windowSeconds: 3600, // 1 hour
  blockDurationSeconds: 3600, // Block for 1 hour
});

// File upload rate limiter: 10 uploads per hour
export const uploadRateLimiter = new RateLimiter({
  maxRequests: 10,
  windowSeconds: 3600, // 1 hour
  blockDurationSeconds: 1800, // Block for 30 minutes
});

/**
 * Helper function to get client identifier from request
 * Uses IP address and optional user ID
 */
export function getClientIdentifier(request: Request, userId?: string): string {
  // Get IP address from headers (works with proxies)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || realIp || 'unknown';
  
  // Combine IP and user ID for more granular rate limiting
  return userId ? `${ip}:${userId}` : ip;
}

/**
 * Middleware-style rate limit checker
 * Returns response if rate limited, null if allowed
 */
export async function checkRateLimit(
  request: Request,
  limiter: RateLimiter,
  userId?: string
): Promise<Response | null> {
  const identifier = getClientIdentifier(request, userId);
  const result = await limiter.checkLimit(identifier);
  
  if (!result.allowed) {
    const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
    
    return new Response(
      JSON.stringify({
        error: 'Too many requests',
        message: result.blocked
          ? 'Your account has been temporarily blocked due to too many failed attempts. Please try again later.'
          : 'Rate limit exceeded. Please try again later.',
        retryAfter,
        resetAt: new Date(result.resetAt).toISOString(),
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': result.limit.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': result.resetAt.toString(),
        },
      }
    );
  }
  
  // Request allowed, return null to continue processing
  return null;
}

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(
  response: Response,
  result: RateLimitResult
): Response {
  const headers = new Headers(response.headers);
  headers.set('X-RateLimit-Limit', result.limit.toString());
  headers.set('X-RateLimit-Remaining', result.remaining.toString());
  headers.set('X-RateLimit-Reset', result.resetAt.toString());
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
