'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LayoutDashboard, Clock, FileText } from 'lucide-react';

interface NavigationProps {
  activeView: 'dashboard' | 'timesheet';
  onViewChange: (view: 'dashboard' | 'timesheet') => void;
}

export function Navigation({ activeView, onViewChange }: NavigationProps) {
  return (
    <Card className="mb-6">
      <CardContent className="p-2">
        <div className="flex space-x-2">
          <Button
            variant={activeView === 'dashboard' ? 'default' : 'ghost'}
            onClick={() => onViewChange('dashboard')}
            className="flex items-center space-x-2"
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Dashboard</span>
          </Button>
          <Button
            variant={activeView === 'timesheet' ? 'default' : 'ghost'}
            onClick={() => onViewChange('timesheet')}
            className="flex items-center space-x-2"
          >
            <FileText className="h-4 w-4" />
            <span>Timesheet</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}