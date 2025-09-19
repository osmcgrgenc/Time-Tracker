import { NextRequest, NextResponse } from 'next/server';
import { MemoryCache } from '@/lib/cache/MemoryCache';

interface PerformanceMetric {
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  timestamp: number;
  userAgent?: string;
  ip?: string;
}

interface DatabaseMetric {
  query: string;
  duration: number;
  timestamp: number;
  success: boolean;
  error?: string;
}

class PerformanceTracker {
  private static instance: PerformanceTracker;
  private cache: MemoryCache;
  private metricsBuffer: PerformanceMetric[] = [];
  private dbMetricsBuffer: DatabaseMetric[] = [];
  private flushInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.cache = MemoryCache.getInstance();
    this.startFlushInterval();
  }

  static getInstance(): PerformanceTracker {
    if (!PerformanceTracker.instance) {
      PerformanceTracker.instance = new PerformanceTracker();
    }
    return PerformanceTracker.instance;
  }

  private startFlushInterval() {
    // Flush metrics every 30 seconds
    this.flushInterval = setInterval(() => {
      this.flushMetrics();
    }, 30000);
  }

  private async flushMetrics() {
    if (this.metricsBuffer.length === 0 && this.dbMetricsBuffer.length === 0) {
      return;
    }

    try {
      // Flush API metrics
      if (this.metricsBuffer.length > 0) {
        const metrics = [...this.metricsBuffer];
        this.metricsBuffer = [];
        
        this.cache.set(
          `metrics:api:${Date.now()}`,
          JSON.stringify(metrics),
          3600 // 1 hour TTL
        );

        // Update aggregated stats
        await this.updateAggregatedStats(metrics);
      }

      // Flush DB metrics
      if (this.dbMetricsBuffer.length > 0) {
        const dbMetrics = [...this.dbMetricsBuffer];
        this.dbMetricsBuffer = [];
        
        this.cache.set(
          `metrics:db:${Date.now()}`,
          JSON.stringify(dbMetrics),
          3600 // 1 hour TTL
        );
      }
    } catch (error) {
      console.error('Failed to flush metrics:', error);
      // Re-add metrics to buffer on failure
      // this.metricsBuffer.unshift(...metrics);
    }
  }

  private async updateAggregatedStats(metrics: PerformanceMetric[]) {
    const now = Date.now();
    const hourKey = `stats:hour:${Math.floor(now / 3600000)}`;
    const dayKey = `stats:day:${Math.floor(now / 86400000)}`;

    for (const metric of metrics) {
      const endpointKey = `${metric.method}:${metric.endpoint}`;
      
      // Update hourly stats
      this.incrementStat(hourKey, `${endpointKey}:count`, 1);
      this.incrementStat(hourKey, `${endpointKey}:total_time`, metric.responseTime);
      this.incrementStat(hourKey, `${endpointKey}:status_${metric.statusCode}`, 1);
      
      // Update daily stats
      this.incrementStat(dayKey, `${endpointKey}:count`, 1);
      this.incrementStat(dayKey, `${endpointKey}:total_time`, metric.responseTime);
      this.incrementStat(dayKey, `${endpointKey}:status_${metric.statusCode}`, 1);
    }

    // Set TTL for stats
    this.cache.expire(hourKey, 86400); // 24 hours
    this.cache.expire(dayKey, 604800); // 7 days
  }

  private incrementStat(hashKey: string, field: string, increment: number) {
    const key = `${hashKey}:${field}`;
    const current = parseInt(this.cache.get(key) || '0');
    this.cache.set(key, (current + increment).toString());
  }

  trackApiCall(metric: PerformanceMetric) {
    this.metricsBuffer.push(metric);
    
    // Flush immediately if buffer is getting large
    if (this.metricsBuffer.length >= 100) {
      this.flushMetrics();
    }
  }

  trackDatabaseQuery(metric: DatabaseMetric) {
    this.dbMetricsBuffer.push(metric);
    
    // Flush immediately if buffer is getting large
    if (this.dbMetricsBuffer.length >= 50) {
      this.flushMetrics();
    }
  }

  async getApiStats(timeframe: 'hour' | 'day' = 'hour') {
    const now = Date.now();
    const keyPrefix = timeframe === 'hour' 
      ? `stats:hour:${Math.floor(now / 3600000)}`
      : `stats:day:${Math.floor(now / 86400000)}`;
    
    const stats = this.getHashStats(keyPrefix);
    return this.parseStats(stats);
  }

  private getHashStats(keyPrefix: string): Record<string, string> {
    const stats: Record<string, string> = {};
    const keys = this.cache.keys().filter(key => key.startsWith(keyPrefix + ':'));
    
    for (const key of keys) {
      const field = key.substring(keyPrefix.length + 1);
      const value = this.cache.get(key);
      if (value) {
        stats[field] = value;
      }
    }
    
    return stats;
  }

  private parseStats(rawStats: Record<string, string>) {
    const endpoints: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(rawStats)) {
      const [endpoint, metric] = key.split(':').slice(0, -1).join(':').split(':');
      const metricType = key.split(':').pop();
      
      if (!endpoints[endpoint]) {
        endpoints[endpoint] = {
          count: 0,
          totalTime: 0,
          avgResponseTime: 0,
          statusCodes: {}
        };
      }
      
      if (metricType === 'count') {
        endpoints[endpoint].count = parseInt(value);
      } else if (metricType === 'total_time') {
        endpoints[endpoint].totalTime = parseInt(value);
        endpoints[endpoint].avgResponseTime = endpoints[endpoint].totalTime / (endpoints[endpoint].count || 1);
      } else if (metricType?.startsWith('status_')) {
        const statusCode = metricType.replace('status_', '');
        endpoints[endpoint].statusCodes[statusCode] = parseInt(value);
      }
    }
    
    return endpoints;
  }

  async getRecentMetrics(limit: number = 100) {
    const keys = this.cache.keys().filter(key => key.startsWith('metrics:api:'));
    const recentKeys = keys.sort().slice(-10); // Get last 10 batches
    
    const allMetrics: PerformanceMetric[] = [];
    
    for (const key of recentKeys) {
      const data = this.cache.get(key);
      if (data) {
        const metrics = JSON.parse(data) as PerformanceMetric[];
        allMetrics.push(...metrics);
      }
    }
    
    return allMetrics.slice(-limit);
  }

  destroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flushMetrics(); // Final flush
  }
}

