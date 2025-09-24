import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardTimer, UserStats, Project, Task, XPAction } from '@/types';
import { toast } from 'sonner';

export function useTimers() {
  const { user } = useAuth();
  const [timers, setTimers] = useState<DashboardTimer[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userStats, setUserStats] = useState<UserStats>({
    level: 1,
    xp: 0,
    xpToNext: 100,
    streak: 0,
    totalHours: 0,
    completedTasks: 0,
    achievements: []
  });

  // Memoized calculations
  const runningTimers = useMemo(() => Array.isArray(timers) ? timers.filter(t => t.status === 'RUNNING') : [], [timers]);
  const pausedTimers = useMemo(() => Array.isArray(timers) ? timers.filter(t => t.status === 'PAUSED') : [], [timers]);
  const completedToday = useMemo(() => {
    if (!Array.isArray(timers)) return 0;
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
        const timerList = Array.isArray(timersData?.data?.timers)
          ? timersData.data.timers
          : Array.isArray(timersData?.timers)
            ? timersData.timers
            : [];

        setTimers(timerList);

        // Calculate user stats from normalized timer list
        const totalMs = timerList.reduce((acc: number, timer: DashboardTimer) => acc + timer.elapsedMs, 0);
        const totalHours = Math.floor(totalMs / 3600000);
        const completedTasks = timerList.filter((t: DashboardTimer) => t.status === 'COMPLETED').length;
        setUserStats(prev => ({
          ...prev,
          totalHours,
          completedTasks,
          xp: completedTasks * 10 + totalHours * 5,
          level: Math.floor((completedTasks * 10 + totalHours * 5) / 100) + 1
        }));
      }

      if (projectsRes.ok) {
        const projectsData = await projectsRes.json();
        const projectList = Array.isArray(projectsData?.data)
          ? projectsData.data
          : Array.isArray(projectsData?.projects)
            ? projectsData.projects
            : [];

        setProjects(projectList);
      }

      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        const taskList = Array.isArray(tasksData?.data)
          ? tasksData.data
          : Array.isArray(tasksData?.tasks)
            ? tasksData.tasks
            : [];

        setTasks(taskList);
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

  const createTimer = async (data: {
    projectId?: string;
    taskId?: string;
    note?: string;
    billable?: boolean;
  }) => {
    if (!user) return false;

    setIsLoading(true);
    try {
      const response = await fetch('/api/timers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          ...data,
        }),
      });

      if (response.ok) {
        const responseData = await response.json();
        const timer = responseData?.data?.timer ?? responseData?.timer ?? null;

        if (!timer) {
          throw new Error('Timer oluşturulamadı: Geçersiz yanıt');
        }

        // Add null checks for timer properties
        if (!timer.status || typeof timer.elapsedMs === 'undefined') {
          throw new Error('Timer verisi eksik: Status veya elapsedMs bulunamadı');
        }

        setTimers(prev => [timer, ...prev]);
        setUserStats(prev => ({ ...prev, xp: prev.xp + 5 }));

        // Save XP history
        await saveXPHistory(
          'TIMER_STARTED',
          5,
          'Timer başlatıldı',
          timer.id,
          { projectId: data.projectId, taskId: data.taskId }
        );

        toast.success('🚀 Timer başlatıldı! +5 XP kazandınız');
        return true;
      } else {
        toast.error('Timer oluşturulamadı');
        return false;
      }
    } catch (error) {
      console.error('Error creating timer:', error);
      toast.error('Timer oluşturulamadı');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const pauseTimer = async (timerId: string) => {
    if (!user) return false;

    try {
      const response = await fetch(`/api/timers/${timerId}/pause`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      if (response.ok) {
        const data = await response.json();
        const updatedTimer = data?.data?.timer ?? data?.timer ?? data ?? null;

        if (!updatedTimer?.id) {
          toast.error('Unexpected pause timer response');
          return false;
        }

        setTimers(prev => prev.map(t => t.id === timerId ? updatedTimer : t));
        toast.success('⏸️ Timer duraklatıldı');
        return true;
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Timer duraklatılamadı');
        return false;
      }
    } catch (error) {
      console.error('Error pausing timer:', error);
      toast.error('Timer duraklatılamadı');
      return false;
    }
  };

  const resumeTimer = async (timerId: string) => {
    if (!user) return false;

    try {
      const response = await fetch(`/api/timers/${timerId}/resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      if (response.ok) {
        const data = await response.json();
        const updatedTimer = data?.data?.timer ?? data?.timer ?? data ?? null;

        if (!updatedTimer?.id) {
          toast.error('Unexpected resume timer response');
          return false;
        }

        setTimers(prev => prev.map(t => t.id === timerId ? updatedTimer : t));
        toast.success('▶️ Timer devam ettirildi');
        return true;
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Timer devam ettirilemedi');
        return false;
      }
    } catch (error) {
      console.error('Error resuming timer:', error);
      toast.error('Timer devam ettirilemedi');
      return false;
    }
  };

  const completeTimer = async (timerId: string, description?: string) => {
    if (!user) return false;

    try {
      const response = await fetch(`/api/timers/${timerId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          description,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const updatedTimer = data?.data?.timer ?? data?.timer ?? null;

        if (!updatedTimer?.id) {
          toast.error('Unexpected complete timer response');
          return false;
        }

        setTimers(prev => prev.map(t => t.id === timerId ? updatedTimer : t));

        // Gamification rewards
        const xpGain = 15;
        setUserStats(prev => ({
          ...prev,
          xp: prev.xp + xpGain,
          completedTasks: prev.completedTasks + 1
        }));

        // Save XP history
        await saveXPHistory(
          'TIMER_COMPLETED',
          xpGain,
          'Timer tamamlandı',
          timerId,
          { description, completedAt: new Date().toISOString() }
        );

        toast.success(`🏆 Timer tamamlandı! +${xpGain} XP kazandınız`);
        return true;
      } else {
        toast.error('Timer tamamlanamadı');
        return false;
      }
    } catch (error) {
      console.error('Error completing timer:', error);
      toast.error('Timer tamamlanamadı');
      return false;
    }
  };

  const cancelTimer = async (timerId: string) => {
    if (!user) return false;

    try {
      const response = await fetch(`/api/timers/${timerId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      if (response.ok) {
        const data = await response.json();
        const updatedTimer = data?.data?.timer ?? data?.timer ?? null;

        if (!updatedTimer?.id) {
          toast.error('Unexpected cancel timer response');
          return false;
        }

        setTimers(prev => prev.map(t => t.id === timerId ? updatedTimer : t));
        toast.success('❌ Timer iptal edildi');
        return true;
      } else {
        toast.error('Timer iptal edilemedi');
        return false;
      }
    } catch (error) {
      console.error('Error canceling timer:', error);
      toast.error('Timer iptal edilemedi');
      return false;
    }
  };

  const formatDuration = (ms: number) => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Save XP history
  const saveXPHistory = async (
    action: XPAction,
    xpEarned: number,
    description?: string,
    timerId?: string,
    metadata?: Record<string, any>
  ) => {
    if (!user) return;

    try {
      await fetch('/api/xp-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          action,
          xpEarned,
          description,
          timerId,
          metadata: metadata ? JSON.stringify(metadata) : undefined,
        }),
      });
    } catch (error) {
      console.error('Error saving XP history:', error);
      // Don't show error to user as this is not critical
    }
  };

  const getXPProgress = () => {
    const currentLevelXP = (userStats.level - 1) * 100;
    const progress = ((userStats.xp - currentLevelXP) / 100) * 100;
    return Math.min(progress, 100);
  };

  return {
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
    refetch: fetchData,
  };
}
