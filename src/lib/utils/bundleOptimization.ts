/**
 * Bundle optimization utilities and configurations
 */

/**
 * Dynamic import utilities for code splitting
 */
export class DynamicImports {
  /**
   * Lazy load React components
   */
  static lazyComponent<T extends React.ComponentType<any>>(
    importFn: () => Promise<{ default: T }>
  ): React.LazyExoticComponent<T> {
    return React.lazy(importFn);
  }

  /**
   * Lazy load utility functions
   */
  static async lazyUtility<T>(
    importFn: () => Promise<{ default: T }>
  ): Promise<T> {
    const utilityModule = await importFn();
    return utilityModule.default;
  }

  /**
   * Preload component for better UX
   */
  static preloadComponent(
    importFn: () => Promise<any>
  ): void {
    // Preload on idle or interaction
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        importFn();
      });
    } else {
      setTimeout(() => {
        importFn();
      }, 1);
    }
  }
}

/**
 * Tree shaking helpers
 */
export class TreeShaking {
  /**
   * Import only specific functions from lodash
   */
  static async importLodashFunction<T>(
    functionName: string
  ): Promise<T> {
    const componentModule = await import('lodash');
    return (componentModule as any)[functionName];
  }

  /**
   * Import specific date-fns functions
   */
  static async importDateFnsFunction<T>(
    functionName: string
  ): Promise<T> {
    const dateFnsModule = await import('date-fns');
    return (dateFnsModule as any)[functionName];
  }

  /**
   * Import specific chart.js components
   */
  static async importChartComponent<T>(
    componentName: string
  ): Promise<T> {
    // Chart.js components are available through recharts in this project
    const rechartsModule = await import('recharts');
    return (rechartsModule as any)[componentName];
  }
}

/**
 * Bundle analyzer utilities
 */
export class BundleAnalyzer {
  /**
   * Measure component render time
   */
  static measureRenderTime(
    componentName: string,
    renderFn: () => void
  ): void {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const startTime = performance.now();
      renderFn();
      const endTime = performance.now();
      
      console.log(`${componentName} render time: ${endTime - startTime}ms`);
    } else {
      renderFn();
    }
  }

  /**
   * Measure bundle load time
   */
  static measureBundleLoad(
    bundleName: string,
    loadFn: () => Promise<any>
  ): Promise<any> {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const startTime = performance.now();
      
      return loadFn().then(result => {
        const endTime = performance.now();
        console.log(`${bundleName} load time: ${endTime - startTime}ms`);
        return result;
      });
    }
    
    return loadFn();
  }

  /**
   * Get bundle size information
   */
  static getBundleInfo(): void {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      console.log('Bundle Performance Info:', {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        totalLoadTime: navigation.loadEventEnd - navigation.fetchStart,
      });
    }
  }
}

/**
 * Resource optimization
 */
export class ResourceOptimization {
  /**
   * Preload critical resources
   */
  static preloadResource(
    href: string,
    as: 'script' | 'style' | 'font' | 'image' = 'script'
  ): void {
    if (typeof document !== 'undefined') {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = href;
      link.as = as;
      
      if (as === 'font') {
        link.crossOrigin = 'anonymous';
      }
      
      document.head.appendChild(link);
    }
  }

  /**
   * Prefetch resources for future navigation
   */
  static prefetchResource(href: string): void {
    if (typeof document !== 'undefined') {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = href;
      document.head.appendChild(link);
    }
  }

  /**
   * Lazy load images with intersection observer
   */
  static lazyLoadImages(): void {
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const src = img.dataset.src;
            
            if (src) {
              img.src = src;
              img.classList.remove('lazy');
              observer.unobserve(img);
            }
          }
        });
      });

      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
      });
    }
  }
}

/**
 * Code splitting configurations
 */
export const CodeSplittingConfig = {
  // Route-based splitting
  routes: {
    dashboard: () => import('../../app/page'),
    projects: () => import('../../app/timesheet/page'),
    tasks: () => import('../../app/timesheet/page'),
    timers: () => import('../../app/timesheet/page'),
    reports: () => import('../../app/monitoring/page'),
    settings: () => import('../../app/timesheet/page'),
  },

  // Component-based splitting
  components: {
    monitoringDashboard: () => import('../../components/MonitoringDashboard'),
    performanceMonitor: () => import('../../components/PerformanceMonitor'),
    optimizedImage: () => import('../../components/OptimizedImage'),
    lazyComponents: () => import('../../components/LazyComponents'),
  },

  // Utility-based splitting
  utilities: {
    pagination: () => import('./pagination'),
    queryOptimization: () => import('./queryOptimization'),
    bundleOptimization: () => import('./bundleOptimization'),
  },
};

/**
 * Performance monitoring
 */
export class PerformanceMonitor {
  private static metrics: Map<string, number[]> = new Map();

  /**
   * Record performance metric
   */
  static recordMetric(name: string, value: number): void {
    const existing = this.metrics.get(name) || [];
    existing.push(value);
    
    // Keep only last 100 measurements
    if (existing.length > 100) {
      existing.shift();
    }
    
    this.metrics.set(name, existing);
  }

  /**
   * Get average metric value
   */
  static getAverageMetric(name: string): number {
    const values = this.metrics.get(name) || [];
    if (values.length === 0) return 0;
    
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  /**
   * Get all metrics
   */
  static getAllMetrics(): Record<string, { average: number; count: number; latest: number }> {
    const result: Record<string, { average: number; count: number; latest: number }> = {};
    
    this.metrics.forEach((values, name) => {
      result[name] = {
        average: values.reduce((sum, value) => sum + value, 0) / values.length,
        count: values.length,
        latest: values[values.length - 1] || 0,
      };
    });
    
    return result;
  }

  /**
   * Monitor React component performance
   */
  static withPerformanceMonitoring<P extends object>(
    WrappedComponent: React.ComponentType<P>,
    componentName: string
  ): React.ComponentType<P> {
    return React.memo((props: P) => {
      const renderStartTime = React.useRef<number>(0);
      
      React.useLayoutEffect(() => {
        renderStartTime.current = performance.now();
      });
      
      React.useEffect(() => {
        const renderTime = performance.now() - renderStartTime.current;
        PerformanceMonitor.recordMetric(`${componentName}_render_time`, renderTime);
      });
      
      return React.createElement(WrappedComponent, props);
    });
  }
}

// React import for TypeScript
import React from 'react';