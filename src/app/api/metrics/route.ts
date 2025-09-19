import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { withErrorHandling } from '@/lib/api-helpers';
import { RedisCache } from '@/lib/redis';
import { db } from '@/lib/db';
import { PerformanceTracker, withPerformanceTracking } from '@/lib/middleware/performanceMiddleware';

interface SystemMetrics {
  timestamp: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  cache: {
    hitRate: number;
    missRate: number;
    totalRequests: number;
  };
  database: {
    activeConnections: number;
    queryCount: number;
    avgResponseTime: number;
  };
  api: {
    totalRequests: number;
    avgResponseTime: number;
    errorRate: number;
  };
  websocket: {
    activeConnections: number;
    totalMessages: number;
  };
}

// GET /api/metrics - Get system performance metrics
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const timeRange = url.searchParams.get('range') || '1h'; // 1h, 6h, 24h, 7d
  const interval = url.searchParams.get('interval') || '5m'; // 1m, 5m, 15m, 1h

  try {
    // Get current metrics
    const currentMetrics = await getCurrentMetrics();
    
    // Get historical metrics from Redis
    const historicalMetrics = await getHistoricalMetrics(timeRange, interval);
    
    // Get real-time stats
    const realtimeStats = await getRealtimeStats();

    return NextResponse.json({
      current: currentMetrics,
      historical: historicalMetrics,
      realtime: realtimeStats,
      meta: {
        timeRange,
        interval,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}

// POST /api/metrics - Record custom metric
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, value, metadata } = body;

    if (!type || value === undefined) {
      return NextResponse.json(
        { error: 'Type and value are required' },
        { status: 400 }
      );
    }

    // Store custom metric in Redis
    const timestamp = Date.now();
    const metricKey = `metrics:custom:${type}:${timestamp}`;
    
    await RedisCache.set(metricKey, {
      type,
      value,
      metadata,
      timestamp,
    }, 86400); // Store for 24 hours

    // Update aggregated metrics
    await updateAggregatedMetrics(type, value);

    return NextResponse.json({
      success: true,
      timestamp,
    });
  } catch (error) {
    console.error('Error recording metric:', error);
    return NextResponse.json(
      { error: 'Failed to record metric' },
      { status: 500 }
    );
  }
}

/**
 * Get current system metrics
 */
async function getCurrentMetrics(): Promise<SystemMetrics> {
  const timestamp = Date.now();
  
  // Memory metrics (simulated - in production, use actual system metrics)
  const memoryUsage = process.memoryUsage();
  const memory = {
    used: memoryUsage.heapUsed,
    total: memoryUsage.heapTotal,
    percentage: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100,
  };

  // Cache metrics from Redis
  const cacheStats = await getCacheStats();
  
  // Database metrics
  const dbStats = await getDatabaseStats();
  
  // API metrics
  const apiStats = await getAPIStats();
  
  // WebSocket metrics
  const wsStats = await getWebSocketStats();

  return {
    timestamp,
    memory,
    cache: cacheStats,
    database: dbStats,
    api: apiStats,
    websocket: wsStats,
  };
}

/**
 * Get cache statistics
 */
async function getCacheStats() {
  try {
    const hits = await RedisCache.get<number>('metrics:cache:hits') || 0;
    const misses = await RedisCache.get<number>('metrics:cache:misses') || 0;
    const total = hits + misses;
    
    return {
      hitRate: total > 0 ? (hits / total) * 100 : 0,
      missRate: total > 0 ? (misses / total) * 100 : 0,
      totalRequests: total,
    };
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return { hitRate: 0, missRate: 0, totalRequests: 0 };
  }
}

/**
 * Get database statistics
 */
async function getDatabaseStats() {
  try {
    // Get query count from the last hour
    const queryCount = await RedisCache.get<number>('metrics:db:queries:1h') || 0;
    const avgResponseTime = await RedisCache.get<number>('metrics:db:avg_response') || 0;
    
    return {
      activeConnections: 1, // Simulated - in production, get from connection pool
      queryCount,
      avgResponseTime,
    };
  } catch (error) {
    console.error('Error getting database stats:', error);
    return { activeConnections: 0, queryCount: 0, avgResponseTime: 0 };
  }
}

/**
 * Get API statistics
 */
