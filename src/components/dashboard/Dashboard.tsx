'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Play, Pause, Square, Check, Trash2, Plus, Clock, Settings } from 'lucide-react';
import { toast } from 'sonner';

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

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [timers, setTimers] = useState<Timer[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedTask, setSelectedTask] = useState<string>('');
  const [newTimerNote, setNewTimerNote] = useState('');
  const [newTimerBillable, setNewTimerBillable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTimers, setSelectedTimers] = useState<Set<string>>(new Set());
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectClient, setNewProjectClient] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [completeDialog, setCompleteDialog] = useState<{ open: boolean; timerId: string }>({ open: false, timerId: '' });
  const [completeDescription, setCompleteDescription] = useState('');

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
        toast.success('Timer started!');
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

    console.log('Attempting to pause timer:', timerId);
    console.log('User ID:', user.id);

    try {
      const response = await fetch(`/api/timers/${timerId}/pause`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      console.log('Pause response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Pause response data:', data);
        setTimers(prev => prev.map(t => t.id === timerId ? data.timer : t));
        toast.success('Timer paused');
      } else {
        const errorData = await response.json();
        console.log('Pause error response:', errorData);
        toast.error(errorData.error || 'Failed to pause timer');
      }
    } catch (error) {
      console.error('Error pausing timer:', error);
      toast.error('Failed to pause timer');
    }
  };

  const resumeTimer = async (timerId: string) => {
    if (!user) return;

    console.log('Attempting to resume timer:', timerId);
    console.log('User ID:', user.id);

    try {
      const response = await fetch(`/api/timers/${timerId}/resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      console.log('Resume response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Resume response data:', data);
        setTimers(prev => prev.map(t => t.id === timerId ? data.timer : t));
        toast.success('Timer resumed');
      } else {
        const errorData = await response.json();
        console.log('Resume error response:', errorData);
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
        toast.success('Timer completed and time entry created!');
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
        toast.success('Timer canceled');
      } else {
        toast.error('Failed to cancel timer');
      }
    } catch (error) {
      console.error('Error canceling timer:', error);
      toast.error('Failed to cancel timer');
    }
  };

  const deleteSelectedTimers = async () => {
    if (!user || selectedTimers.size === 0) return;

    try {
      const response = await fetch('/api/timers/bulk', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          timerIds: Array.from(selectedTimers),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setTimers(prev => prev.filter(t => !selectedTimers.has(t.id)));
        setSelectedTimers(new Set());
        toast.success(data.message);
      } else {
        toast.error('Failed to delete timers');
      }
    } catch (error) {
      console.error('Error deleting timers:', error);
      toast.error('Failed to delete timers');
    }
  };

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
        setNewProjectName('');
        setNewProjectClient('');
        setShowCreateProject(false);
        toast.success('Project created!');
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
          description: newTaskDescription,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setTasks(prev => [data.task, ...prev]);
        setNewTaskTitle('');
        setNewTaskDescription('');
        setShowCreateTask(false);
        toast.success('Task created!');
      } else {
        toast.error('Failed to create task');
      }
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task');
    }
  };

  const toggleTimerSelection = (timerId: string) => {
    setSelectedTimers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(timerId)) {
        newSet.delete(timerId);
      } else {
        newSet.add(timerId);
      }
      return newSet;
    });
  };

  const filteredTasks = tasks.filter(task => selectedProject && selectedProject !== 'none' && task.projectId === selectedProject);

  if (!user) {
    return null; // Will be handled by the main page
  }

  const runningTimers = timers.filter(t => t.status === 'RUNNING');
  const pausedTimers = timers.filter(t => t.status === 'PAUSED');

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Time Tracker</h1>
            <p className="text-muted-foreground">Welcome back, {user.name || user.email}</p>
          </div>
          <div className="flex items-center gap-4">
            {runningTimers.length > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                {runningTimers.length} Active Timer{runningTimers.length > 1 ? 's' : ''}
              </Badge>
            )}
            <Button variant="outline" asChild>
              <a href="/timesheet">Timesheet</a>
            </Button>
            <Button variant="outline" onClick={logout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Quick Timer Creation */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Quick Timer
            </CardTitle>
            <CardDescription>
              Start a new timer quickly or assign it to a project/task
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Project</Label>
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
                  <Dialog open={showCreateProject} onOpenChange={setShowCreateProject}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="icon">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create Project</DialogTitle>
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
                          <Button onClick={createProject}>
                            Create
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Task</Label>
                <div className="flex gap-2">
                  <Select value={selectedTask} onValueChange={setSelectedTask} disabled={!selectedProject}>
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
                  <Dialog open={showCreateTask} onOpenChange={setShowCreateTask}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="icon" disabled={!selectedProject}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create Task</DialogTitle>
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
                        <div>
                          <Label htmlFor="taskDescription">Description (Optional)</Label>
                          <Textarea
                            id="taskDescription"
                            value={newTaskDescription}
                            onChange={(e) => setNewTaskDescription(e.target.value)}
                            placeholder="Enter task description"
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setShowCreateTask(false)}>
                            Cancel
                          </Button>
                          <Button onClick={createTask}>
                            Create
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timerNote">Note (Optional)</Label>
                <Input
                  id="timerNote"
                  value={newTimerNote}
                  onChange={(e) => setNewTimerNote(e.target.value)}
                  placeholder="What are you working on?"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="billable"
                    checked={newTimerBillable}
                    onCheckedChange={setNewTimerBillable}
                  />
                  <Label htmlFor="billable">Billable</Label>
                </div>
                <Button 
                  onClick={createTimer} 
                  disabled={isLoading}
                  className="w-full"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Timer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions */}
        {selectedTimers.size > 0 && (
          <Card className="mb-6 border-destructive">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <span className="text-destructive font-medium">
                  {selectedTimers.size} timer{selectedTimers.size > 1 ? 's' : ''} selected
                </span>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Selected
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Selected Timers</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete {selectedTimers.size} timer{selectedTimers.size > 1 ? 's' : ''}.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={deleteSelectedTimers}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Active Timers */}
        {(runningTimers.length > 0 || pausedTimers.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Running Timers */}
            {runningTimers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-600">
                    <Clock className="h-5 w-5" />
                    Running Timers ({runningTimers.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {runningTimers.map(timer => (
                    <div key={timer.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedTimers.has(timer.id)}
                            onChange={() => toggleTimerSelection(timer.id)}
                            className="rounded"
                          />
                          <div className="font-mono text-lg font-semibold text-green-600">
                            {formatDuration(timer.currentElapsedMs)}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => pauseTimer(timer.id)}
                          >
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
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => cancelTimer(timer.id)}
                          >
                            <Square className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-1 text-sm">
                        {timer.project && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Project:</span>
                            <span>{timer.project.name}</span>
                            {timer.project.client && (
                              <span className="text-muted-foreground">({timer.project.client})</span>
                            )}
                          </div>
                        )}
                        {timer.task && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Task:</span>
                            <span>{timer.task.title}</span>
                          </div>
                        )}
                        {timer.note && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Note:</span>
                            <span>{timer.note}</span>
                          </div>
                        )}
                        {timer.billable && (
                          <Badge variant="secondary">Billable</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Paused Timers */}
            {pausedTimers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-yellow-600">
                    <Pause className="h-5 w-5" />
                    Paused Timers ({pausedTimers.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {pausedTimers.map(timer => (
                    <div key={timer.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedTimers.has(timer.id)}
                            onChange={() => toggleTimerSelection(timer.id)}
                            className="rounded"
                          />
                          <div className="font-mono text-lg font-semibold text-yellow-600">
                            {formatDuration(timer.elapsedMs)}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => resumeTimer(timer.id)}
                          >
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
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => cancelTimer(timer.id)}
                          >
                            <Square className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-1 text-sm">
                        {timer.project && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Project:</span>
                            <span>{timer.project.name}</span>
                            {timer.project.client && (
                              <span className="text-muted-foreground">({timer.project.client})</span>
                            )}
                          </div>
                        )}
                        {timer.task && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Task:</span>
                            <span>{timer.task.title}</span>
                          </div>
                        )}
                        {timer.note && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Note:</span>
                            <span>{timer.note}</span>
                          </div>
                        )}
                        {timer.billable && (
                          <Badge variant="secondary">Billable</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Completed/Canceled Timers */}
        <Card>
          <CardHeader>
            <CardTitle>All Timers</CardTitle>
            <CardDescription>
              View and manage all your timers
            </CardDescription>
          </CardHeader>
          <CardContent>
            {timers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No timers yet. Create your first timer above!
              </div>
            ) : (
              <div className="space-y-4">
                {timers.map(timer => (
                  <div key={timer.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedTimers.has(timer.id)}
                          onChange={() => toggleTimerSelection(timer.id)}
                          className="rounded"
                        />
                        <div className="font-mono text-lg">
                          {formatDuration(timer.currentElapsedMs)}
                        </div>
                        <Badge variant={
                          timer.status === 'RUNNING' ? 'default' :
                          timer.status === 'PAUSED' ? 'secondary' :
                          timer.status === 'COMPLETED' ? 'default' : 'destructive'
                        }>
                          {timer.status}
                        </Badge>
                      </div>
                      
                      <div className="flex gap-2">
                        {timer.status === 'RUNNING' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => pauseTimer(timer.id)}
                          >
                            <Pause className="h-4 w-4" />
                          </Button>
                        )}
                        {timer.status === 'PAUSED' && (
                          <Button
                            size="sm"
                            onClick={() => resumeTimer(timer.id)}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                        {(timer.status === 'RUNNING' || timer.status === 'PAUSED') && (
                          <>
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
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => cancelTimer(timer.id)}
                            >
                              <Square className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-1 text-sm">
                      {timer.project && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Project:</span>
                          <span>{timer.project.name}</span>
                          {timer.project.client && (
                            <span className="text-muted-foreground">({timer.project.client})</span>
                          )}
                        </div>
                      )}
                      {timer.task && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Task:</span>
                          <span>{timer.task.title}</span>
                        </div>
                      )}
                      {timer.note && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Note:</span>
                          <span>{timer.note}</span>
                        </div>
                      )}
                      {timer.billable && (
                        <Badge variant="secondary">Billable</Badge>
                      )}
                      <div className="text-xs text-muted-foreground">
                        Started: {new Date(timer.startedAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Complete Timer Dialog */}
      <Dialog open={completeDialog.open} onOpenChange={(open) => setCompleteDialog({ open, timerId: '' })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Timer</DialogTitle>
            <DialogDescription>
              Add a final description and create a time entry
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="completeDescription">Description</Label>
              <Textarea
                id="completeDescription"
                value={completeDescription}
                onChange={(e) => setCompleteDescription(e.target.value)}
                placeholder="Add a description for this time entry..."
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCompleteDialog({ open: false, timerId: '' })}>
                Cancel
              </Button>
              <Button onClick={() => completeTimer(completeDialog.timerId)}>
                Complete Timer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}