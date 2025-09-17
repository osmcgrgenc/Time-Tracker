import { NextRequest } from 'next/server';
import { createErrorResponse, HTTP_STATUS } from '@/lib/api-helpers';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

class RateLimiter {
  private requests = new Map<string, number[]>();

  constructor(private config: RateLimitConfig) {}

  private getKey(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
    return ip;
  }

  private cleanupOldRequests(timestamps: number[], now: number): number[] {
    return timestamps.filter(timestamp => now - timestamp < this.config.windowMs);
  }

  check(request: NextRequest) {
    const key = this.getKey(request);
    const now = Date.now();
    
    let timestamps = this.requests.get(key) || [];
    timestamps = this.cleanupOldRequests(timestamps, now);
    
    if (timestamps.length >= this.config.maxRequests) {
      return createErrorResponse(
        'Too many requests. Please try again later.',
        HTTP_STATUS.TOO_MANY_REQUESTS
      );
    }
    
    timestamps.push(now);
    this.requests.set(key, timestamps);
    
    return null;
  }
}

// Different rate limits for different endpoints
export const authRateLimit = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5 // 5 attempts per 15 minutes
});

export const apiRateLimit = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100 // 100 requests per minute
});

export const createRateLimit = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 20 // 20 creates per minute
});