// Middleware function
export function withPerformanceTracking(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now();
    const tracker = PerformanceTracker.getInstance();
    
    try {
      const response = await handler(req);
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // Track the API call
      tracker.trackApiCall({
        endpoint: req.nextUrl.pathname,
        method: req.method,
        responseTime,
        statusCode: response.status,
        timestamp: startTime,
        userAgent: req.headers.get('user-agent') || undefined,
        ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined
      });
      
      // Add performance headers
      response.headers.set('X-Response-Time', `${responseTime}ms`);
      response.headers.set('X-Timestamp', startTime.toString());
      
      return response;
    } catch (error) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // Track failed API call
      tracker.trackApiCall({
        endpoint: req.nextUrl.pathname,
        method: req.method,
        responseTime,
        statusCode: 500,
        timestamp: startTime,
        userAgent: req.headers.get('user-agent') || undefined,
        ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined
      });
      
      throw error;
    }
  };
}

// Database query tracker
export function trackDatabaseQuery<T>(
  queryFn: () => Promise<T>,
  queryDescription: string
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    const startTime = Date.now();
    const tracker = PerformanceTracker.getInstance();
    
    try {
      const result = await queryFn();
      const duration = Date.now() - startTime;
      
      tracker.trackDatabaseQuery({
        query: queryDescription,
        duration,
        timestamp: startTime,
        success: true
      });
      
      resolve(result);
    } catch (error) {
      const duration = Date.now() - startTime;
      
      tracker.trackDatabaseQuery({
        query: queryDescription,
        duration,
        timestamp: startTime,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      reject(error);
    }
  });
}

export { PerformanceTracker };
export type { PerformanceMetric, DatabaseMetric };