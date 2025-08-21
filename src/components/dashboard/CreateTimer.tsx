'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Play, Plus } from 'lucide-react';

interface CreateTimerProps {
  onCreate: () => void;
  projects: Array<{ id: string; name: string }>;
  tasks: Array<{ id: string; title: string; projectId: string }>;
  userId: string;
}

export function CreateTimer({ onCreate, projects, tasks, userId }: CreateTimerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [formData, setFormData] = useState({
    note: '',
    projectId: '',
    taskId: '',
    billable: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/timers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          userId,
        }),
      });

      if (response.ok) {
        setFormData({
          note: '',
          projectId: '',
          taskId: '',
          billable: false,
        });
        setIsExpanded(false);
        onCreate();
      }
    } catch (error) {
      console.error('Create timer error:', error);
    }
  };

  const filteredTasks = tasks.filter(task => task.projectId === formData.projectId);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center space-x-2">
            <Plus className="h-5 w-5" />
            <span>New Timer</span>
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Cancel' : 'Quick Start'}
          </Button>
        </CardTitle>
      </CardHeader>
      
      {isExpanded && (
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="quick-note">Quick Note</Label>
              <Textarea
                id="quick-note"
                placeholder="What are you working on?"
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                className="h-20"
              />
            </div>
            
            <div>
              <Label htmlFor="quick-project">Project (Optional)</Label>
              <Select value={formData.projectId} onValueChange={(value) => setFormData({ ...formData, projectId: value, taskId: '' })}>
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
            
            {formData.projectId && (
              <div>
                <Label htmlFor="quick-task">Task (Optional)</Label>
                <Select value={formData.taskId} onValueChange={(value) => setFormData({ ...formData, taskId: value })}>
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
                id="quick-billable"
                checked={formData.billable}
                onCheckedChange={(checked) => setFormData({ ...formData, billable: checked })}
              />
              <Label htmlFor="quick-billable">Billable</Label>
            </div>
            
            <Button type="submit" className="w-full">
              <Play className="h-4 w-4 mr-2" />
              Start Timer
            </Button>
          </form>
        </CardContent>
      )}
    </Card>
  );
}