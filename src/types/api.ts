export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  details?: any;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

export interface TimerResponse {
  id: string;
  status: 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'CANCELED';
  note?: string;
  billable: boolean;
  startedAt: string;
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

export interface ProjectResponse {
  id: string;
  name: string;
  client?: string;
  ownerId: string;
  createdAt: string;
  tasks?: TaskResponse[];
  _count?: {
    timers: number;
    timeEntries: number;
  };
}

export interface TaskResponse {
  id: string;
  title: string;
  description?: string;
  status?: string;
  projectId: string;
  createdAt: string;
}

export interface UserStatsResponse {
  level: number;
  xp: number;
  totalHours: number;
  completedTasks: number;
  streak: number;
  achievements: string[];
}

export interface XPHistoryResponse {
  id: string;
  action: string;
  xpEarned: number;
  description?: string;
  createdAt: string;
  timer?: {
    note?: string;
    project?: { name: string };
    task?: { title: string };
  };
}