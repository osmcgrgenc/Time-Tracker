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
import { Download, Filter, RotateCcw, Clock, Target } from 'lucide-react';
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

export default function TimesheetContent() {
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
        toast.success('📊 Excel file downloaded!');
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
    <div className="space-y-8">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Timesheet</h2>
          <p className="text-gray-600">View and export your time entries</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={fetchData} disabled={isLoading} variant="outline" className="text-sm">
            <RotateCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button 
            onClick={exportToExcel} 
            disabled={isLoading || timeEntries.length === 0}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-sm"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Time</p>
                  <p className="text-3xl font-bold">{formatDuration(summary.totalMinutes)}</p>
                </div>
                <Clock className="h-8 w-8 text-blue-200" />
              </div>
              <p className="text-xs text-blue-100 mt-4">
                {summary.totalEntries} entries
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Billable Time</p>
                  <p className="text-3xl font-bold">{formatDuration(summary.billableMinutes)}</p>
                </div>
                <Badge className="h-8 w-8 text-green-200 bg-green-400 rounded-full flex items-center justify-center">$</Badge>
              </div>
              <p className="text-xs text-green-100 mt-4">
                {Math.round((summary.billableMinutes / summary.totalMinutes) * 100)}% of total
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Projects</p>
                  <p className="text-3xl font-bold">{summary.projectSummary.length}</p>
                </div>
                <Target className="h-8 w-8 text-purple-200" />
              </div>
              <p className="text-xs text-purple-100 mt-4">
                Active projects
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Non-billable</p>
                  <p className="text-3xl font-bold">{formatDuration(summary.totalMinutes - summary.billableMinutes)}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-200" />
              </div>
              <p className="text-xs text-orange-100 mt-4">
                Internal time
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <Filter className="h-5 w-5 text-blue-600" />
            Filters
          </CardTitle>
          <CardDescription className="text-gray-600">
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
            <Button 
              variant="outline" 
              onClick={clearFilters}
              className="hover:bg-blue-50 hover:border-blue-300 transition-colors"
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedEntries.size > 0 && (
        <Card className="border-red-200 bg-red-50 shadow-lg">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <span className="text-red-700 font-medium flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                {selectedEntries.size} entr{selectedEntries.size > 1 ? 'ies' : 'y'} selected
              </span>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={deleteSelectedEntries}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete Selected
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Time Entries Table */}
      <Card className="shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
          <CardTitle className="text-gray-800">Time Entries</CardTitle>
          <CardDescription className="text-gray-600">
            {timeEntries.length} entr{timeEntries.length !== 1 ? 'ies' : 'y'} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : timeEntries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
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
                    <TableRow key={entry.id} className="hover:bg-gray-50">
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
                          <div className="text-xs text-gray-500">
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
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
            <CardTitle className="text-gray-800 flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-600" />
              Project Summary
            </CardTitle>
            <CardDescription className="text-gray-600">
              Time breakdown by project
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {summary.projectSummary.map((project) => (
                <div key={project.projectId} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md hover:border-gray-300 transition-all duration-300 bg-white">
                  <div>
                    <div className="font-medium text-gray-900">{project.projectName}</div>
                    <div className="text-sm text-gray-500">
                      {project.entryCount} entr{project.entryCount !== 1 ? 'ies' : 'y'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">{formatDuration(project.totalMinutes)}</div>
                    <div className="text-sm text-green-600 font-medium">
                      {formatDuration(project.billableMinutes)} billable
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}