import Redis from 'ioredis';
import { createCache } from 'cache-manager';
import { redisStore } from 'cache-manager-redis-yet';

// Redis client configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  keepAlive: 30000,
  connectTimeout: 10000,
  commandTimeout: 5000,
};

// Create Redis client instance
export const redis = new Redis(redisConfig);

// Redis connection event handlers
redis.on('connect', () => {
  console.log('✅ Redis connected successfully');
});

redis.on('error', (error) => {
  console.error('❌ Redis connection error:', error);
});

redis.on('close', () => {
  console.log('🔌 Redis connection closed');
});

redis.on('reconnecting', () => {
  console.log('🔄 Redis reconnecting...');
});

// Cache manager with Redis store
let cacheManager: any;

// Initialize cache manager with fallback to memory cache
export async function initializeCacheManager(): Promise<any> {
  if (!cacheManager) {
    try {
      // Try Redis first
      const store = await redisStore({
        socket: {
          host: redisConfig.host,
          port: redisConfig.port,
        },
        password: redisConfig.password,
        database: redisConfig.db,
      });
      
      cacheManager = createCache({
        stores: [store as any],
        ttl: 600, // 10 minutes default TTL
      });
      
      // Test Redis connection
      await redis.ping();
      console.log('Redis cache manager initialized successfully');
    } catch (error) {
      console.warn('Redis connection failed, falling back to memory cache:', error);
      // Fallback to memory-only cache
      cacheManager = createCache({
        stores: [],
        ttl: 600,
      });
      console.log('Memory cache fallback initialized');
    }
  }
  return cacheManager;
}

export { cacheManager };

// Cache utility functions
export class RedisCache {
  // Get cached data with fallback
  static async get<T>(key: string): Promise<T | null> {
    try {
      const cache = await initializeCacheManager();
      const result = await cache.get(key);
      return result || null;
    } catch (error) {
      console.warn(`Cache get error for key ${key}, returning null:`, error);
      return null;
    }
  }

  // Set cached data with fallback
  static async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const cache = await initializeCacheManager();
      await cache.set(key, value, ttl);
    } catch (error) {
      console.warn(`Cache set error for key ${key}, operation skipped:`, error);
      // Gracefully fail - don't throw error
    }
  }

  // Delete cached data
  static async del(key: string): Promise<void> {
    try {
      const cache = await initializeCacheManager();
      await cache.del(key);
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
    }
  }

  // Clear all cache
  static async clear(): Promise<void> {
    try {
      const cache = await initializeCacheManager();
      await cache.reset();
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  // Get multiple keys
  static async mget<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      const cache = await initializeCacheManager();
      const results = await Promise.all(
        keys.map(key => cache.get(key))
      );
      return results.map(result => result || null);
    } catch (error) {
      console.error('Cache mget error:', error);
      return keys.map(() => null);
    }
  }

  // Set multiple keys
  static async mset<T>(keyValuePairs: Array<{key: string, value: T, ttl?: number}>): Promise<void> {
    try {
      const cache = await initializeCacheManager();
      await Promise.all(
        keyValuePairs.map(({key, value, ttl}) => 
          cache.set(key, value, ttl)
        )
      );
    } catch (error) {
      console.error('Cache mset error:', error);
    }
  }

  // Check if key exists
  static async exists(key: string): Promise<boolean> {
    try {
      const cache = await initializeCacheManager();
      const value = await cache.get(key);
      return value !== undefined;
    } catch (error) {
      console.error(`Cache exists check error for key ${key}:`, error);
      return false;
    }
  }

  // Get keys by pattern
  static async keys(pattern: string): Promise<string[]> {
    try {
      return await redis.keys(pattern);
    } catch (error) {
      console.error(`Cache keys error for pattern ${pattern}:`, error);
      return [];
    }
  }

  // Increment counter
  static async incr(key: string, ttl?: number): Promise<number> {
    try {
      const result = await redis.incr(key);
      if (ttl && result === 1) {
        await redis.expire(key, ttl);
      }
      return result;
    } catch (error) {
      console.error(`Cache incr error for key ${key}:`, error);
      return 0;
    }
  }

  // Decrement counter
  static async decr(key: string): Promise<number> {
    try {
      return await redis.decr(key);
    } catch (error) {
      console.error(`Cache decr error for key ${key}:`, error);
      return 0;
    }
  }
}

// Session management with Redis
export class RedisSession {
  private static readonly SESSION_PREFIX = 'session:';
  private static readonly SESSION_TTL = 86400; // 24 hours

  static async set(sessionId: string, data: any): Promise<void> {
    const key = `${this.SESSION_PREFIX}${sessionId}`;
    await RedisCache.set(key, data, this.SESSION_TTL);
  }

  static async get<T>(sessionId: string): Promise<T | null> {
    const key = `${this.SESSION_PREFIX}${sessionId}`;
    return await RedisCache.get(key);
  }

  static async delete(sessionId: string): Promise<void> {
    const key = `${this.SESSION_PREFIX}${sessionId}`;
    await RedisCache.del(key);
  }

  static async refresh(sessionId: string): Promise<void> {
    const key = `${this.SESSION_PREFIX}${sessionId}`;
    await redis.expire(key, this.SESSION_TTL);
  }
}

// Rate limiting with Redis
export class RedisRateLimit {
  static async checkLimit(key: string, maxRequests: number, windowSeconds: number): Promise<boolean> {
    try {
      const cache = await initializeCacheManager();
      const windowMs = windowSeconds * 1000;
      const now = Date.now();
      const windowStart = now - windowMs;
      
      // Get current count
      const currentCount = await cache.get(key) || 0;
      
      if (currentCount >= maxRequests) {
        return false; // Rate limit exceeded
      }
      
      // Increment counter
      await cache.set(key, currentCount + 1, windowSeconds);
      
      return true; // Request allowed
    } catch (error) {
      console.error(`Rate limit check error for key ${key}:`, error);
      return false; // Fail closed - deny request on error
    }
  }

  // Get remaining requests for a key
  static async getRemaining(key: string, maxRequests: number, windowSeconds: number): Promise<number> {
    try {
      const cache = await initializeCacheManager();
      const currentCount = await cache.get(key) || 0;
      return Math.max(0, maxRequests - currentCount);
    } catch (error) {
      console.error(`Get remaining error for key ${key}:`, error);
      return 0;
    }
  }

  // Reset rate limit for a key
  static async reset(key: string): Promise<void> {
    try {
      const cache = await initializeCacheManager();
      await cache.del(key);
    } catch (error) {
      console.error(`Rate limit reset error for key ${key}:`, error);
    }
  }
}

// Health check function
export async function checkRedisHealth(): Promise<boolean> {
  try {
    await redis.ping();
    return true;
  } catch (error) {
    console.error('Redis health check failed:', error);
    return false;
  }
}

// Graceful shutdown
export async function closeRedisConnection(): Promise<void> {
  try {
    await redis.quit();
    console.log('Redis connection closed gracefully');
  } catch (error) {
    console.error('Error closing Redis connection:', error);
  }
}