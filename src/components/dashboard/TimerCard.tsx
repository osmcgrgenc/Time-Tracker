'use client';

import { useState, useEffect } from 'react';
import { Timer } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Play, Pause, Square, Check, Trash2, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface TimerCardProps {
  timer: Timer;
  onUpdate: () => void;
  projects: Array<{ id: string; name: string }>;
  tasks: Array<{ id: string; title: string; projectId: string }>;
}

export function TimerCard({ timer, onUpdate, projects, tasks }: TimerCardProps) {
  const [currentTime, setCurrentTime] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    note: timer.note || '',
    projectId: timer.projectId || '',
    taskId: timer.taskId || '',
    billable: timer.billable,
  });

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (timer.status === 'RUNNING') {
      interval = setInterval(() => {
        setCurrentTime(timer.currentElapsedMs || 0);
      }, 1000);
    } else {
      setCurrentTime(timer.elapsedMs);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer.status, timer.elapsedMs, timer.currentElapsedMs]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleAction = async (action: string) => {
    try {
      const response = await fetch(`/api/timers/${timer.id}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: timer.userId }),
      });

      if (response.ok) {
        onUpdate();
      }
    } catch (error) {
      console.error(`Timer ${action} error:`, error);
    }
  };

  const handleComplete = async () => {
    try {
      const response = await fetch(`/api/timers/${timer.id}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: timer.userId,
          description: editForm.note,
        }),
      });

      if (response.ok) {
        onUpdate();
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Timer complete error:', error);
    }
  };

  const handleCancel = async () => {
    try {
      const response = await fetch(`/api/timers/${timer.id}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: timer.userId }),
      });

      if (response.ok) {
        onUpdate();
      }
    } catch (error) {
      console.error('Timer cancel error:', error);
    }
  };

  const filteredTasks = tasks.filter(task => task.projectId === editForm.projectId);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RUNNING': return 'bg-green-500';
      case 'PAUSED': return 'bg-yellow-500';
      case 'COMPLETED': return 'bg-blue-500';
      case 'CANCELED': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          Timer {timer.id.slice(-6)}
        </CardTitle>
        <Badge className={`${getStatusColor(timer.status)} text-white`}>
          {timer.status}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span className="text-2xl font-bold">
              {formatTime(currentTime)}
            </span>
          </div>
          <div className="flex space-x-1">
            {timer.status === 'RUNNING' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAction('pause')}
              >
                <Pause className="h-4 w-4" />
              </Button>
            )}
            {timer.status === 'PAUSED' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAction('resume')}
              >
                <Play className="h-4 w-4" />
              </Button>
            )}
            {(timer.status === 'RUNNING' || timer.status === 'PAUSED') && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleComplete}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancel}
                >
                  <Square className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">
            Started: {format(new Date(timer.startedAt), 'MMM dd, yyyy HH:mm')}
          </div>
          {timer.project && (
            <div className="text-sm">
              <span className="font-medium">Project:</span> {timer.project.name}
            </div>
          )}
          {timer.task && (
            <div className="text-sm">
              <span className="font-medium">Task:</span> {timer.task.title}
            </div>
          )}
          {timer.billable && (
            <Badge variant="secondary">Billable</Badge>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-3 pt-2 border-t">
            <div>
              <Label htmlFor="note">Note</Label>
              <Textarea
                id="note"
                placeholder="Add a note..."
                value={editForm.note}
                onChange={(e) => setEditForm({ ...editForm, note: e.target.value })}
                className="h-20"
              />
            </div>
            <div>
              <Label htmlFor="project">Project</Label>
              <Select value={editForm.projectId} onValueChange={(value) => setEditForm({ ...editForm, projectId: value, taskId: '' })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {editForm.projectId && (
              <div>
                <Label htmlFor="task">Task</Label>
                <Select value={editForm.taskId} onValueChange={(value) => setEditForm({ ...editForm, taskId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select task" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredTasks.map((task) => (
                      <SelectItem key={task.id} value={task.id}>
                        {task.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <Switch
                id="billable"
                checked={editForm.billable}
                onCheckedChange={(checked) => setEditForm({ ...editForm, billable: checked })}
              />
              <Label htmlFor="billable">Billable</Label>
            </div>
            <div className="flex space-x-2">
              <Button size="sm" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleComplete}>
                Save & Complete
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {timer.note && (
              <div className="text-sm">
                <span className="font-medium">Note:</span> {timer.note}
              </div>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsEditing(true)}
              className="w-full"
            >
              Edit Details
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}