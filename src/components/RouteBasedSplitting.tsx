'use client';

import React, { Suspense } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';
import { DynamicImports } from '@/lib/utils/bundleOptimization';

// Loading components for different route types
const PageSkeleton = () => (
  <div className="space-y-6 p-6">
    <div className="space-y-2">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-6 w-32 mb-3" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

const FormSkeleton = () => (
  <div className="space-y-6 p-6 max-w-2xl mx-auto">
    <div className="space-y-2">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-72" />
    </div>
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
    <Skeleton className="h-10 w-32" />
  </div>
);

const TableSkeleton = () => (
  <div className="space-y-4 p-6">
    <div className="flex justify-between items-center">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-10 w-32" />
    </div>
    <div className="space-y-2">
      <Skeleton className="h-12 w-full" />
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  </div>
);

const LoadingSpinner = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center justify-center py-12 space-y-4">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
    <p className="text-sm text-muted-foreground">{message}</p>
  </div>
);

// Lazy loaded route components
export const LazyDashboardPage = DynamicImports.lazyComponent(
  () => import('@/app/[locale]/page')
);

export const LazyProjectsPage = DynamicImports.lazyComponent(
  () => import('@/app/[locale]/timesheet/page')
);

export const LazyTasksPage = DynamicImports.lazyComponent(
  () => import('@/app/[locale]/timesheet/page')
);

export const LazyTimersPage = DynamicImports.lazyComponent(
  () => import('@/app/[locale]/timesheet/page')
);

export const LazyReportsPage = DynamicImports.lazyComponent(
  () => import('@/app/[locale]/monitoring/page')
);

export const LazySettingsPage = DynamicImports.lazyComponent(
  () => import('@/app/[locale]/timesheet/page')
);

// Wrapped components with appropriate loading states
export const DashboardPageWithSuspense = () => (
  <Suspense fallback={<PageSkeleton />}>
    <LazyDashboardPage />
  </Suspense>
);

export const ProjectsPageWithSuspense = () => (
  <Suspense fallback={<TableSkeleton />}>
    <LazyProjectsPage />
  </Suspense>
);

export const TasksPageWithSuspense = () => (
  <Suspense fallback={<TableSkeleton />}>
    <LazyTasksPage />
  </Suspense>
);

export const TimersPageWithSuspense = () => (
  <Suspense fallback={<PageSkeleton />}>
    <LazyTimersPage />
  </Suspense>
);

export const ReportsPageWithSuspense = () => (
  <Suspense fallback={<LoadingSpinner message="Loading reports..." />}>
    <LazyReportsPage />
  </Suspense>
);

export const SettingsPageWithSuspense = () => (
  <Suspense fallback={<FormSkeleton />}>
    <LazySettingsPage />
  </Suspense>
);

// Route preloading utilities
export const RoutePreloader = {
  dashboard: () => DynamicImports.preloadComponent(() => import('@/app/[locale]/page')),
  projects: () => DynamicImports.preloadComponent(() => import('@/app/[locale]/timesheet/page')),
  tasks: () => DynamicImports.preloadComponent(() => import('@/app/[locale]/timesheet/page')),
  timers: () => DynamicImports.preloadComponent(() => import('@/app/[locale]/timesheet/page')),
  reports: () => DynamicImports.preloadComponent(() => import('@/app/[locale]/monitoring/page')),
  settings: () => DynamicImports.preloadComponent(() => import('@/app/[locale]/timesheet/page')),
};

// Hook for route-based preloading
export const useRoutePreloader = () => {
  const preloadRoute = (route: keyof typeof RoutePreloader) => {
    RoutePreloader[route]();
  };

  const preloadOnHover = (route: keyof typeof RoutePreloader) => {
    return {
      onMouseEnter: () => preloadRoute(route),
      onFocus: () => preloadRoute(route),
    };
  };

  const preloadMultipleRoutes = (routes: readonly (keyof typeof RoutePreloader)[]) => {
    routes.forEach(route => preloadRoute(route));
  };

  return {
    preloadRoute,
    preloadOnHover,
    preloadMultipleRoutes,
  };
};

// Route-based code splitting configuration
export const RouteSplittingConfig = {
  // Critical routes (preload immediately)
  critical: ['dashboard'] as const,
  
  // Important routes (preload on user interaction)
  important: ['projects', 'tasks', 'timers'] as const,
  
  // Secondary routes (lazy load only when needed)
  secondary: ['reports', 'settings'] as const,
  
  // Get preload strategy for a route
  getPreloadStrategy: (route: string): 'immediate' | 'interaction' | 'lazy' => {
    if (RouteSplittingConfig.critical.includes(route as any)) return 'immediate';
    if (RouteSplittingConfig.important.includes(route as any)) return 'interaction';
    return 'lazy';
  },
};

// Component for managing route preloading based on user behavior
export const RoutePreloadManager: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { preloadMultipleRoutes } = useRoutePreloader();

  React.useEffect(() => {
    // Preload critical routes immediately
    preloadMultipleRoutes(RouteSplittingConfig.critical);

    // Preload important routes after a delay
    const timer = setTimeout(() => {
      preloadMultipleRoutes(RouteSplittingConfig.important);
    }, 2000);

    return () => clearTimeout(timer);
  }, [preloadMultipleRoutes]);

  return <>{children}</>;
};

// Error boundary for route components
export class RouteErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): { hasError: boolean; error: Error } {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Route component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h2>
            <p className="text-sm text-gray-600 mb-4">Failed to load this page</p>
            <button
              onClick={() => this.setState({ hasError: false, error: undefined })}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}