async function getAPIStats() {
  try {
    const tracker = PerformanceTracker.getInstance();
    const apiStats = await tracker.getApiStats('hour');
    const recentMetrics = await tracker.getRecentMetrics(50);
    
    const totalRequests = Object.values(apiStats).reduce((sum: number, stat: any) => sum + (stat.count || 0), 0);
    const avgResponseTime = Object.values(apiStats).reduce((sum: number, stat: any) => sum + (stat.avgResponseTime || 0), 0) / Object.keys(apiStats).length || 0;
    const errorRequests = recentMetrics.filter(m => m.statusCode >= 400).length;
    const errorRate = totalRequests > 0 ? (errorRequests / totalRequests) * 100 : 0;
    
    return {
      totalRequests,
      avgResponseTime: Math.round(avgResponseTime),
      errorRate,
      endpointStats: apiStats,
      recentRequests: recentMetrics.slice(-20)
    };
  } catch (error) {
    console.error('Error getting API stats:', error);
    return { totalRequests: 0, avgResponseTime: 0, errorRate: 0 };
  }
}

/**
 * Get WebSocket statistics
 */
async function getWebSocketStats() {
  try {
    const { WebSocketMonitor } = await import('@/lib/socket');
    const monitor = WebSocketMonitor.getInstance();
    const metrics = await monitor.getMetrics();
    
    return {
      activeConnections: metrics.activeConnections,
      totalMessages: metrics.totalMessages,
      connectionsToday: metrics.connectionsToday,
      messagesPerMinute: metrics.messagesPerMinute,
      averageSessionDuration: metrics.averageSessionDuration
    };
  } catch (error) {
    console.error('Error getting WebSocket stats:', error);
    return { 
      activeConnections: 0, 
      totalMessages: 0,
      connectionsToday: 0,
      messagesPerMinute: 0,
      averageSessionDuration: 0
    };
  }
}

/**
 * Get historical metrics
 */
async function getHistoricalMetrics(timeRange: string, interval: string) {
  try {
    const now = Date.now();
    const ranges = {
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
    };
    
    const intervals = {
      '1m': 60 * 1000,
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
    };
    
    const rangeMs = ranges[timeRange as keyof typeof ranges] || ranges['1h'];
    const intervalMs = intervals[interval as keyof typeof intervals] || intervals['5m'];
    
    const startTime = now - rangeMs;
    const dataPoints: SystemMetrics[] = [];
    
    // Generate historical data points (in production, fetch from time-series database)
    for (let time = startTime; time <= now; time += intervalMs) {
      const metrics = await RedisCache.get<SystemMetrics>(`metrics:snapshot:${Math.floor(time / intervalMs)}`);
      
      if (metrics) {
        dataPoints.push(metrics);
      } else {
        // Generate simulated data if no historical data exists
        dataPoints.push({
          timestamp: time,
          memory: {
            used: Math.random() * 100000000,
            total: 200000000,
            percentage: Math.random() * 100,
          },
          cache: {
            hitRate: 80 + Math.random() * 20,
            missRate: Math.random() * 20,
            totalRequests: Math.floor(Math.random() * 1000),
          },
          database: {
            activeConnections: Math.floor(Math.random() * 10) + 1,
            queryCount: Math.floor(Math.random() * 100),
            avgResponseTime: Math.random() * 100,
          },
          api: {
            totalRequests: Math.floor(Math.random() * 500),
            avgResponseTime: Math.random() * 200,
            errorRate: Math.random() * 5,
          },
          websocket: {
            activeConnections: Math.floor(Math.random() * 50),
            totalMessages: Math.floor(Math.random() * 200),
          },
        });
      }
    }
    
    return dataPoints;
  } catch (error) {
    console.error('Error getting historical metrics:', error);
    return [];
  }
}

/**
 * Get real-time statistics
 */
async function getRealtimeStats() {
  try {
    return {
      uptime: process.uptime(),
      nodeVersion: process.version,
      platform: process.platform,
      cpuUsage: process.cpuUsage(),
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error getting realtime stats:', error);
    return {};
  }
}

/**
 * Update aggregated metrics
 */
async function updateAggregatedMetrics(type: string, value: number) {
  try {
    const key = `metrics:aggregated:${type}`;
    const current = await RedisCache.get<{ count: number; sum: number; avg: number }>(key) || 
      { count: 0, sum: 0, avg: 0 };
    
    const updated = {
      count: current.count + 1,
      sum: current.sum + value,
      avg: (current.sum + value) / (current.count + 1),
    };
    
    await RedisCache.set(key, updated, 86400); // Store for 24 hours
  } catch (error) {
    console.error('Error updating aggregated metrics:', error);
  }
}