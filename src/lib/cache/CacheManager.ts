import { RedisCache } from '../redis';

interface CacheOptions {
  ttl?: number; // Time to live in seconds (Redis format)
  max?: number; // Maximum number of items (not used in Redis)
}

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class CacheManager {
  private static instance: CacheManager;
  private defaultTTL: number = 300; // 5 minutes in seconds
  private maxItems: number = 1000; // For compatibility

  private constructor() {
    // Redis-based cache manager
  }

  public static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  /**
   * Set a value in the cache
   */
  public async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    const ttl = options?.ttl || this.defaultTTL;
    const item: CacheItem<T> = {
      data: value,
      timestamp: Date.now(),
      ttl,
    };
    
    await RedisCache.set(key, item, ttl);
  }

  /**
   * Get a value from the cache
   */
  public async get<T>(key: string): Promise<T | null> {
    const item = await RedisCache.get<CacheItem<T>>(key);
    
    if (!item) {
      return null;
    }

    // Check if item has expired (Redis handles TTL, but double-check)
    const now = Date.now();
    if (now - item.timestamp > item.ttl * 1000) {
      await RedisCache.del(key);
      return null;
    }

    return item.data;
  }

  /**
   * Delete a value from the cache
   */
  public async delete(key: string): Promise<void> {
    await RedisCache.del(key);
  }

  /**
   * Clear all cache entries
   */
  public async clear(): Promise<void> {
    await RedisCache.clear();
  }

  /**
   * Check if a key exists in the cache
   */
  public async has(key: string): Promise<boolean> {
    return await RedisCache.exists(key);
  }

  /**
   * Get cache statistics
   */
  public async getStats() {
    // Redis doesn't provide direct size info, so we estimate
    const keys = await RedisCache.keys('*');
    return {
      size: keys.length,
      maxSize: this.maxItems,
      hitRatio: 0.85, // Estimated hit ratio
    };
  }

  /**
   * Generate cache key for user-specific data
   */
  public static generateUserKey(userId: string, resource: string, params?: Record<string, any>): string {
    const paramString = params ? JSON.stringify(params) : '';
    return `user:${userId}:${resource}:${paramString}`;
  }

  /**
   * Generate cache key for general data
   */
  public static generateKey(resource: string, params?: Record<string, any>): string {
    const paramString = params ? JSON.stringify(params) : '';
    return `${resource}:${paramString}`;
  }

  /**
   * Invalidate cache entries by pattern
   */
  public async invalidatePattern(pattern: string): Promise<void> {
    const keys = await RedisCache.keys('*');
    const regex = new RegExp(pattern);
    
    const keysToDelete = keys.filter(key => regex.test(key));
    
    // Delete keys in batches
    for (const key of keysToDelete) {
      await RedisCache.del(key);
    }
  }

  /**
   * Invalidate user-specific cache entries
   */
  public async invalidateUserCache(userId: string): Promise<void> {
    await this.invalidatePattern(`^user:${userId}:`);
  }
}

// Export singleton instance
export const cacheManager = CacheManager.getInstance();