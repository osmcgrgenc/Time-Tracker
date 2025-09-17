'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Pause, Square, Check, Plus, Clock, Trophy, Target, Zap, Star, Award, TrendingUp, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { AchievementSystem } from '@/components/gamification/AchievementSystem';
import { DailyChallenges } from '@/components/gamification/DailyChallenges';
import { Leaderboard } from '@/components/gamification/Leaderboard';
import { FocusMode } from '@/components/gamification/FocusMode';
import TimesheetContent from '@/components/timesheet/TimesheetContent';

interface Timer {
  id: string;
  status: 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'CANCELED';
  note?: string;
  billable: boolean;
  startedAt: string;
  pausedAt?: string;
  elapsedMs: number;
  currentElapsedMs: number;
  project?: {
    id: string;
    name: string;
    client?: string;
  };
  task?: {
    id: string;
    title: string;
    status?: string;
  };
}

interface Project {
  id: string;
  name: string;
  client?: string;
}

interface Task {
  id: string;
  title: string;
  status?: string;
  projectId: string;
}

interface UserStats {
  level: number;
  xp: number;
  xpToNext: number;
  streak: number;
  totalHours: number;
  completedTasks: number;
  achievements: string[];
  todayHours: number;
  todayTasks: number;
  focusTime: number;
}

