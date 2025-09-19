import { NextRequest, NextResponse } from 'next/server';
import { cacheManager } from '../cache/CacheManager';

interface CacheConfig {
  ttl?: number;
  keyGenerator?: (req: NextRequest) => string;
  shouldCache?: (req: NextRequest, res: NextResponse) => boolean;
  varyBy?: string[]; // Headers to vary cache by
}

/**
 * Cache middleware for API routes
 */
export function withCache(config: CacheConfig = {}) {
  return function cacheMiddleware(
    handler: (req: NextRequest) => Promise<NextResponse>
  ) {
    return async function cachedHandler(req: NextRequest): Promise<NextResponse> {
      // Only cache GET requests by default
      if (req.method !== 'GET') {
        return handler(req);
      }

      // Generate cache key
      const cacheKey = config.keyGenerator 
        ? config.keyGenerator(req)
        : generateDefaultCacheKey(req, config.varyBy);

      // Try to get from cache
      const cachedResponse = await cacheManager.get<{
        status: number;
        headers: Record<string, string>;
        body: any;
      }>(cacheKey);

      if (cachedResponse) {
        // Return cached response
        const response = NextResponse.json(cachedResponse.body, {
          status: cachedResponse.status,
        });
        
        // Set cached headers
        Object.entries(cachedResponse.headers).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
        
        // Add cache hit header
        response.headers.set('X-Cache', 'HIT');
        response.headers.set('X-Cache-Key', cacheKey);
        
        return response;
      }

      // Execute handler
      const response = await handler(req);
      
      // Check if response should be cached
      const shouldCache = config.shouldCache 
        ? config.shouldCache(req, response)
        : response.status === 200;

      if (shouldCache) {
        try {
          // Clone response to read body
          const responseClone = response.clone();
          const body = await responseClone.json();
          
          // Prepare cache data
          const cacheData = {
            status: response.status,
            headers: Object.fromEntries(response.headers.entries()),
            body,
          };
          
          // Cache the response (convert TTL from ms to seconds for Redis)
          const ttlInSeconds = config.ttl ? Math.ceil(config.ttl / 1000) : undefined;
          await cacheManager.set(cacheKey, cacheData, { ttl: ttlInSeconds });
          
          // Add cache miss header
          response.headers.set('X-Cache', 'MISS');
          response.headers.set('X-Cache-Key', cacheKey);
        } catch (error) {
          console.warn('Failed to cache response:', error);
        }
      }

      return response;
    };
  };
}

/**
 * Generate default cache key from request
 */
function generateDefaultCacheKey(req: NextRequest, varyBy?: string[]): string {
  const url = new URL(req.url);
  const pathname = url.pathname;
  const searchParams = url.searchParams.toString();
  
  let key = `api:${pathname}`;
  
  if (searchParams) {
    key += `:${searchParams}`;
  }
  
  // Add vary headers to key
  if (varyBy) {
    const varyValues = varyBy.map(header => {
      const value = req.headers.get(header);
      return `${header}:${value || 'null'}`;
    }).join('|');
    
    if (varyValues) {
      key += `:vary:${varyValues}`;
    }
  }
  
  return key;
}

/**
 * Cache invalidation helper
 */
export class CacheInvalidator {
  /**
   * Invalidate cache for specific user
   */
  static async invalidateUser(userId: string): Promise<void> {
    await cacheManager.invalidateUserCache(userId);
  }

  /**
   * Invalidate cache for specific resource
   */
  static async invalidateResource(resource: string): Promise<void> {
    await cacheManager.invalidatePattern(`api:.*${resource}.*`);
  }

  /**
   * Invalidate cache for timers
   */
  static async invalidateTimers(userId?: string): Promise<void> {
    if (userId) {
      await cacheManager.invalidatePattern(`api:.*timers.*user.*${userId}`);
    } else {
      await cacheManager.invalidatePattern(`api:.*timers.*`);
    }
  }

  /**
   * Invalidate cache for projects
   */
  static async invalidateProjects(userId?: string): Promise<void> {
    if (userId) {
      await cacheManager.invalidatePattern(`api:.*projects.*user.*${userId}`);
    } else {
      await cacheManager.invalidatePattern(`api:.*projects.*`);
    }
  }

  /**
   * Invalidate cache for tasks
   */
  static async invalidateTasks(userId?: string, projectId?: string): Promise<void> {
    let pattern = 'api:.*tasks.*';
    
    if (userId) {
      pattern = `api:.*tasks.*user.*${userId}`;
    }
    
    if (projectId) {
      pattern += `.*project.*${projectId}`;
    }
    
    await cacheManager.invalidatePattern(pattern);
  }

  /**
   * Invalidate cache for time entries
   */
  static async invalidateTimeEntries(userId?: string): Promise<void> {
    if (userId) {
      await cacheManager.invalidatePattern(`api:.*time-entries.*user.*${userId}`);
    } else {
      await cacheManager.invalidatePattern(`api:.*time-entries.*`);
    }
  }
}

/**
 * Predefined cache configurations
 */
export const CacheConfigs = {
  // Short cache for frequently changing data
  short: {
    ttl: 60, // 1 minute (in seconds for Redis)
  },
  
  // Medium cache for moderately changing data
  medium: {
    ttl: 300, // 5 minutes (in seconds for Redis)
  },
  
  // Long cache for rarely changing data
  long: {
    ttl: 1800, // 30 minutes (in seconds for Redis)
  },
  
  // User-specific cache
  userSpecific: {
    ttl: 300, // 5 minutes (in seconds for Redis)
    varyBy: ['authorization'],
    keyGenerator: (req: NextRequest) => {
      const url = new URL(req.url);
      const userId = req.headers.get('x-user-id') || 'anonymous';
      return `user:${userId}:${url.pathname}:${url.searchParams.toString()}`;
    },
  },
};