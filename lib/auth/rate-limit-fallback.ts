/**
 * Rate Limiting Fallback Mechanism
 * 
 * Provides an in-memory fallback store when Redis is unavailable.
 * This ensures rate limiting continues to function even if Redis fails,
 * preventing complete security failure.
 * 
 * NOTE: In-memory storage is NOT distributed and will NOT work across
 * multiple server instances. This is intentionally designed as a failsafe
 * for single-instance deployments or temporary Redis outages.
 */

import { RateLimitConfig, RateLimitResult } from './rate-limit';

interface MemoryRateLimitEntry {
  requests: number[];
  blockedUntil?: number;
  firstRequest: number;
}

/**
 * In-memory rate limiter for fallback when Redis is unavailable
 */
export class MemoryRateLimiter {
  private store: Map<string, MemoryRateLimitEntry> = new Map();
  private config: Required<RateLimitConfig>;
  private cleanupInterval: NodeJS.Timeout;
  
  constructor(config: RateLimitConfig) {
    this.config = {
      ...config,
      blockDurationSeconds: config.blockDurationSeconds || 900,
    };
    
    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
    
    // Ensure cleanup runs on process exit
    if (typeof process !== 'undefined') {
      process.on('beforeExit', () => {
        clearInterval(this.cleanupInterval);
      });
    }
  }
  
  /**
   * Check rate limit using in-memory store
   */
  checkLimit(identifier: string): RateLimitResult {
    const now = Date.now();
    const windowStart = now - (this.config.windowSeconds * 1000);
    
    // Get or create entry
    let entry = this.store.get(identifier);
    if (!entry) {
      entry = {
        requests: [],
        firstRequest: now,
      };
      this.store.set(identifier, entry);
    }
    
    // Check if currently blocked
    if (entry.blockedUntil && entry.blockedUntil > now) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.blockedUntil,
        limit: this.config.maxRequests,
        blocked: true,
        blockedUntil: entry.blockedUntil,
      };
    }
    
    // Remove expired block
    if (entry.blockedUntil && entry.blockedUntil <= now) {
      delete entry.blockedUntil;
    }
    
    // Remove requests outside the current window
    entry.requests = entry.requests.filter(timestamp => timestamp > windowStart);
    
    // Check if limit exceeded
    if (entry.requests.length >= this.config.maxRequests) {
      const blockUntil = now + (this.config.blockDurationSeconds * 1000);
      entry.blockedUntil = blockUntil;
      
      return {
        allowed: false,
        remaining: 0,
        resetAt: blockUntil,
        limit: this.config.maxRequests,
        blocked: true,
        blockedUntil: blockUntil,
      };
    }
    
    // Add current request
    entry.requests.push(now);
    
    const remaining = this.config.maxRequests - entry.requests.length;
    const resetAt = windowStart + (this.config.windowSeconds * 1000);
    
    return {
      allowed: true,
      remaining: Math.max(0, remaining),
      resetAt,
      limit: this.config.maxRequests,
    };
  }
  
  /**
   * Get current rate limit status without incrementing counter
   */
  getStatus(identifier: string): RateLimitResult {
    const now = Date.now();
    const windowStart = now - (this.config.windowSeconds * 1000);
    
    const entry = this.store.get(identifier);
    if (!entry) {
      return {
        allowed: true,
        remaining: this.config.maxRequests,
        resetAt: now + (this.config.windowSeconds * 1000),
        limit: this.config.maxRequests,
      };
    }
    
    // Check if blocked
    if (entry.blockedUntil && entry.blockedUntil > now) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.blockedUntil,
        limit: this.config.maxRequests,
        blocked: true,
        blockedUntil: entry.blockedUntil,
      };
    }
    
    // Count valid requests
    const validRequests = entry.requests.filter(timestamp => timestamp > windowStart);
    const remaining = Math.max(0, this.config.maxRequests - validRequests.length);
    const resetAt = windowStart + (this.config.windowSeconds * 1000);
    
    return {
      allowed: remaining > 0,
      remaining,
      resetAt,
      limit: this.config.maxRequests,
    };
  }
  
  /**
   * Reset rate limit for a specific identifier
   */
  resetLimit(identifier: string): void {
    this.store.delete(identifier);
  }
  
  /**
   * Clean up expired entries from memory
   * @private
   */
  private cleanup(): void {
    const now = Date.now();
    const expiredIdentifiers: string[] = [];
    
    for (const [identifier, entry] of this.store.entries()) {
      // Remove if:
      // 1. No requests in the last window AND not blocked
      // 2. Block has expired and no recent requests
      const windowStart = now - (this.config.windowSeconds * 1000);
      const hasRecentRequests = entry.requests.some(timestamp => timestamp > windowStart);
      const isBlockExpired = !entry.blockedUntil || entry.blockedUntil <= now;
      
      if (!hasRecentRequests && isBlockExpired) {
        expiredIdentifiers.push(identifier);
      }
    }
    
    // Remove expired entries
    expiredIdentifiers.forEach(identifier => this.store.delete(identifier));
    
    // Log cleanup stats if there were removals
    if (expiredIdentifiers.length > 0) {
      console.log(`[MemoryRateLimiter] Cleaned up ${expiredIdentifiers.length} expired entries. Store size: ${this.store.size}`);
    }
  }
  
  /**
   * Get current store size (for monitoring)
   */
  getStoreSize(): number {
    return this.store.size;
  }
  
  /**
   * Clear all entries (for testing)
   */
  clear(): void {
    this.store.clear();
  }
  
  /**
   * Destroy the rate limiter and cleanup resources
   */
  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

