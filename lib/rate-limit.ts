import { Redis } from 'ioredis'

// Create Redis instance for rate limiting
let redis: Redis | null = null

try {
  redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    retryDelayOnFailover: 100,
    enableReadyCheck: false,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  })
} catch (error) {
  console.warn('Redis connection failed, rate limiting will be disabled:', error)
}

/**
 * Simple in-memory rate limiter fallback
 */
const memoryStore = new Map<string, { count: number; resetTime: number }>()

/**
 * Clean up expired entries from memory store
 */
function cleanupMemoryStore() {
  const now = Date.now()
  for (const [key, value] of memoryStore.entries()) {
    if (now > value.resetTime) {
      memoryStore.delete(key)
    }
  }
}

/**
 * Rate limiting function
 * @param identifier - Unique identifier for the client (IP, user ID, etc.)
 * @param maxAttempts - Maximum number of attempts allowed
 * @param windowMs - Time window in milliseconds
 * @returns Promise with rate limit status
 */
export async function rateLimit(
  identifier: string,
  maxAttempts: number = 100,
  windowMs: number = 60 * 1000 // 1 minute default
): Promise<{
  success: boolean
  limit: number
  remaining: number
  reset: number
}> {
  const key = `rate_limit:${identifier}`
  const now = Date.now()
  const reset = now + windowMs

  try {
    if (redis && redis.status === 'ready') {
      // Use Redis for distributed rate limiting
      const pipeline = redis.pipeline()
      
      // Get current count
      pipeline.get(key)
      
      const results = await pipeline.exec()
      const currentCount = results?.[0]?.[1] as string | null
      
      const count = currentCount ? parseInt(currentCount, 10) : 0
      
      if (count >= maxAttempts) {
        // Get TTL to calculate reset time
        const ttl = await redis.ttl(key)
        const resetTime = ttl > 0 ? now + (ttl * 1000) : reset
        
        return {
          success: false,
          limit: maxAttempts,
          remaining: 0,
          reset: Math.floor(resetTime / 1000),
        }
      }
      
      // Increment counter
      const newCount = count + 1
      if (count === 0) {
        // Set with expiration
        await redis.setex(key, Math.ceil(windowMs / 1000), newCount.toString())
      } else {
        // Just increment
        await redis.incr(key)
      }
      
      return {
        success: true,
        limit: maxAttempts,
        remaining: Math.max(0, maxAttempts - newCount),
        reset: Math.floor(reset / 1000),
      }
    } else {
      // Fallback to in-memory rate limiting
      cleanupMemoryStore()
      
      const existing = memoryStore.get(key)
      const resetTime = now + windowMs
      
      if (existing && now < existing.resetTime) {
        if (existing.count >= maxAttempts) {
          return {
            success: false,
            limit: maxAttempts,
            remaining: 0,
            reset: Math.floor(existing.resetTime / 1000),
          }
        }
        
        existing.count += 1
        memoryStore.set(key, existing)
        
        return {
          success: true,
          limit: maxAttempts,
          remaining: Math.max(0, maxAttempts - existing.count),
          reset: Math.floor(existing.resetTime / 1000),
        }
      } else {
        // New entry or expired
        memoryStore.set(key, { count: 1, resetTime })
        
        return {
          success: true,
          limit: maxAttempts,
          remaining: maxAttempts - 1,
          reset: Math.floor(resetTime / 1000),
        }
      }
    }
  } catch (error) {
    console.error('Rate limiting error:', error)
    
    // On error, allow the request but log it
    return {
      success: true,
      limit: maxAttempts,
      remaining: maxAttempts,
      reset: Math.floor(reset / 1000),
    }
  }
}

/**
 * Reset rate limit for a specific identifier
 * @param identifier - Unique identifier to reset
 */
export async function resetRateLimit(identifier: string): Promise<void> {
  const key = `rate_limit:${identifier}`
  
  try {
    if (redis && redis.status === 'ready') {
      await redis.del(key)
    } else {
      memoryStore.delete(key)
    }
  } catch (error) {
    console.error('Error resetting rate limit:', error)
  }
}

/**
 * Get current rate limit status without incrementing
 * @param identifier - Unique identifier to check
 * @param maxAttempts - Maximum number of attempts allowed
 * @returns Current rate limit status
 */
export async function getRateLimitStatus(
  identifier: string,
  maxAttempts: number = 100
): Promise<{
  limit: number
  remaining: number
  reset: number
}> {
  const key = `rate_limit:${identifier}`
  const now = Date.now()
  
  try {
    if (redis && redis.status === 'ready') {
      const count = await redis.get(key)
      const ttl = await redis.ttl(key)
      
      const currentCount = count ? parseInt(count, 10) : 0
      const resetTime = ttl > 0 ? now + (ttl * 1000) : now
      
      return {
        limit: maxAttempts,
        remaining: Math.max(0, maxAttempts - currentCount),
        reset: Math.floor(resetTime / 1000),
      }
    } else {
      cleanupMemoryStore()
      const existing = memoryStore.get(key)
      
      if (existing && now < existing.resetTime) {
        return {
          limit: maxAttempts,
          remaining: Math.max(0, maxAttempts - existing.count),
          reset: Math.floor(existing.resetTime / 1000),
        }
      } else {
        return {
          limit: maxAttempts,
          remaining: maxAttempts,
          reset: Math.floor(now / 1000),
        }
      }
    }
  } catch (error) {
    console.error('Error getting rate limit status:', error)
    
    return {
      limit: maxAttempts,
      remaining: maxAttempts,
      reset: Math.floor(now / 1000),
    }
  }
}

/**
 * Middleware factory for rate limiting Express/Next.js routes
 * @param maxAttempts - Maximum attempts per window
 * @param windowMs - Time window in milliseconds
 * @param keyGenerator - Function to generate unique key from request
 * @returns Middleware function
 */
export function createRateLimitMiddleware(
  maxAttempts: number = 100,
  windowMs: number = 60 * 1000,
  keyGenerator: (req: any) => string = (req) => req.ip || 'anonymous'
) {
  return async (req: any, res: any, next: any) => {
    try {
      const identifier = keyGenerator(req)
      const result = await rateLimit(identifier, maxAttempts, windowMs)
      
      // Add rate limit headers
      res.setHeader('X-RateLimit-Limit', result.limit.toString())
      res.setHeader('X-RateLimit-Remaining', result.remaining.toString())
      res.setHeader('X-RateLimit-Reset', result.reset.toString())
      
      if (!result.success) {
        return res.status(429).json({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: result.reset,
        })
      }
      
      next()
    } catch (error) {
      console.error('Rate limit middleware error:', error)
      // On error, allow the request to continue
      next()
    }
  }
}

/**
 * Clean up Redis connection on app shutdown
 */
export async function closeRateLimitRedis(): Promise<void> {
  if (redis) {
    try {
      await redis.quit()
      console.log('Rate limit Redis connection closed')
    } catch (error) {
      console.error('Error closing rate limit Redis connection:', error)
    }
  }
}

// Health check for rate limiting system
export async function checkRateLimitHealth(): Promise<boolean> {
  try {
    if (redis && redis.status === 'ready') {
      await redis.ping()
      return true
    } else {
      // Memory store is always "healthy"
      return true
    }
  } catch (error) {
    console.error('Rate limit health check failed:', error)
    return false
  }
}