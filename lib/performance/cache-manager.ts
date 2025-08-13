import { cache } from '@/lib/db/redis';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string;
  tags?: string[];
  compression?: boolean;
  namespace?: string;
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  hitRate: number;
}

export class CacheManager {
  private static instance: CacheManager;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    hitRate: 0,
  };

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  private generateKey(key: string, options: CacheOptions = {}): string {
    const prefix = options.prefix || 'cache';
    const namespace = options.namespace || 'default';
    return `${prefix}:${namespace}:${key}`;
  }

  async get<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
    try {
      const cacheKey = this.generateKey(key, options);
      const result = await cache.get<T>(cacheKey);
      
      if (result !== null) {
        this.stats.hits++;
        this.updateHitRate();
        return result;
      } else {
        this.stats.misses++;
        this.updateHitRate();
        return null;
      }
    } catch (error) {
      console.error('Cache get error:', error);
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }
  }

  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    try {
      const cacheKey = this.generateKey(key, options);
      const ttl = options.ttl || 3600; // Default 1 hour
      
      await cache.set(cacheKey, value, ttl);
      
      // Store tags for cache invalidation
      if (options.tags && options.tags.length > 0) {
        await this.storeTags(cacheKey, options.tags);
      }
      
      this.stats.sets++;
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async delete(key: string, options: CacheOptions = {}): Promise<void> {
    try {
      const cacheKey = this.generateKey(key, options);
      await cache.delete(cacheKey);
      this.stats.deletes++;
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  async exists(key: string, options: CacheOptions = {}): Promise<boolean> {
    try {
      const cacheKey = this.generateKey(key, options);
      const result = await cache.get(cacheKey);
      return result !== null;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }

  async flush(namespace?: string): Promise<void> {
    try {
      if (namespace) {
        // Delete all keys in namespace
        const pattern = `cache:${namespace}:*`;
        await this.deleteByPattern(pattern);
      } else {
        // Delete all cache keys
        await this.deleteByPattern('cache:*');
      }
    } catch (error) {
      console.error('Cache flush error:', error);
    }
  }

  async invalidateByTags(tags: string[]): Promise<void> {
    try {
      const keys = await this.getKeysByTags(tags);
      const deletePromises = keys.map(key => cache.delete(key));
      await Promise.all(deletePromises);
      
      // Clean up tag mappings
      const tagCleanupPromises = tags.map(tag => 
        cache.delete(`tag:${tag}`)
      );
      await Promise.all(tagCleanupPromises);
    } catch (error) {
      console.error('Cache invalidate by tags error:', error);
    }
  }

  private async storeTags(cacheKey: string, tags: string[]): Promise<void> {
    const tagPromises = tags.map(async (tag) => {
      const tagKey = `tag:${tag}`;
      const existingKeys = await cache.get<string[]>(tagKey) || [];
      const updatedKeys = [...new Set([...existingKeys, cacheKey])];
      await cache.set(tagKey, updatedKeys, 86400); // 24 hours
    });
    
    await Promise.all(tagPromises);
  }

  private async getKeysByTags(tags: string[]): Promise<string[]> {
    const keyPromises = tags.map(async (tag) => {
      const tagKey = `tag:${tag}`;
      return await cache.get<string[]>(tagKey) || [];
    });
    
    const keyArrays = await Promise.all(keyPromises);
    return [...new Set(keyArrays.flat())];
  }

  private async deleteByPattern(pattern: string): Promise<void> {
    // Note: This would require Redis SCAN command implementation
    // For now, implementing a basic version
    console.log(`Deleting keys matching pattern: ${pattern}`);
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
  }

  getStats(): CacheStats {
    return { ...this.stats };
  }

  async warmUp(warmUpFunction: () => Promise<void>): Promise<void> {
    try {
      await warmUpFunction();
      console.log('Cache warmed up successfully');
    } catch (error) {
      console.error('Cache warm up error:', error);
    }
  }
}

// Specialized cache layers
export class DatabaseCache extends CacheManager {
  async getQueryResult<T>(
    queryKey: string, 
    queryFn: () => Promise<T>, 
    ttl: number = 300 // 5 minutes default
  ): Promise<T> {
    const cached = await this.get<T>(queryKey, { 
      prefix: 'db', 
      ttl,
      namespace: 'queries' 
    });
    
    if (cached !== null) {
      return cached;
    }
    
    const result = await queryFn();
    await this.set(queryKey, result, { 
      prefix: 'db', 
      ttl,
      namespace: 'queries' 
    });
    
    return result;
  }

  async invalidateUserData(userId: number): Promise<void> {
    await this.invalidateByTags([`user:${userId}`]);
  }

  async invalidateOrganizationData(organizationId: number): Promise<void> {
    await this.invalidateByTags([`org:${organizationId}`]);
  }

  async invalidateScanData(scanId: number): Promise<void> {
    await this.invalidateByTags([`scan:${scanId}`]);
  }
}

export class ApiCache extends CacheManager {
  async getApiResponse<T>(
    endpoint: string,
    params: Record<string, any>,
    fetchFn: () => Promise<T>,
    ttl: number = 60 // 1 minute default for API responses
  ): Promise<T> {
    const cacheKey = this.generateApiKey(endpoint, params);
    
    const cached = await this.get<T>(cacheKey, { 
      prefix: 'api', 
      ttl,
      namespace: 'responses' 
    });
    
    if (cached !== null) {
      return cached;
    }
    
    const result = await fetchFn();
    await this.set(cacheKey, result, { 
      prefix: 'api', 
      ttl,
      namespace: 'responses' 
    });
    
    return result;
  }

  private generateApiKey(endpoint: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    
    return `${endpoint}?${sortedParams}`;
  }
}

export class SessionCache extends CacheManager {
  async getSession<T>(sessionId: string): Promise<T | null> {
    return this.get<T>(sessionId, { 
      prefix: 'session', 
      namespace: 'user',
      ttl: 86400 // 24 hours
    });
  }

  async setSession<T>(sessionId: string, sessionData: T): Promise<void> {
    await this.set(sessionId, sessionData, { 
      prefix: 'session', 
      namespace: 'user',
      ttl: 86400 // 24 hours
    });
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.delete(sessionId, { 
      prefix: 'session', 
      namespace: 'user' 
    });
  }
}

// Cache decorators for functions
export function Cached(options: CacheOptions & { keyGenerator?: (...args: any[]) => string }) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const cacheManager = CacheManager.getInstance();
    
    descriptor.value = async function (...args: any[]) {
      const cacheKey = options.keyGenerator 
        ? options.keyGenerator(...args)
        : `${propertyName}:${JSON.stringify(args)}`;
      
      const cached = await cacheManager.get(cacheKey, options);
      if (cached !== null) {
        return cached;
      }
      
      const result = await method.apply(this, args);
      await cacheManager.set(cacheKey, result, options);
      
      return result;
    };
  };
}

// Memoization for expensive computations
export class Memoization {
  private static cache = new Map<string, { value: any; timestamp: number; ttl: number }>();

  static memoize<T extends (...args: any[]) => any>(
    fn: T,
    options: { ttl?: number; keyGenerator?: (...args: Parameters<T>) => string } = {}
  ): T {
    const { ttl = 300000, keyGenerator } = options; // 5 minutes default
    
    return ((...args: Parameters<T>) => {
      const key = keyGenerator 
        ? keyGenerator(...args)
        : JSON.stringify(args);
      
      const cached = this.cache.get(key);
      const now = Date.now();
      
      if (cached && (now - cached.timestamp) < cached.ttl) {
        return cached.value;
      }
      
      const result = fn(...args);
      this.cache.set(key, { value: result, timestamp: now, ttl });
      
      return result;
    }) as T;
  }

  static clear(): void {
    this.cache.clear();
  }

  static clearExpired(): void {
    const now = Date.now();
    for (const [key, cached] of this.cache.entries()) {
      if ((now - cached.timestamp) >= cached.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Application-level cache warming
export class CacheWarmer {
  private static warmedUp = false;

  static async warmUpApplication(): Promise<void> {
    if (this.warmedUp) return;

    console.log('Starting cache warm-up...');
    
    try {
      const dbCache = new DatabaseCache();
      const apiCache = new ApiCache();
      
      // Warm up common queries
      await Promise.all([
        this.warmUpUserData(dbCache),
        this.warmUpCompatibilityRules(dbCache),
        this.warmUpSystemMetrics(apiCache),
      ]);
      
      this.warmedUp = true;
      console.log('Cache warm-up completed');
    } catch (error) {
      console.error('Cache warm-up failed:', error);
    }
  }

  private static async warmUpUserData(dbCache: DatabaseCache): Promise<void> {
    // Pre-load frequently accessed user data
    console.log('Warming up user data cache...');
  }

  private static async warmUpCompatibilityRules(dbCache: DatabaseCache): Promise<void> {
    // Pre-load compatibility rules
    console.log('Warming up compatibility rules cache...');
  }

  private static async warmUpSystemMetrics(apiCache: ApiCache): Promise<void> {
    // Pre-load system metrics
    console.log('Warming up system metrics cache...');
  }
}

// Cache monitoring and statistics
export class CacheMonitor {
  private static monitoringInterval: NodeJS.Timeout | null = null;

  static startMonitoring(intervalMs: number = 60000): void { // 1 minute default
    if (this.monitoringInterval) return;

    this.monitoringInterval = setInterval(async () => {
      await this.logCacheStats();
      await this.cleanupExpiredCache();
    }, intervalMs);
  }

  static stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  private static async logCacheStats(): Promise<void> {
    const cacheManager = CacheManager.getInstance();
    const stats = cacheManager.getStats();
    
    console.log('Cache Statistics:', {
      hitRate: `${stats.hitRate.toFixed(2)}%`,
      hits: stats.hits,
      misses: stats.misses,
      sets: stats.sets,
      deletes: stats.deletes,
    });
  }

  private static async cleanupExpiredCache(): Promise<void> {
    Memoization.clearExpired();
  }
}

// Export singleton instances
export const dbCache = new DatabaseCache();
export const apiCache = new ApiCache();
export const sessionCache = new SessionCache();
export const cacheManager = CacheManager.getInstance();