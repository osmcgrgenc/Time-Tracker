export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface Project {
  id: string;
  name: string;
  client?: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status?: string;
  assigneeId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Timer {
  id: string;
  userId: string;
  projectId?: string;
  project?: {
    id: string;
    name: string;
    client?: string;
  };
  taskId?: string;
  task?: {
    id: string;
    title: string;
    status?: string;
  };
  note?: string;
  billable: boolean;
  status: 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'CANCELED';
  startedAt: Date;
  pausedAt?: Date;
  totalPausedMs: number;
  elapsedMs: number;
  currentElapsedMs?: number;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TimeEntry {
  id: string;
  userId: string;
  projectId?: string;
  project?: {
    id: string;
    name: string;
    client?: string;
  };
  taskId?: string;
  task?: {
    id: string;
    title: string;
    status?: string;
  };
  date: Date;
  description?: string;
  billable: boolean;
  minutes: number;
  sourceTimer?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserStats {
  level: number;
  xp: number;
  xpToNext: number;
  streak: number;
  totalHours: number;
  completedTasks: number;
  achievements: string[];
}

export interface DashboardTimer {
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

export type XPAction = 'TIMER_STARTED' | 'TIMER_COMPLETED' | 'TIMER_CANCELLED' | 'STREAK_BONUS' | 'LEVEL_UP' | 'DAILY_GOAL';

export interface XPHistory {
  id: string;
  userId: string;
  action: XPAction;
  xpEarned: number;
  description?: string;
  timerId?: string;
  timer?: {
    note?: string;
    project?: {
      name: string;
    };
    task?: {
      title: string;
    };
  };
  metadata?: string;
  createdAt: Date;
}
