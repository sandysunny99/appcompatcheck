import { NextRequest } from 'next/server';
import { cache } from '@/lib/db/redis';

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (request: NextRequest) => string;
  skipIf?: (request: NextRequest) => boolean;
  message?: string;
  headers?: boolean;
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  message?: string;
}

export class RateLimiter {
  private options: RateLimitOptions;

  constructor(options: RateLimitOptions) {
    this.options = {
      keyGenerator: this.defaultKeyGenerator,
      skipIf: () => false,
      message: 'Too many requests from this IP, please try again later.',
      headers: true,
      ...options,
    };
  }

  private defaultKeyGenerator(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
    return `rate_limit:${ip}`;
  }

  async checkLimit(request: NextRequest): Promise<RateLimitResult> {
    if (this.options.skipIf?.(request)) {
      return {
        success: true,
        limit: this.options.maxRequests,
        remaining: this.options.maxRequests,
        resetTime: Date.now() + this.options.windowMs,
      };
    }

    const key = this.options.keyGenerator!(request);
    const now = Date.now();
    const windowStart = now - this.options.windowMs;

    try {
      // Get current request count
      const currentCountStr = await cache.get<string>(key);
      const requestData = currentCountStr ? JSON.parse(currentCountStr) : { count: 0, resetTime: now + this.options.windowMs };

      // Reset if window has expired
      if (now > requestData.resetTime) {
        requestData.count = 0;
        requestData.resetTime = now + this.options.windowMs;
      }

      // Check if limit exceeded
      if (requestData.count >= this.options.maxRequests) {
        return {
          success: false,
          limit: this.options.maxRequests,
          remaining: 0,
          resetTime: requestData.resetTime,
          message: this.options.message,
        };
      }

      // Increment counter
      requestData.count += 1;
      const remaining = this.options.maxRequests - requestData.count;

      // Store updated count
      const ttl = Math.ceil((requestData.resetTime - now) / 1000);
      await cache.set(key, JSON.stringify(requestData), ttl);

      return {
        success: true,
        limit: this.options.maxRequests,
        remaining,
        resetTime: requestData.resetTime,
      };

    } catch (error) {
      console.error('Rate limiter error:', error);
      // On error, allow the request but log the issue
      return {
        success: true,
        limit: this.options.maxRequests,
        remaining: this.options.maxRequests - 1,
        resetTime: now + this.options.windowMs,
      };
    }
  }
}

// Predefined rate limiters for different endpoints
export const apiLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requests per 15 minutes
  message: 'Too many API requests, please try again in 15 minutes.',
});

export const authLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 login attempts per 15 minutes
  message: 'Too many authentication attempts, please try again in 15 minutes.',
});

export const uploadLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 10, // 10 uploads per hour
  message: 'Too many file uploads, please try again in an hour.',
});

export const reportLimiter = new RateLimiter({
  windowMs: 10 * 60 * 1000, // 10 minutes
  maxRequests: 20, // 20 report generations per 10 minutes
  message: 'Too many report generation requests, please try again in 10 minutes.',
});

export const scanLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 50, // 50 scans per hour
  message: 'Too many scan requests, please try again in an hour.',
});

// Middleware function to apply rate limiting
export function withRateLimit(limiter: RateLimiter) {
  return async (request: NextRequest) => {
    const result = await limiter.checkLimit(request);
    
    const headers: Record<string, string> = {
      'X-RateLimit-Limit': result.limit.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
    };

    if (!result.success) {
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded', 
          message: result.message,
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
        }),
        { 
          status: 429, 
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
            ...headers,
          }
        }
      );
    }

    return { success: true, headers };
  };
}

// Advanced rate limiting with different tiers based on user role
export class TieredRateLimiter {
  private limiters: Map<string, RateLimiter>;

  constructor() {
    this.limiters = new Map([
      ['admin', new RateLimiter({ windowMs: 15 * 60 * 1000, maxRequests: 1000 })],
      ['manager', new RateLimiter({ windowMs: 15 * 60 * 1000, maxRequests: 500 })],
      ['user', new RateLimiter({ windowMs: 15 * 60 * 1000, maxRequests: 100 })],
      ['anonymous', new RateLimiter({ windowMs: 15 * 60 * 1000, maxRequests: 10 })],
    ]);
  }

  async checkLimit(request: NextRequest, userRole: string = 'anonymous'): Promise<RateLimitResult> {
    const limiter = this.limiters.get(userRole) || this.limiters.get('anonymous')!;
    return limiter.checkLimit(request);
  }
}

export const tieredLimiter = new TieredRateLimiter();

// Distributed rate limiting using Redis for multiple server instances
export class DistributedRateLimiter {
  private options: RateLimitOptions;

  constructor(options: RateLimitOptions) {
    this.options = options;
  }

  async checkLimit(request: NextRequest): Promise<RateLimitResult> {
    const key = this.options.keyGenerator!(request);
    const now = Date.now();
    const windowStart = now - this.options.windowMs;

    try {
      // Use Redis sorted sets for precise sliding window
      const pipeline = [
        // Remove expired entries
        ['ZREMRANGEBYSCORE', key, 0, windowStart],
        // Count current entries
        ['ZCARD', key],
        // Add current request
        ['ZADD', key, now, `${now}-${Math.random()}`],
        // Set expiration
        ['EXPIRE', key, Math.ceil(this.options.windowMs / 1000)],
      ];

      // Execute pipeline (would need Redis client with pipeline support)
      // For now, using simple increment approach
      const countKey = `${key}:count`;
      const current = await cache.get<number>(countKey) || 0;

      if (current >= this.options.maxRequests) {
        return {
          success: false,
          limit: this.options.maxRequests,
          remaining: 0,
          resetTime: now + this.options.windowMs,
          message: this.options.message,
        };
      }

      const newCount = current + 1;
      await cache.set(countKey, newCount, Math.ceil(this.options.windowMs / 1000));

      return {
        success: true,
        limit: this.options.maxRequests,
        remaining: this.options.maxRequests - newCount,
        resetTime: now + this.options.windowMs,
      };

    } catch (error) {
      console.error('Distributed rate limiter error:', error);
      return {
        success: true,
        limit: this.options.maxRequests,
        remaining: this.options.maxRequests - 1,
        resetTime: now + this.options.windowMs,
      };
    }
  }
}

// Rate limiting decorator for API routes
export function RateLimit(limiter: RateLimiter) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    descriptor.value = async function (request: NextRequest, ...args: any[]) {
      const result = await limiter.checkLimit(request);
      
      if (!result.success) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded', message: result.message }),
          { 
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'X-RateLimit-Limit': result.limit.toString(),
              'X-RateLimit-Remaining': result.remaining.toString(),
              'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
            }
          }
        );
      }

      return method.apply(this, [request, ...args]);
    };
  };
}