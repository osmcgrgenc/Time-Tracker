'use client';

import { useState, useEffect } from 'react';
import { TimeEntry } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, Download, Trash2, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface TimesheetTableProps {
  userId: string;
  projects: Array<{ id: string; name: string }>;
  tasks: Array<{ id: string; title: string; projectId: string }>;
}

export function TimesheetTable({ userId, projects, tasks }: TimesheetTableProps) {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    from: '',
    to: '',
    projectId: '',
    taskId: '',
    billable: '',
  });
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    loadTimeEntries();
  }, [filters]);

  const loadTimeEntries = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ userId: userId });
      if (filters.from) params.append('from', filters.from);
      if (filters.to) params.append('to', filters.to);
      if (filters.projectId) params.append('projectId', filters.projectId);
      if (filters.taskId) params.append('taskId', filters.taskId);
      if (filters.billable) params.append('billable', filters.billable);

      const response = await fetch(`/api/time-entries?${params}`);
      if (response.ok) {
        const data = await response.json();
        setTimeEntries(data.timeEntries);
        setSummary(data.summary);
      }
    } catch (error) {
      console.error('Load time entries error:', error);
    }
    setLoading(false);
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/export/xlsx', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          from: filters.from || undefined,
          to: filters.to || undefined,
          projectId: filters.projectId || undefined,
          taskId: filters.taskId || undefined,
          billable: filters.billable ? filters.billable === 'true' : undefined,
          groupBy: ['project', 'task'],
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = response.headers.get('Content-Disposition')?.split('filename=')[1] || 'timesheet.xlsx';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Timesheet exported successfully');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export timesheet');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedEntries.length === 0) return;

    try {
      const response = await fetch('/api/time-entries/bulk', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          timeEntryIds: selectedEntries,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        setSelectedEntries([]);
        loadTimeEntries();
      }
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast.error('Failed to delete time entries');
    }
  };

  const handleEntrySelect = (entryId: string, checked: boolean) => {
    if (checked) {
      setSelectedEntries([...selectedEntries, entryId]);
    } else {
      setSelectedEntries(selectedEntries.filter(id => id !== entryId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedEntries(timeEntries.map(entry => entry.id));
    } else {
      setSelectedEntries([]);
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const filteredTasks = tasks.filter(task => task.projectId === filters.projectId);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">From Date</label>
              <Input
                type="date"
                value={filters.from}
                onChange={(e) => setFilters({ ...filters, from: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">To Date</label>
              <Input
                type="date"
                value={filters.to}
                onChange={(e) => setFilters({ ...filters, to: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Project</label>
              <Select value={filters.projectId} onValueChange={(value) => setFilters({ ...filters, projectId: value, taskId: '' })}>
                <SelectTrigger>
                  <SelectValue placeholder="All projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All projects</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Task</label>
              <Select value={filters.taskId} onValueChange={(value) => setFilters({ ...filters, taskId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All tasks" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All tasks</SelectItem>
                  {filteredTasks.map((task) => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Billable</label>
              <Select value={filters.billable} onValueChange={(value) => setFilters({ ...filters, billable: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All</SelectItem>
                  <SelectItem value="true">Billable</SelectItem>
                  <SelectItem value="false">Non-billable</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatDuration(summary.totalMinutes)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Billable Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatDuration(summary.billableMinutes)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalEntries}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.projectSummary?.length || 0}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={loadTimeEntries}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
        </div>
        <div className="flex items-center space-x-4">
          {selectedEntries.length > 0 && (
            <Button variant="destructive" onClick={handleBulkDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete ({selectedEntries.length})
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedEntries.length === timeEntries.length && timeEntries.length > 0}
                    onCheckedChange={handleSelectAll}
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
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  </TableCell>
                </TableRow>
              ) : timeEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="text-muted-foreground">No time entries found</div>
                  </TableCell>
                </TableRow>
              ) : (
                timeEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedEntries.includes(entry.id)}
                        onCheckedChange={(checked) => handleEntrySelect(entry.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell>{format(new Date(entry.date), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>{entry.project?.name || '-'}</TableCell>
                    <TableCell>{entry.task?.title || '-'}</TableCell>
                    <TableCell className="max-w-xs truncate">{entry.description || '-'}</TableCell>
                    <TableCell>{formatDuration(entry.minutes)}</TableCell>
                    <TableCell>
                      {entry.billable ? (
                        <Badge variant="default">Yes</Badge>
                      ) : (
                        <Badge variant="secondary">No</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Project Summary */}
      {summary?.projectSummary && summary.projectSummary.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Project Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {summary.projectSummary.map((project: any) => (
                <div key={project.projectId} className="flex items-center justify-between p-2 bg-muted rounded">
                  <div>
                    <span className="font-medium">{project.projectName}</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      ({project.entryCount} entries)
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatDuration(project.totalMinutes)}</div>
                    <div className="text-sm text-green-600">
                      Billable: {formatDuration(project.billableMinutes)}
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