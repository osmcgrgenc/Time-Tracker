'use client';

import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Pause, Square, Check } from 'lucide-react';
import { DashboardTimer } from '@/types';

interface TimerCardProps {
  timer: DashboardTimer;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onComplete: (id: string) => void;
  onCancel: (id: string) => void;
  formatDuration: (ms: number) => string;
}

export const TimerCard = memo(function TimerCard({
  timer,
  onPause,
  onResume,
  onComplete,
  onCancel,
  formatDuration
}: TimerCardProps) {
  const isRunning = timer.status === 'RUNNING';
  const isPaused = timer.status === 'PAUSED';

  const cardClass = isRunning 
    ? 'border-green-200 bg-green-50 hover:border-green-300' 
    : isPaused 
    ? 'border-yellow-200 bg-yellow-50 hover:border-yellow-300'
    : 'border-gray-200 bg-white hover:border-gray-300';

  const timeClass = isRunning 
    ? 'text-green-700 animate-pulse' 
    : isPaused 
    ? 'text-yellow-700'
    : 'text-gray-700';

  return (
    <Card className={`p-4 transition-all duration-300 hover:shadow-md ${cardClass}`}>
      <CardContent className="p-0">
        <div className="flex items-center justify-between mb-3">
          <div className={`text-2xl font-mono font-bold ${timeClass}`}>
            {formatDuration(isRunning ? timer.currentElapsedMs : timer.elapsedMs)}
          </div>
          <div className="flex gap-2">
            {isRunning && (
              <Button size="sm" variant="outline" onClick={() => onPause(timer.id)}>
                <Pause className="h-4 w-4" />
              </Button>
            )}
            {isPaused && (
              <Button size="sm" onClick={() => onResume(timer.id)}>
                <Play className="h-4 w-4" />
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => onComplete(timer.id)}>
              <Check className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={() => onCancel(timer.id)}>
              <Square className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-1 text-sm">
          {timer.project && (
            <p><span className="font-medium">Project:</span> {timer.project.name}</p>
          )}
          {timer.task && (
            <p><span className="font-medium">Task:</span> {timer.task.title}</p>
          )}
          {timer.note && (
            <p><span className="font-medium">Note:</span> {timer.note}</p>
          )}
          {timer.billable && <Badge variant="secondary">Billable</Badge>}
        </div>
      </CardContent>
    </Card>
  );
});

TimerCard.displayName = 'TimerCard';