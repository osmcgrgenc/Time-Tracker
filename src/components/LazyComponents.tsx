'use client';

import React, { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';
import { DynamicImports } from '@/lib/utils/bundleOptimization';

// Loading fallback components
const DashboardSkeleton = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-2 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

const ChartSkeleton = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-4 w-48" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-64 w-full" />
    </CardContent>
  </Card>
);

const LoadingSpinner = ({ message = 'Loading...' }: { message?: string }) => (
  <div className="flex flex-col items-center justify-center py-12 space-y-4">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
    <p className="text-sm text-muted-foreground">{message}</p>
  </div>
);

// Lazy loaded components
export const LazyMonitoringDashboard = DynamicImports.lazyComponent(
  () => import('@/components/MonitoringDashboard')
);

export const LazyGamifiedDashboard = DynamicImports.lazyComponent(
  () => import('@/components/dashboard/GamifiedDashboard')
);

export const LazyXPHistory = DynamicImports.lazyComponent(
  () => import('@/components/dashboard/XPHistory')
);

export const LazyPerformanceMonitor = DynamicImports.lazyComponent(
  () => import('@/components/PerformanceMonitor').then(module => ({ default: module.PerformanceMonitor }))
);

// Wrapped components with suspense and error boundaries
export const MonitoringDashboardWithSuspense = () => (
  <Suspense fallback={<DashboardSkeleton />}>
    <LazyMonitoringDashboard />
  </Suspense>
);

export const GamifiedDashboardWithSuspense = () => (
  <Suspense fallback={<DashboardSkeleton />}>
    <LazyGamifiedDashboard />
  </Suspense>
);

export const XPHistoryWithSuspense = () => (
  <Suspense fallback={<ChartSkeleton />}>
    <LazyXPHistory />
  </Suspense>
);

export const PerformanceMonitorWithSuspense = () => (
  <Suspense fallback={<LoadingSpinner message="Loading performance monitor..." />}>
    <LazyPerformanceMonitor />
  </Suspense>
);

// Preload functions for better UX
export const preloadComponents = {
  monitoringDashboard: () => {
    DynamicImports.preloadComponent(
      () => import('@/components/MonitoringDashboard')
    );
  },
  gamifiedDashboard: () => {
    DynamicImports.preloadComponent(
      () => import('@/components/dashboard/GamifiedDashboard')
    );
  },
  xpHistory: () => {
    DynamicImports.preloadComponent(
      () => import('@/components/dashboard/XPHistory')
    );
  },
  performanceMonitor: () => {
    DynamicImports.preloadComponent(
      () => import('@/components/PerformanceMonitor')
    );
  },
};

// Hook for preloading components on user interaction
export const useComponentPreloader = () => {
  const preloadOnHover = (componentName: keyof typeof preloadComponents) => {
    return {
      onMouseEnter: () => preloadComponents[componentName](),
      onFocus: () => preloadComponents[componentName](),
    };
  };

  return { preloadOnHover };
};

// Error boundary for lazy components
export class LazyComponentErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">Failed to load component</p>
              <button
                onClick={() => this.setState({ hasError: false })}
                className="text-sm text-primary hover:underline"
              >
                Try again
              </button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}