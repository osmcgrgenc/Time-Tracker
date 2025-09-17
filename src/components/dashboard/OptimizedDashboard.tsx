'use client';

import { useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useForm } from '@/hooks/useForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AccessibleButton } from '@/components/ui/accessible-button';
import { TimerCard } from './TimerCard';
import { XPBar } from '@/components/gamification/XPBar';
import { CelebrationModal } from '@/components/gamification/CelebrationModal';
import { useTimers } from '@/hooks/useTimers';
import { Plus, Target, Sun, Moon, Palette } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface TimerFormData {
  note: string;
  projectId: string;
  taskId: string;
  billable: boolean;
}

export default function OptimizedDashboard() {
  const { user, logout } = useAuth();
  const { theme, setTheme, colorScheme, setColorScheme, isDark } = useTheme();
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

  const [showQuickStart, setShowQuickStart] = useState(false);
  const [celebration, setCelebration] = useState<{
    isOpen: boolean;
    type: 'levelUp' | 'achievement' | 'streak' | 'perfectDay';
    data: any;
  }>({ isOpen: false, type: 'levelUp', data: {} });

  const timerForm = useForm<TimerFormData>({
    note: '',
    projectId: '',
    taskId: '',
    billable: false,
  });

  // Memoized filtered tasks
  const filteredTasks = useMemo(() => 
    tasks.filter(task => 
      timerForm.values.projectId && 
      timerForm.values.projectId !== 'none' && 
      task.projectId === timerForm.values.projectId
    ), [tasks, timerForm.values.projectId]
  );

  // Memoized timer handlers
  const handlePause = useCallback((id: string) => pauseTimer(id), [pauseTimer]);
  const handleResume = useCallback((id: string) => resumeTimer(id), [resumeTimer]);
  const handleComplete = useCallback((id: string) => completeTimer(id), [completeTimer]);
  const handleCancel = useCallback((id: string) => cancelTimer(id), [cancelTimer]);

  const handleCreateTimer = useCallback(async () => {
    await timerForm.handleSubmit(async (values) => {
      const success = await createTimer({
        projectId: values.projectId && values.projectId !== 'none' ? values.projectId : undefined,
        taskId: values.taskId && values.taskId !== 'none' ? values.taskId : undefined,
        note: values.note,
        billable: values.billable,
      });

      if (success) {
        timerForm.reset();
        setShowQuickStart(false);
      }
    });
  }, [createTimer, timerForm]);

  if (!user) return null;

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`border-b transition-colors duration-300 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 bg-gradient-to-r from-${colorScheme}-500 to-${colorScheme}-600 rounded-lg flex items-center justify-center`}>
                  <Target className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    TimeTracker Pro
                  </h1>
                  <XPBar 
                    level={userStats.level}
                    currentXP={userStats.xp}
                    xpToNext={userStats.xpToNext}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Theme Controls */}
              <div className="flex items-center gap-2">
                <AccessibleButton
                  variant="outline"
                  size="sm"
                  onClick={() => setTheme(isDark ? 'light' : 'dark')}
                  aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
                >
                  {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </AccessibleButton>
                
                <Select value={colorScheme} onValueChange={setColorScheme}>
                  <SelectTrigger className="w-20">
                    <Palette className="h-4 w-4" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blue">Blue</SelectItem>
                    <SelectItem value="green">Green</SelectItem>
                    <SelectItem value="purple">Purple</SelectItem>
                    <SelectItem value="orange">Orange</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {runningTimers.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium text-green-800">
                    {runningTimers.length} active
                  </span>
                </div>
              )}
              
              <AccessibleButton variant="outline" onClick={logout}>
                Logout
              </AccessibleButton>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Start Timer */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Quick Start Timer
                </CardTitle>
              </div>
              <AccessibleButton 
                onClick={() => setShowQuickStart(!showQuickStart)}
                variant={showQuickStart ? "secondary" : "default"}
                aria-expanded={showQuickStart}
                aria-controls="quick-start-form"
              >
                {showQuickStart ? 'Cancel' : 'New Timer'}
              </AccessibleButton>
            </div>
          </CardHeader>
          
          {showQuickStart && (
            <CardContent id="quick-start-form" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="timer-note">What are you working on?</Label>
                  <Textarea
                    id="timer-note"
                    placeholder="Enter task description..."
                    value={timerForm.values.note}
                    onChange={(e) => timerForm.setValue('note', e.target.value)}
                    className="h-20"
                    aria-describedby="timer-note-help"
                  />
                  <div id="timer-note-help" className="text-xs text-gray-500">
                    Describe what you'll be working on
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="project-select">Project (Optional)</Label>
                    <Select 
                      value={timerForm.values.projectId} 
                      onValueChange={(value) => timerForm.setValue('projectId', value)}
                    >
                      <SelectTrigger id="project-select">
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
                  
                  {timerForm.values.projectId && timerForm.values.projectId !== 'none' && (
                    <div className="space-y-2">
                      <Label htmlFor="task-select">Task (Optional)</Label>
                      <Select 
                        value={timerForm.values.taskId} 
                        onValueChange={(value) => timerForm.setValue('taskId', value)}
                      >
                        <SelectTrigger id="task-select">
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
                      id="billable-switch"
                      checked={timerForm.values.billable}
                      onCheckedChange={(checked) => timerForm.setValue('billable', checked)}
                    />
                    <Label htmlFor="billable-switch">Billable</Label>
                  </div>
                </div>
              </div>
              
              <AccessibleButton
                onClick={handleCreateTimer}
                loading={timerForm.isSubmitting}
                loadingText="Starting..."
                className={`w-full bg-gradient-to-r from-${colorScheme}-500 to-${colorScheme}-600 hover:from-${colorScheme}-600 hover:to-${colorScheme}-700`}
                aria-describedby="start-timer-help"
              >
                <Plus className="h-4 w-4 mr-2" />
                Start Timer
              </AccessibleButton>
              <div id="start-timer-help" className="text-xs text-gray-500 text-center">
                Earn +5 XP for starting a timer
              </div>
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
                    <TimerCard
                      key={timer.id}
                      timer={timer}
                      onPause={handlePause}
                      onResume={handleResume}
                      onComplete={handleComplete}
                      onCancel={handleCancel}
                      formatDuration={formatDuration}
                    />
                  ))}
                </CardContent>
              </Card>
            )}

            {pausedTimers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-yellow-600">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                    Paused ({pausedTimers.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {pausedTimers.map(timer => (
                    <TimerCard
                      key={timer.id}
                      timer={timer}
                      onPause={handlePause}
                      onResume={handleResume}
                      onComplete={handleComplete}
                      onCancel={handleCancel}
                      formatDuration={formatDuration}
                    />
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>

      {/* Celebration Modal */}
      <CelebrationModal
        isOpen={celebration.isOpen}
        onClose={() => setCelebration(prev => ({ ...prev, isOpen: false }))}
        type={celebration.type}
        data={celebration.data}
      />
    </div>
  );
}