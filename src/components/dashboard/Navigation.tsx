'use client';

import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, FileText, Trophy, Target, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useComponentPreloader } from '@/components/LazyComponents';

interface NavigationProps {
  activeView: 'dashboard' | 'timesheet' | 'monitoring';
  onViewChange: (view: 'dashboard' | 'timesheet' | 'monitoring') => void;
  userStats?: {
    level: number;
    xp: number;
    streak: number;
  };
}

export function Navigation({ activeView, onViewChange, userStats }: NavigationProps) {
  const { preloadOnHover } = useComponentPreloader();
  
  const buttonClasses = useMemo(() => ({
    base: "relative flex items-center gap-3 px-6 py-3 rounded-lg font-medium text-sm transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-orange-500/50",
    active: "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25",
    inactive: "bg-white/80 text-gray-700 hover:bg-orange-50 border border-gray-200 shadow-sm"
  }), []);

  return (
    <div className="bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
              <Target className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">TimeTracker</h1>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-2">
            <Button
              onClick={() => onViewChange('dashboard')}
              className={cn(
                buttonClasses.base,
                activeView === 'dashboard' ? buttonClasses.active : buttonClasses.inactive
              )}
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Button>
            <Button
              onClick={() => onViewChange('timesheet')}
              className={cn(
                buttonClasses.base,
                activeView === 'timesheet' ? buttonClasses.active : buttonClasses.inactive
              )}
            >
              <FileText className="h-4 w-4" />
              Timesheet
            </Button>
            <Button
              onClick={() => onViewChange('monitoring')}
              className={cn(
                buttonClasses.base,
                activeView === 'monitoring' ? buttonClasses.active : buttonClasses.inactive
              )}
              {...preloadOnHover('monitoringDashboard')}
            >
              <Activity className="h-4 w-4" />
              Monitoring
            </Button>
          </div>

          {/* Gamification Stats */}
          {userStats && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-yellow-100 to-yellow-200 rounded-full">
                <Trophy className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">Level {userStats.level}</span>
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">{userStats.streak}</span> day streak
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}