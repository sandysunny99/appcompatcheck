import Redis from 'ioredis';

// Redis connection configuration
const redisConfig = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || 'NwMPEmkj',
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  retryDelayOnClusterDown: 300,
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
  lazyConnect: true,
};

// Create Redis client instance
export const redis = new Redis(redisConfig);

// Redis wrapper class for common operations
export class RedisCache {
  private client: Redis;

  constructor(client: Redis) {
    this.client = client;
  }

  // Set a key-value pair with optional expiration
  async set(key: string, value: any, ttl?: number): Promise<void> {
    const serializedValue = JSON.stringify(value);
    if (ttl) {
      await this.client.setex(key, ttl, serializedValue);
    } else {
      await this.client.set(key, serializedValue);
    }
  }

  // Get a value by key
  async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    if (!value) return null;
    
    try {
      return JSON.parse(value) as T;
    } catch (error) {
      console.error('Error parsing Redis value:', error);
      return null;
    }
  }

  // Delete a key
  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  // Check if key exists
  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  // Set expiration for a key
  async expire(key: string, ttl: number): Promise<void> {
    await this.client.expire(key, ttl);
  }

  // Get multiple keys
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    const values = await this.client.mget(...keys);
    return values.map(value => {
      if (!value) return null;
      try {
        return JSON.parse(value) as T;
      } catch (error) {
        console.error('Error parsing Redis value:', error);
        return null;
      }
    });
  }

  // Set multiple key-value pairs
  async mset(keyValues: Record<string, any>): Promise<void> {
    const serializedKV: string[] = [];
    for (const [key, value] of Object.entries(keyValues)) {
      serializedKV.push(key, JSON.stringify(value));
    }
    await this.client.mset(...serializedKV);
  }

  // Increment a counter
  async incr(key: string): Promise<number> {
    return await this.client.incr(key);
  }

  // Decrement a counter
  async decr(key: string): Promise<number> {
    return await this.client.decr(key);
  }

  // Add to a set
  async sadd(key: string, ...members: string[]): Promise<number> {
    return await this.client.sadd(key, ...members);
  }

  // Get all members of a set
  async smembers(key: string): Promise<string[]> {
    return await this.client.smembers(key);
  }

  // Remove from a set
  async srem(key: string, ...members: string[]): Promise<number> {
    return await this.client.srem(key, ...members);
  }

  // Check if member is in set
  async sismember(key: string, member: string): Promise<boolean> {
    const result = await this.client.sismember(key, member);
    return result === 1;
  }

  // Push to a list
  async lpush(key: string, ...values: string[]): Promise<number> {
    return await this.client.lpush(key, ...values);
  }

  // Pop from a list
  async lpop(key: string): Promise<string | null> {
    return await this.client.lpop(key);
  }

  // Get list length
  async llen(key: string): Promise<number> {
    return await this.client.llen(key);
  }

  // Get range from list
  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    return await this.client.lrange(key, start, stop);
  }

  // Hash operations
  async hset(key: string, field: string, value: any): Promise<void> {
    await this.client.hset(key, field, JSON.stringify(value));
  }

  async hget<T>(key: string, field: string): Promise<T | null> {
    const value = await this.client.hget(key, field);
    if (!value) return null;
    
    try {
      return JSON.parse(value) as T;
    } catch (error) {
      console.error('Error parsing Redis hash value:', error);
      return null;
    }
  }

  async hgetall<T>(key: string): Promise<Record<string, T>> {
    const hash = await this.client.hgetall(key);
    const result: Record<string, T> = {};
    
    for (const [field, value] of Object.entries(hash)) {
      try {
        result[field] = JSON.parse(value) as T;
      } catch (error) {
        console.error('Error parsing Redis hash value:', error);
      }
    }
    
    return result;
  }

  async hdel(key: string, ...fields: string[]): Promise<number> {
    return await this.client.hdel(key, ...fields);
  }

  // Pattern matching
  async keys(pattern: string): Promise<string[]> {
    return await this.client.keys(pattern);
  }

  // Clear cache by pattern
  async clearPattern(pattern: string): Promise<void> {
    const keys = await this.keys(pattern);
    if (keys.length > 0) {
      await this.client.del(...keys);
    }
  }

  // Health check
  async ping(): Promise<string> {
    return await this.client.ping();
  }

  // Get connection status
  get status(): string {
    return this.client.status;
  }

  // Close connection
  async quit(): Promise<void> {
    await this.client.quit();
  }
}

// Create cache instance
export const cache = new RedisCache(redis);

// Session management utilities
export class SessionManager {
  private cache: RedisCache;
  private sessionPrefix = 'session:';
  private defaultTTL = 24 * 60 * 60; // 24 hours

  constructor(cache: RedisCache) {
    this.cache = cache;
  }

  private getSessionKey(sessionId: string): string {
    return `${this.sessionPrefix}${sessionId}`;
  }

  async createSession(sessionId: string, data: any, ttl?: number): Promise<void> {
    const key = this.getSessionKey(sessionId);
    await this.cache.set(key, data, ttl || this.defaultTTL);
  }

  async getSession<T>(sessionId: string): Promise<T | null> {
    const key = this.getSessionKey(sessionId);
    return await this.cache.get<T>(key);
  }

  async updateSession(sessionId: string, data: any, ttl?: number): Promise<void> {
    const key = this.getSessionKey(sessionId);
    await this.cache.set(key, data, ttl || this.defaultTTL);
  }

  async deleteSession(sessionId: string): Promise<void> {
    const key = this.getSessionKey(sessionId);
    await this.cache.del(key);
  }

  async extendSession(sessionId: string, ttl?: number): Promise<void> {
    const key = this.getSessionKey(sessionId);
    await this.cache.expire(key, ttl || this.defaultTTL);
  }

  async sessionExists(sessionId: string): Promise<boolean> {
    const key = this.getSessionKey(sessionId);
    return await this.cache.exists(key);
  }
}

// Create session manager instance
export const sessionManager = new SessionManager(cache);

// Rate limiting utilities
export class RateLimiter {
  private cache: RedisCache;
  private keyPrefix = 'rate_limit:';

  constructor(cache: RedisCache) {
    this.cache = cache;
  }

  private getRateLimitKey(identifier: string, action: string): string {
    return `${this.keyPrefix}${action}:${identifier}`;
  }

  async checkRateLimit(
    identifier: string,
    action: string,
    limit: number,
    windowSeconds: number
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const key = this.getRateLimitKey(identifier, action);
    const current = await this.cache.get<number>(key) || 0;
    
    if (current >= limit) {
      const ttl = await redis.ttl(key);
      return {
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + (ttl * 1000)
      };
    }

    const newCount = await this.cache.incr(key);
    if (newCount === 1) {
      await this.cache.expire(key, windowSeconds);
    }

    return {
      allowed: true,
      remaining: Math.max(0, limit - newCount),
      resetTime: Date.now() + (windowSeconds * 1000)
    };
  }

  async resetRateLimit(identifier: string, action: string): Promise<void> {
    const key = this.getRateLimitKey(identifier, action);
    await this.cache.del(key);
  }
}

// Create rate limiter instance
export const rateLimiter = new RateLimiter(cache);

// Error handling
redis.on('error', (error) => {
  console.error('Redis connection error:', error);
});

redis.on('connect', () => {
  console.log('Connected to Redis');
});

redis.on('ready', () => {
  console.log('Redis is ready');
});

redis.on('close', () => {
  console.log('Redis connection closed');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Closing Redis connection...');
  await redis.quit();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Closing Redis connection...');
  await redis.quit();
  process.exit(0);
});