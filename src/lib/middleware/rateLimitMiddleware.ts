import { NextRequest, NextResponse } from 'next/server';
import { RedisRateLimit } from '@/lib/redis';

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (req: NextRequest) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  onLimitReached?: (req: NextRequest) => NextResponse;
}

/**
 * Redis-based rate limiting middleware
 */
export function withRateLimit(config: RateLimitConfig) {
  return function (handler: (req: NextRequest) => Promise<NextResponse>) {
    return async function (req: NextRequest): Promise<NextResponse> {
      try {
        // Generate rate limit key
        const key = config.keyGenerator 
          ? config.keyGenerator(req)
          : generateDefaultKey(req);

        // Check rate limit
        const isAllowed = await RedisRateLimit.checkLimit(
          key,
          config.maxRequests,
          Math.ceil(config.windowMs / 1000) // Convert to seconds
        );

        if (!isAllowed) {
          // Rate limit exceeded
          if (config.onLimitReached) {
            return config.onLimitReached(req);
          }

          return NextResponse.json(
            {
              error: 'Rate limit exceeded',
              message: `Too many requests. Maximum ${config.maxRequests} requests per ${config.windowMs / 1000} seconds.`,
            },
            { 
              status: 429,
              headers: {
                'X-RateLimit-Limit': config.maxRequests.toString(),
                'X-RateLimit-Window': config.windowMs.toString(),
                'Retry-After': Math.ceil(config.windowMs / 1000).toString(),
              }
            }
          );
        }

        // Execute handler
        const response = await handler(req);

        // Add rate limit headers
        const remaining = await RedisRateLimit.getRemaining(
          key,
          config.maxRequests,
          Math.ceil(config.windowMs / 1000)
        );

        response.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
        response.headers.set('X-RateLimit-Remaining', remaining.toString());
        response.headers.set('X-RateLimit-Window', config.windowMs.toString());

        return response;
      } catch (error) {
        console.error('Rate limit middleware error:', error);
        // On error, allow the request to proceed
        return handler(req);
      }
    };
  };
}

/**
 * Generate default rate limit key from request
 */
function generateDefaultKey(req: NextRequest): string {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 
    req.headers.get('x-real-ip') || 
    req.headers.get('cf-connecting-ip') ||
    'unknown';
  
  const url = new URL(req.url);
  return `ratelimit:${ip}:${url.pathname}`;
}

/**
 * Predefined rate limit configurations
 */
export const RateLimitConfigs = {
  // Strict rate limit for authentication endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes
    keyGenerator: (req: NextRequest) => {
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || 'unknown';
      return `auth:${ip}`;
    },
  },

  // API rate limit
  api: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
  },

  // User-specific rate limit
  userSpecific: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute per user
    keyGenerator: (req: NextRequest) => {
      const userId = req.headers.get('x-user-id') || 'anonymous';
      const url = new URL(req.url);
      return `user:${userId}:${url.pathname}`;
    },
  },

  // File upload rate limit
  upload: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 uploads per minute
  },

  // WebSocket connection rate limit
  websocket: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 connections per minute
  },
};

/**
 * Rate limit helper functions
 */
export class RateLimitHelper {
  /**
   * Check if IP is rate limited
   */
  static async isIPRateLimited(ip: string, config: RateLimitConfig): Promise<boolean> {
    const key = `ratelimit:${ip}`;
    return !(await RedisRateLimit.checkLimit(
      key,
      config.maxRequests,
      Math.ceil(config.windowMs / 1000)
    ));
  }

  /**
   * Check if user is rate limited
   */
  static async isUserRateLimited(userId: string, endpoint: string, config: RateLimitConfig): Promise<boolean> {
    const key = `ratelimit:user:${userId}:${endpoint}`;
    return !(await RedisRateLimit.checkLimit(
      key,
      config.maxRequests,
      Math.ceil(config.windowMs / 1000)
    ));
  }

  /**
   * Reset rate limit for specific key
   */
  static async resetRateLimit(key: string): Promise<void> {
    await RedisRateLimit.reset(key);
  }

  /**
   * Get rate limit status
   */
  static async getRateLimitStatus(key: string, config: RateLimitConfig): Promise<{
    limit: number;
    remaining: number;
    resetTime: number;
  }> {
    const remaining = await RedisRateLimit.getRemaining(
      key,
      config.maxRequests,
      Math.ceil(config.windowMs / 1000)
    );

    return {
      limit: config.maxRequests,
      remaining,
      resetTime: Date.now() + config.windowMs,
    };
  }
}