export default function GamifiedDashboard() {
  const { user, logout } = useAuth();
  const [timers, setTimers] = useState<Timer[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedTask, setSelectedTask] = useState<string>('');
  const [newTimerNote, setNewTimerNote] = useState('');
  const [newTimerBillable, setNewTimerBillable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userStats, setUserStats] = useState<UserStats>({
    level: 1,
    xp: 0,
    xpToNext: 100,
    streak: 0,
    totalHours: 0,
    completedTasks: 0,
    achievements: [],
    todayHours: 0,
    todayTasks: 0,
    focusTime: 0
  });
  const [showQuickStart, setShowQuickStart] = useState(false);
  const [completeDialog, setCompleteDialog] = useState<{ open: boolean; timerId: string }>({ open: false, timerId: '' });
  const [completeDescription, setCompleteDescription] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showBulkInsert, setShowBulkInsert] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectClient, setNewProjectClient] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [bulkEntries, setBulkEntries] = useState('');

  // Memoized calculations
  const runningTimers = useMemo(() => timers.filter(t => t.status === 'RUNNING'), [timers]);
  const pausedTimers = useMemo(() => timers.filter(t => t.status === 'PAUSED'), [timers]);
  const completedToday = useMemo(() => {
    const today = new Date().toDateString();
    return timers.filter(t => t.status === 'COMPLETED' && new Date(t.startedAt).toDateString() === today).length;
  }, [timers]);

  // Fetch data
  const fetchData = async () => {
    if (!user) return;

    try {
      const [timersRes, projectsRes, tasksRes] = await Promise.all([
        fetch(`/api/timers?userId=${user.id}`),
        fetch(`/api/projects?userId=${user.id}`),
        fetch(`/api/tasks?userId=${user.id}`),
      ]);

      if (timersRes.ok) {
        const timersData = await timersRes.json();
        setTimers(timersData.timers);
        
        // Calculate user stats
        const totalMs = timersData.timers.reduce((acc: number, timer: Timer) => acc + timer.elapsedMs, 0);
        const totalHours = Math.floor(totalMs / 3600000);
        const completedTasks = timersData.timers.filter((t: Timer) => t.status === 'COMPLETED').length;
        
        // Today's stats
        const today = new Date().toDateString();
        const todayTimers = timersData.timers.filter((t: Timer) => new Date(t.startedAt).toDateString() === today);
        const todayMs = todayTimers.reduce((acc: number, timer: Timer) => acc + timer.elapsedMs, 0);
        const todayHours = Math.floor(todayMs / 3600000);
        const todayTasks = todayTimers.filter((t: Timer) => t.status === 'COMPLETED').length;
        
        setUserStats(prev => ({
          ...prev,
          totalHours,
          completedTasks,
          todayHours,
          todayTasks,
          xp: completedTasks * 10 + totalHours * 5,
          level: Math.floor((completedTasks * 10 + totalHours * 5) / 100) + 1
        }));
      }

      if (projectsRes.ok) {
        const projectsData = await projectsRes.json();
        setProjects(projectsData.projects);
      }

      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        setTasks(tasksData.tasks);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Update timer displays every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTimers(prevTimers => 
        prevTimers.map(timer => ({
          ...timer,
          currentElapsedMs: timer.status === 'RUNNING' 
            ? timer.elapsedMs + (Date.now() - new Date(timer.startedAt).getTime())
            : timer.elapsedMs
        }))
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatDuration = (ms: number) => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getXPProgress = () => {
    const currentLevelXP = (userStats.level - 1) * 100;
    const progress = ((userStats.xp - currentLevelXP) / 100) * 100;
    return Math.min(progress, 100);
  };

  const handleXPGain = (xp: number) => {
    setUserStats(prev => ({
      ...prev,
      xp: prev.xp + xp,
      level: Math.floor((prev.xp + xp) / 100) + 1
    }));
  };

  const handleFocusComplete = (minutes: number) => {
    setUserStats(prev => ({
      ...prev,
      focusTime: prev.focusTime + minutes
    }));
  };

  const createTimer = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/timers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          projectId: selectedProject && selectedProject !== 'none' ? selectedProject : undefined,
          taskId: selectedTask && selectedTask !== 'none' ? selectedTask : undefined,
          note: newTimerNote,
          billable: newTimerBillable,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setTimers(prev => [data.timer, ...prev]);
        setNewTimerNote('');
        setNewTimerBillable(false);
        setSelectedProject('');
        setSelectedTask('');
        setShowQuickStart(false);
        toast.success('🚀 Timer started! +5 XP');
        handleXPGain(5);
      } else {
        toast.error('Failed to create timer');
      }
    } catch (error) {
      console.error('Error creating timer:', error);
      toast.error('Failed to create timer');
    }
    setIsLoading(false);
  };

  const pauseTimer = async (timerId: string) => {
    if (!user) return;

    try {
      const response = await fetch(`/api/timers/${timerId}/pause`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setTimers(prev => prev.map(t => t.id === timerId ? data.timer : t));
        toast.success('⏸️ Timer paused');
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to pause timer');
      }
    } catch (error) {
      console.error('Error pausing timer:', error);
      toast.error('Failed to pause timer');
    }
  };

  const resumeTimer = async (timerId: string) => {
    if (!user) return;

    try {
      const response = await fetch(`/api/timers/${timerId}/resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setTimers(prev => prev.map(t => t.id === timerId ? data.timer : t));
        toast.success('▶️ Timer resumed');
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to resume timer');
      }
    } catch (error) {
      console.error('Error resuming timer:', error);
      toast.error('Failed to resume timer');
    }
  };

  const completeTimer = async (timerId: string) => {
    if (!user) return;

    try {
      const response = await fetch(`/api/timers/${timerId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          description: completeDescription,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setTimers(prev => prev.map(t => t.id === timerId ? data.timer : t));
        setCompleteDialog({ open: false, timerId: '' });
        setCompleteDescription('');
        
        const xpGain = 15;
        handleXPGain(xpGain);
        setUserStats(prev => ({ 
          ...prev, 
          completedTasks: prev.completedTasks + 1,
          todayTasks: prev.todayTasks + 1
        }));
        
        toast.success(`🏆 Timer completed! +${xpGain} XP`);
      } else {
        toast.error('Failed to complete timer');
      }
    } catch (error) {
      console.error('Error completing timer:', error);
      toast.error('Failed to complete timer');
    }
  };

  const cancelTimer = async (timerId: string) => {
    if (!user) return;

    try {
      const response = await fetch(`/api/timers/${timerId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      if (response.ok) {
        const data = await response.json();
        setTimers(prev => prev.map(t => t.id === timerId ? data.timer : t));
        toast.success('❌ Timer canceled');
      } else {
        toast.error('Failed to cancel timer');
      }
    } catch (error) {
      console.error('Error canceling timer:', error);
      toast.error('Failed to cancel timer');
    }
  };

  const filteredTasks = tasks.filter(task => selectedProject && selectedProject !== 'none' && task.projectId === selectedProject);

  const createProject = async () => {
    if (!user || !newProjectName.trim()) return;

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          name: newProjectName,
          client: newProjectClient,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setProjects(prev => [data.project, ...prev]);
        setSelectedProject(data.project.id);
        setNewProjectName('');
        setNewProjectClient('');
        setShowCreateProject(false);
        toast.success('🎯 Project created!');
        handleXPGain(10);
      } else {
        toast.error('Failed to create project');
      }
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project');
    }
  };

  const createTask = async () => {
    if (!user || !newTaskTitle.trim() || !selectedProject) return;

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProject,
          title: newTaskTitle,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setTasks(prev => [data.task, ...prev]);
        setSelectedTask(data.task.id);
        setNewTaskTitle('');
        setShowCreateTask(false);
        toast.success('📋 Task created!');
        handleXPGain(5);
      } else {
        toast.error('Failed to create task');
      }
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task');
    }
  };

  const bulkInsertEntries = async () => {
    if (!user || !bulkEntries.trim()) return;

    try {
      const entries = bulkEntries.split('\n').filter(line => line.trim()).map(line => {
        const parts = line.split(',').map(p => p.trim());
        return {
          date: parts[0] || new Date().toISOString().split('T')[0],
          description: parts[1] || '',
          minutes: parseInt(parts[2]) || 60,
          billable: parts[3]?.toLowerCase() === 'true' || false,
          projectId: selectedProject !== 'none' ? selectedProject : undefined,
          taskId: selectedTask !== 'none' ? selectedTask : undefined
        };
      });

      const response = await fetch('/api/time-entries/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          entries
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setBulkEntries('');
        setShowBulkInsert(false);
        toast.success(`📊 ${entries.length} entries added!`);
        handleXPGain(entries.length * 2);
      } else {
        toast.error('Failed to insert entries');
      }
    } catch (error) {
      console.error('Error bulk inserting:', error);
      toast.error('Failed to insert entries');
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
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                  <Target className="h-3 w-3 sm:h-5 sm:w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-sm sm:text-lg font-semibold text-gray-900">TimeTracker Pro</h1>
                  <p className="text-xs sm:text-sm text-gray-500">Level {userStats.level} • {userStats.xp} XP</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4">
              {runningTimers.length > 0 && (
                <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-green-100 rounded-full">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs sm:text-sm font-medium text-green-800">
                    <span className="hidden sm:inline">{runningTimers.length} active</span>
                    <span className="sm:hidden">{runningTimers.length}</span>
                  </span>
                </div>
              )}
              <Button variant="outline" onClick={logout} className="text-xs sm:text-sm px-2 sm:px-4">
                <span className="hidden sm:inline">Logout</span>
                <span className="sm:hidden">Exit</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-8">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1">
            <TabsTrigger value="dashboard" className="text-xs sm:text-sm">Dashboard</TabsTrigger>
            <TabsTrigger value="timesheet" className="text-xs sm:text-sm">Timesheet</TabsTrigger>
            <TabsTrigger value="focus" className="text-xs sm:text-sm">Focus</TabsTrigger>
            <TabsTrigger value="challenges" className="text-xs sm:text-sm">Challenges</TabsTrigger>
            <TabsTrigger value="achievements" className="text-xs sm:text-sm">Awards</TabsTrigger>
            <TabsTrigger value="leaderboard" className="text-xs sm:text-sm">Leaders</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm font-medium">Level</p>
                      <p className="text-3xl font-bold">{userStats.level}</p>
                    </div>
                    <Trophy className="h-8 w-8 text-blue-200" />
                  </div>
                  <div className="mt-4">
                    <Progress value={getXPProgress()} className="h-2 bg-blue-400" />
                    <p className="text-xs text-blue-100 mt-1">{userStats.xp} XP</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm font-medium">Today</p>
                      <p className="text-3xl font-bold">{completedToday}</p>
                    </div>
                    <Check className="h-8 w-8 text-green-200" />
                  </div>
                  <p className="text-xs text-green-100 mt-4">Tasks completed</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm font-medium">Total Hours</p>
                      <p className="text-3xl font-bold">{userStats.totalHours}</p>
                    </div>
                    <Clock className="h-8 w-8 text-purple-200" />
                  </div>
                  <p className="text-xs text-purple-100 mt-4">Time tracked</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100 text-sm font-medium">Streak</p>
                      <p className="text-3xl font-bold">{userStats.streak}</p>
                    </div>
                    <Zap className="h-8 w-8 text-orange-200" />
                  </div>
                  <p className="text-xs text-orange-100 mt-4">Days active</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Start Timer */}
            <Card>
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
                        <div className="flex gap-2">
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
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => setShowCreateProject(true)}
                            className="shrink-0"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {selectedProject && selectedProject !== 'none' && (
                        <div className="space-y-2">
                          <Label>Task (Optional)</Label>
                          <div className="flex gap-2">
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
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => setShowCreateTask(true)}
                              className="shrink-0"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
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
                    onClick={createTimer} 
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                        <div key={timer.id} className="p-4 border border-green-200 rounded-lg bg-green-50">
                          <div className="flex items-center justify-between mb-3">
                            <div className="text-2xl font-mono font-bold text-green-700">
                              {formatDuration(timer.currentElapsedMs)}
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => pauseTimer(timer.id)}>
                                <Pause className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  setCompleteDialog({ open: true, timerId: timer.id });
                                  setCompleteDescription(timer.note || '');
                                }}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => cancelTimer(timer.id)}>
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
                        <div key={timer.id} className="p-4 border border-yellow-200 rounded-lg bg-yellow-50">
                          <div className="flex items-center justify-between mb-3">
                            <div className="text-2xl font-mono font-bold text-yellow-700">
                              {formatDuration(timer.elapsedMs)}
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => resumeTimer(timer.id)}>
                                <Play className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  setCompleteDialog({ open: true, timerId: timer.id });
                                  setCompleteDescription(timer.note || '');
                                }}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => cancelTimer(timer.id)}>
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
          </TabsContent>

          <TabsContent value="timesheet">
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button
                  onClick={() => setShowBulkInsert(true)}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Bulk Insert
                </Button>
              </div>
              <TimesheetContent />
            </div>
          </TabsContent>

          <TabsContent value="focus">
            <FocusMode onFocusComplete={handleFocusComplete} onXPGain={handleXPGain} />
          </TabsContent>

          <TabsContent value="challenges">
            <DailyChallenges 
              userStats={{
                todayHours: userStats.todayHours,
                todayTasks: userStats.todayTasks,
                currentStreak: userStats.streak,
                focusTime: userStats.focusTime
              }}
              onXPGain={handleXPGain}
            />
          </TabsContent>

          <TabsContent value="achievements">
            <AchievementSystem 
              userStats={userStats}
              onXPGain={handleXPGain}
            />
          </TabsContent>

          <TabsContent value="leaderboard">
            <Leaderboard 
              currentUser={{
                id: user.id,
                name: user.name || user.email,
                level: userStats.level,
                xp: userStats.xp,
                totalHours: userStats.totalHours,
                completedTasks: userStats.completedTasks,
                streak: userStats.streak
              }}
            />
          </TabsContent>
        </Tabs>
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
              <Button onClick={() => completeTimer(completeDialog.timerId)} className="bg-green-600 hover:bg-green-700">
                <Trophy className="h-4 w-4 mr-2" />
                Complete (+15 XP)
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Project Dialog */}
      <Dialog open={showCreateProject} onOpenChange={setShowCreateProject}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Add a new project to organize your time tracking
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="projectName">Project Name</Label>
              <Input
                id="projectName"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Enter project name"
              />
            </div>
            <div>
              <Label htmlFor="projectClient">Client (Optional)</Label>
              <Input
                id="projectClient"
                value={newProjectClient}
                onChange={(e) => setNewProjectClient(e.target.value)}
                placeholder="Enter client name"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateProject(false)}>
                Cancel
              </Button>
              <Button onClick={createProject} disabled={!newProjectName.trim()}>
                <Target className="h-4 w-4 mr-2" />
                Create (+10 XP)
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Task Dialog */}
      <Dialog open={showCreateTask} onOpenChange={setShowCreateTask}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>
              Add a new task to the selected project
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="taskTitle">Task Title</Label>
              <Input
                id="taskTitle"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Enter task title"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateTask(false)}>
                Cancel
              </Button>
              <Button onClick={createTask} disabled={!newTaskTitle.trim()}>
                <Check className="h-4 w-4 mr-2" />
                Create (+5 XP)
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Insert Dialog */}
      <Dialog open={showBulkInsert} onOpenChange={setShowBulkInsert}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bulk Insert Time Entries</DialogTitle>
            <DialogDescription>
              Add multiple time entries at once. Format: Date, Description, Minutes, Billable
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="bulkEntries">Time Entries (CSV Format)</Label>
              <Textarea
                id="bulkEntries"
                value={bulkEntries}
                onChange={(e) => setBulkEntries(e.target.value)}
                placeholder={`2024-01-15, Website development, 120, true
2024-01-15, Code review, 60, false
2024-01-16, Client meeting, 90, true`}
                rows={8}
                className="font-mono text-sm"
              />
            </div>
            <div className="text-sm text-gray-600">
              <p><strong>Format:</strong> Date (YYYY-MM-DD), Description, Minutes, Billable (true/false)</p>
              <p><strong>Project/Task:</strong> Will use currently selected project and task</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowBulkInsert(false)}>
                Cancel
              </Button>
              <Button onClick={bulkInsertEntries} disabled={!bulkEntries.trim()}>
                <Plus className="h-4 w-4 mr-2" />
                Insert Entries
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}