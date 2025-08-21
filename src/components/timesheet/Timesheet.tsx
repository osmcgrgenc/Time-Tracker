'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, Download, Filter, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

interface TimeEntry {
  id: string;
  date: string;
  description?: string;
  minutes: number;
  billable: boolean;
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
  createdAt: string;
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

interface Summary {
  totalMinutes: number;
  billableMinutes: number;
  totalEntries: number;
  projectSummary: Array<{
    projectId: string;
    projectName: string;
    totalMinutes: number;
    billableMinutes: number;
    entryCount: number;
  }>;
  taskSummary: Array<{
    taskId: string;
    taskTitle: string;
    totalMinutes: number;
    billableMinutes: number;
    entryCount: number;
  }>;
}

export default function Timesheet() {
  const { user } = useAuth();
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());
  
  // Filter states
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedProject, setSelectedProject] = useState('all');
  const [selectedTask, setSelectedTask] = useState('all');
  const [billableFilter, setBillableFilter] = useState('all');

  // Set default date range (last 30 days)
  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    setFromDate(thirtyDaysAgo.toISOString().split('T')[0]);
    setToDate(today.toISOString().split('T')[0]);
  }, []);

  const fetchData = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const [entriesRes, projectsRes, tasksRes] = await Promise.all([
        fetch(`/api/time-entries?userId=${user.id}&from=${fromDate}&to=${toDate}&projectId=${selectedProject !== 'all' ? selectedProject : ''}&taskId=${selectedTask !== 'all' ? selectedTask : ''}&billable=${billableFilter !== 'all' ? billableFilter : ''}`),
        fetch(`/api/projects?userId=${user.id}`),
        fetch(`/api/tasks?userId=${user.id}`),
      ]);

      if (entriesRes.ok) {
        const data = await entriesRes.json();
        setTimeEntries(data.timeEntries);
        setSummary(data.summary);
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
    setIsLoading(false);
  };

  useEffect(() => {
    if (user && fromDate && toDate) {
      fetchData();
    }
  }, [user, fromDate, toDate, selectedProject, selectedTask, billableFilter]);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const exportToExcel = async () => {
    if (!user) return;

    try {
      const response = await fetch('/api/export/xlsx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          from: fromDate,
          to: toDate,
          projectId: selectedProject !== 'all' ? selectedProject : undefined,
          taskId: selectedTask !== 'all' ? selectedTask : undefined,
          billable: billableFilter !== 'all' ? billableFilter === 'true' : undefined,
          groupBy: ['date', 'project', 'task'],
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `timesheet-${fromDate}-to-${toDate}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Excel file downloaded successfully!');
      } else {
        toast.error('Failed to export data');
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data');
    }
  };

  const clearFilters = () => {
    setSelectedProject('all');
    setSelectedTask('all');
    setBillableFilter('all');
  };

  const filteredTasks = tasks.filter(task => selectedProject && selectedProject !== 'all' && task.projectId === selectedProject);

  const toggleEntrySelection = (entryId: string) => {
    setSelectedEntries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(entryId)) {
        newSet.delete(entryId);
      } else {
        newSet.add(entryId);
      }
      return newSet;
    });
  };

  const deleteSelectedEntries = async () => {
    if (!user || selectedEntries.size === 0) return;

    try {
      const response = await fetch('/api/time-entries/bulk', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          timeEntryIds: Array.from(selectedEntries),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        fetchData();
        setSelectedEntries(new Set());
        toast.success(data.message);
      } else {
        toast.error('Failed to delete time entries');
      }
    } catch (error) {
      console.error('Error deleting time entries:', error);
      toast.error('Failed to delete time entries');
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Timesheet</h1>
              <p className="text-muted-foreground">View and export your time entries</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <a href="/">Dashboard</a>
              </Button>
              <Button onClick={fetchData} disabled={isLoading} variant="outline">
                <RotateCcw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={exportToExcel} disabled={isLoading || timeEntries.length === 0}>
                <Download className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatDuration(summary.totalMinutes)}</div>
                <p className="text-xs text-muted-foreground">
                  {summary.totalEntries} entries
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Billable Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatDuration(summary.billableMinutes)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {Math.round((summary.billableMinutes / summary.totalMinutes) * 100)}% of total
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Projects</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.projectSummary.length}</div>
                <p className="text-xs text-muted-foreground">
                  Active projects
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Non-billable</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {formatDuration(summary.totalMinutes - summary.billableMinutes)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Internal time
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
            <CardDescription>
              Filter your time entries by date, project, task, or billable status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label>From Date</Label>
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label>To Date</Label>
                <Input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Project</Label>
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger>
                    <SelectValue placeholder="All projects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All projects</SelectItem>
                    {projects.map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Task</Label>
                <Select value={selectedTask} onValueChange={setSelectedTask} disabled={!selectedProject}>
                  <SelectTrigger>
                    <SelectValue placeholder="All tasks" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All tasks</SelectItem>
                    {filteredTasks.map(task => (
                      <SelectItem key={task.id} value={task.id}>
                        {task.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Billable</Label>
                <Select value={billableFilter} onValueChange={setBillableFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="true">Billable only</SelectItem>
                    <SelectItem value="false">Non-billable only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions */}
        {selectedEntries.size > 0 && (
          <Card className="mb-6 border-destructive">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <span className="text-destructive font-medium">
                  {selectedEntries.size} entr{selectedEntries.size > 1 ? 'ies' : 'y'} selected
                </span>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={deleteSelectedEntries}
                >
                  Delete Selected
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Time Entries Table */}
        <Card>
          <CardHeader>
            <CardTitle>Time Entries</CardTitle>
            <CardDescription>
              {timeEntries.length} entr{timeEntries.length !== 1 ? 'ies' : 'y'} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : timeEntries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No time entries found for the selected filters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <input
                          type="checkbox"
                          checked={selectedEntries.size === timeEntries.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedEntries(new Set(timeEntries.map(e => e.id)));
                            } else {
                              setSelectedEntries(new Set());
                            }
                          }}
                          className="rounded"
                        />
                      </TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Task</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Billable</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {timeEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedEntries.has(entry.id)}
                            onChange={() => toggleEntrySelection(entry.id)}
                            className="rounded"
                          />
                        </TableCell>
                        <TableCell>
                          {new Date(entry.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {entry.project?.name || 'Unassigned'}
                          {entry.project?.client && (
                            <div className="text-xs text-muted-foreground">
                              {entry.project.client}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {entry.task?.title || 'Unassigned'}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {entry.description || '-'}
                        </TableCell>
                        <TableCell className="font-mono">
                          {formatDuration(entry.minutes)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={entry.billable ? 'default' : 'secondary'}>
                            {entry.billable ? 'Yes' : 'No'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Project Summary */}
        {summary && summary.projectSummary.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Project Summary</CardTitle>
              <CardDescription>
                Time breakdown by project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {summary.projectSummary.map((project) => (
                  <div key={project.projectId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">{project.projectName}</div>
                      <div className="text-sm text-muted-foreground">
                        {project.entryCount} entr{project.entryCount !== 1 ? 'ies' : 'y'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatDuration(project.totalMinutes)}</div>
                      <div className="text-sm text-green-600">
                        {formatDuration(project.billableMinutes)} billable
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}