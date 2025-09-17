'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Play, Pause, Square, Check, Plus, Clock, Trophy, Target, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTimers } from '@/hooks/useTimers';
import XPHistory from './XPHistory';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const {
    timers,
    projects,
    tasks,
    userStats,
    runningTimers,
    pausedTimers,
    completedToday,
    isLoading,
    createTimer,
    pauseTimer,
    resumeTimer,
    completeTimer,
    cancelTimer,
    formatDuration,
    getXPProgress,
  } = useTimers();

  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedTask, setSelectedTask] = useState<string>('');
  const [newTimerNote, setNewTimerNote] = useState('');
  const [newTimerBillable, setNewTimerBillable] = useState(false);
  const [showQuickStart, setShowQuickStart] = useState(false);
  const [completeDialog, setCompleteDialog] = useState<{ open: boolean; timerId: string }>({ open: false, timerId: '' });
  const [completeDescription, setCompleteDescription] = useState('');

  const filteredTasks = tasks.filter(task => selectedProject && selectedProject !== 'none' && task.projectId === selectedProject);

  const handleCreateTimer = async () => {
    const success = await createTimer({
      projectId: selectedProject && selectedProject !== 'none' ? selectedProject : undefined,
      taskId: selectedTask && selectedTask !== 'none' ? selectedTask : undefined,
      note: newTimerNote,
      billable: newTimerBillable,
    });

    if (success) {
      setNewTimerNote('');
      setNewTimerBillable(false);
      setSelectedProject('');
      setSelectedTask('');
      setShowQuickStart(false);
    }
  };

  const handleCompleteTimer = async (timerId: string) => {
    const success = await completeTimer(timerId, completeDescription);
    if (success) {
      setCompleteDialog({ open: false, timerId: '' });
      setCompleteDescription('');
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                  <Target className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">TimeTracker</h1>
                  <p className="text-sm text-gray-500">Welcome back, {user.name || user.email}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {runningTimers.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium text-green-800">
                    {runningTimers.length} active
                  </span>
                </div>
              )}
              <Button variant="outline" onClick={logout} className="text-sm">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Level</p>
                  <p className="text-3xl font-bold">{userStats.level}</p>
                </div>
                <Trophy className="h-8 w-8 text-blue-200 animate-bounce" />
              </div>
              <div className="mt-4">
                <Progress value={getXPProgress()} className="h-2 bg-blue-400" />
                <p className="text-xs text-blue-100 mt-1">{userStats.xp} XP</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Today</p>
                  <p className="text-3xl font-bold">{completedToday}</p>
                </div>
                <Check className="h-8 w-8 text-green-200 animate-pulse" />
              </div>
              <p className="text-xs text-green-100 mt-4">Tasks completed</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Total Hours</p>
                  <p className="text-3xl font-bold">{userStats.totalHours}</p>
                </div>
                <Clock className="h-8 w-8 text-purple-200 animate-spin" />
              </div>
              <p className="text-xs text-purple-100 mt-4">Time tracked</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Streak</p>
                  <p className="text-3xl font-bold">{userStats.streak}</p>
                </div>
                <Zap className="h-8 w-8 text-orange-200 animate-ping" />
              </div>
              <p className="text-xs text-orange-100 mt-4">Days active</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Start */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Quick Start Timer
                </CardTitle>
                <CardDescription>Start tracking your time instantly</CardDescription>
              </div>
              <Button 
                onClick={() => setShowQuickStart(!showQuickStart)}
                variant={showQuickStart ? "secondary" : "default"}
              >
                {showQuickStart ? 'Cancel' : 'New Timer'}
              </Button>
            </div>
          </CardHeader>
          
          {showQuickStart && (
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="note">What are you working on?</Label>
                  <Textarea
                    id="note"
                    placeholder="Enter task description..."
                    value={newTimerNote}
                    onChange={(e) => setNewTimerNote(e.target.value)}
                    className="h-20"
                  />
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Project (Optional)</Label>
                    <Select value={selectedProject} onValueChange={setSelectedProject}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select project" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Project</SelectItem>
                        {projects.map(project => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {selectedProject && selectedProject !== 'none' && (
                    <div className="space-y-2">
                      <Label>Task (Optional)</Label>
                      <Select value={selectedTask} onValueChange={setSelectedTask}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select task" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Task</SelectItem>
                          {filteredTasks.map(task => (
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
                      checked={newTimerBillable}
                      onCheckedChange={setNewTimerBillable}
                    />
                    <Label htmlFor="billable">Billable</Label>
                  </div>
                </div>
              </div>
              
              <Button
                onClick={handleCreateTimer}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
              >
                <Play className="h-4 w-4 mr-2" />
                {isLoading ? 'Starting...' : 'Start Timer'}
              </Button>
            </CardContent>
          )}
        </Card>

        {/* Active Timers */}
        {(runningTimers.length > 0 || pausedTimers.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {runningTimers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-600">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                    Running ({runningTimers.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {runningTimers.map(timer => (
                    <div key={timer.id} className="p-4 border border-green-200 rounded-lg bg-green-50 hover:shadow-md transition-all duration-300 hover:border-green-300">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-2xl font-mono font-bold text-green-700 animate-pulse">
                          {formatDuration(timer.currentElapsedMs)}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => pauseTimer(timer.id)} className="hover:bg-yellow-50 hover:border-yellow-300 transition-colors">
                            <Pause className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setCompleteDialog({ open: true, timerId: timer.id });
                              setCompleteDescription(timer.note || '');
                            }}
                            className="hover:bg-green-50 hover:border-green-300 transition-colors"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => cancelTimer(timer.id)} className="hover:bg-red-50 hover:border-red-300 transition-colors">
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
                        {timer.billable && <Badge variant="secondary" className="animate-pulse">Billable</Badge>}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {pausedTimers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-yellow-600">
                    <Pause className="h-5 w-5" />
                    Paused ({pausedTimers.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {pausedTimers.map(timer => (
                    <div key={timer.id} className="p-4 border border-yellow-200 rounded-lg bg-yellow-50 hover:shadow-md transition-all duration-300 hover:border-yellow-300">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-2xl font-mono font-bold text-yellow-700">
                          {formatDuration(timer.elapsedMs)}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => resumeTimer(timer.id)} className="hover:bg-green-50 hover:border-green-300 transition-colors">
                            <Play className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setCompleteDialog({ open: true, timerId: timer.id });
                              setCompleteDescription(timer.note || '');
                            }}
                            className="hover:bg-green-50 hover:border-green-300 transition-colors"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => cancelTimer(timer.id)} className="hover:bg-red-50 hover:border-red-300 transition-colors">
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
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Recent Timers */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest timer sessions</CardDescription>
          </CardHeader>
          <CardContent>
            {timers.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No timers yet</h3>
                <p className="text-gray-500 mb-4">Start your first timer to begin tracking your time</p>
                <Button onClick={() => setShowQuickStart(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Timer
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {timers.slice(0, 10).map(timer => (
                  <div key={timer.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="text-lg font-mono">
                        {formatDuration(timer.currentElapsedMs)}
                      </div>
                      <Badge variant={
                        timer.status === 'RUNNING' ? 'default' :
                        timer.status === 'PAUSED' ? 'secondary' :
                        timer.status === 'COMPLETED' ? 'default' : 'destructive'
                      }>
                        {timer.status}
                      </Badge>
                      <div className="text-sm text-gray-600">
                        {timer.note || timer.project?.name || 'Untitled'}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(timer.startedAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* XP History */}
        <XPHistory />
      </main>

      {/* Complete Timer Dialog */}
      <Dialog open={completeDialog.open} onOpenChange={(open) => setCompleteDialog({ open, timerId: '' })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Timer</DialogTitle>
            <DialogDescription>
              Add a final description and earn XP for completing this task
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="completeDescription">Final Description</Label>
              <Textarea
                id="completeDescription"
                value={completeDescription}
                onChange={(e) => setCompleteDescription(e.target.value)}
                placeholder="Describe what you accomplished..."
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCompleteDialog({ open: false, timerId: '' })}>
                Cancel
              </Button>
              <Button onClick={() => handleCompleteTimer(completeDialog.timerId)} className="bg-green-600 hover:bg-green-700">
                <Trophy className="h-4 w-4 mr-2" />
                Complete (+15 XP)
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