/**
 * Hybrid Rate Limiter with automatic fallback
 * 
 * Attempts to use Redis first, falls back to in-memory store if Redis fails.
 */
export class HybridRateLimiter {
  private redisLimiter: any; // RedisRateLimiter
  private memoryLimiter: MemoryRateLimiter;
  private redisAvailable: boolean = true;
  private lastRedisCheck: number = 0;
  private redisCheckInterval: number = 30000; // Check every 30 seconds
  
  constructor(
    redisLimiter: any,
    config: RateLimitConfig
  ) {
    this.redisLimiter = redisLimiter;
    this.memoryLimiter = new MemoryRateLimiter(config);
  }
  
  /**
   * Check rate limit with automatic fallback
   */
  async checkLimit(identifier: string): Promise<RateLimitResult> {
    try {
      // Try Redis first
      const result = await this.redisLimiter.checkLimit(identifier);
      
      // Mark Redis as available if we got here
      if (!this.redisAvailable) {
        console.log('[HybridRateLimiter] Redis connection restored');
        this.redisAvailable = true;
      }
      
      return result;
    } catch (error) {
      // Redis failed, use in-memory fallback
      if (this.redisAvailable) {
        console.warn('[HybridRateLimiter] Redis unavailable, falling back to in-memory store', error);
        this.redisAvailable = false;
      }
      
      // Periodically try to reconnect to Redis
      const now = Date.now();
      if (now - this.lastRedisCheck > this.redisCheckInterval) {
        this.lastRedisCheck = now;
        this.checkRedisAvailability();
      }
      
      return this.memoryLimiter.checkLimit(identifier);
    }
  }
  
  /**
   * Get status with fallback
   */
  async getStatus(identifier: string): Promise<RateLimitResult> {
    try {
      return await this.redisLimiter.getStatus(identifier);
    } catch (error) {
      return this.memoryLimiter.getStatus(identifier);
    }
  }
  
  /**
   * Reset limit with fallback
   */
  async resetLimit(identifier: string): Promise<void> {
    try {
      await this.redisLimiter.resetLimit(identifier);
    } catch (error) {
      console.warn('[HybridRateLimiter] Failed to reset Redis limit, clearing memory fallback');
    }
    // Always clear from memory fallback
    this.memoryLimiter.resetLimit(identifier);
  }
  
  /**
   * Check if Redis is available (non-blocking)
   * @private
   */
  private async checkRedisAvailability(): Promise<void> {
    try {
      // Simple ping to check Redis connectivity
      await this.redisLimiter.getStatus('health-check');
      if (!this.redisAvailable) {
        console.log('[HybridRateLimiter] Redis connection restored');
        this.redisAvailable = true;
      }
    } catch (error) {
      // Still unavailable, will try again later
    }
  }
  
  /**
   * Get statistics about the hybrid limiter
   */
  getStats(): {
    redisAvailable: boolean;
    memoryStoreSize: number;
    usingFallback: boolean;
  } {
    return {
      redisAvailable: this.redisAvailable,
      memoryStoreSize: this.memoryLimiter.getStoreSize(),
      usingFallback: !this.redisAvailable,
    };
  }
  
  /**
   * Destroy the hybrid limiter and cleanup resources
   */
  destroy(): void {
    this.memoryLimiter.destroy();
  }
}
