import { Timer, TimerStatus, Prisma } from '@prisma/client';
import { BaseRepository } from './base/BaseRepository';
import type { FilterOptions, PaginationOptions } from '@/lib/services/base/IService';
import { db } from '@/lib/db';

/**
 * Timer creation data interface
 */
export interface CreateTimerData {
  userId: string;
  projectId?: string;
  taskId?: string;
  description?: string;
  billable?: boolean;
  startTime?: Date;
  status?: TimerStatus;
}

/**
 * Timer update data interface
 */
export interface UpdateTimerData {
  projectId?: string;
  taskId?: string;
  description?: string;
  billable?: boolean;
  status?: TimerStatus;
  pausedAt?: Date;
  totalPausedTime?: number;
  elapsedTime?: number;
  endTime?: Date;
}

/**
 * Timer with relations type
 */
export type TimerWithRelations = Timer & {
  project?: {
    id: string;
    name: string;
    client: string | null;
  } | null;
  task?: {
    id: string;
    title: string;
    completed: boolean;
  } | null;
  user?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
};

/**
 * Timer repository for database operations
 */
export class TimerRepository extends BaseRepository<
  Timer,
  CreateTimerData,
  UpdateTimerData
> {
  readonly repositoryName = 'TimerRepository';
  protected readonly model = db.timer;

  constructor() {
    super();
  }

  /**
   * Find timers by user ID with optional filters
   */
  async findByUserId(
    userId: string,
    filters: {
      status?: TimerStatus;
      projectId?: string;
      taskId?: string;
      startDate?: Date;
      endDate?: Date;
    } = {},
    include?: Prisma.TimerInclude
  ): Promise<TimerWithRelations[]> {
    try {
      this.logOperation('findByUserId', { userId, filters });

      const where: Prisma.TimerWhereInput = {
        userId: userId,
        ...this.buildTimerWhereClause(filters),
      };

      const defaultInclude: Prisma.TimerInclude = {
        project: {
          select: { id: true, name: true, client: true },
        },
        task: {
          select: { id: true, title: true, completed: true },
        },
      };

      const result = await this.model.findMany({
        where,
        include: include || defaultInclude,
        orderBy: { createdAt: 'desc' },
      });

      return result as TimerWithRelations[];
    } catch (error) {
      this.handleError('findByUserId', error);
      throw error;
    }
  }

  /**
   * Find active timer for user
   */
  async findActiveTimer(userId: string): Promise<TimerWithRelations | null> {
    try {
      this.logOperation('findActiveTimer', { userId });

      const result = await this.model.findFirst({
        where: {
          userId: userId,
          endTime: null,
        },
        include: {
          project: {
            select: { id: true, name: true, client: true },
          },
          task: {
            select: { id: true, title: true, completed: true },
          },
        },
        orderBy: { startTime: 'desc' },
      });

      return result as TimerWithRelations | null;
    } catch (error) {
      this.handleError('findActiveTimer', error);
      throw error;
    }
  }

  /**
   * Find timers by project ID
   */
  async findByProjectId(
    projectId: string,
    userId?: string
  ): Promise<TimerWithRelations[]> {
    try {
      this.logOperation('findByProjectId', { projectId, userId });

      const where: Prisma.TimerWhereInput = {
        projectId: projectId,
        ...(userId && { userId: userId }),
      };

      const result = await this.model.findMany({
        where,
        include: {
          project: {
            select: { id: true, name: true, client: true },
          },
          task: {
            select: { id: true, title: true, completed: true },
          },
          user: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { startTime: 'desc' },
      });

      return result as TimerWithRelations[];
    } catch (error) {
      this.handleError('findByProjectId', error);
      throw error;
    }
  }

  /**
   * Find timers by task ID
   */
  async findByTaskId(
    taskId: string,
    userId?: string
  ): Promise<TimerWithRelations[]> {
    try {
      this.logOperation('findByTaskId', { taskId, userId });

      const where: Prisma.TimerWhereInput = {
        taskId: taskId,
        ...(userId && { userId: userId }),
      };

      const result = await this.model.findMany({
        where,
        include: {
          project: {
            select: { id: true, name: true, client: true },
          },
          task: {
            select: { id: true, title: true, completed: true },
          },
          user: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { startTime: 'desc' },
      });

      return result as TimerWithRelations[];
    } catch (error) {
      this.handleError('findByTaskId', error);
      throw error;
    }
  }

  /**
   * Get timer statistics for user
   */
  async getTimerStats(
    userId: string,
    filters: FilterOptions = {}
  ): Promise<{
    totalTime: number;
    totalSessions: number;
    averageSessionTime: number;
    todayTime: number;
    weekTime: number;
    monthTime: number;
  }> {
    try {
      this.logOperation('getTimerStats', { userId, filters });

      const baseWhere = {
        userId: userId,
        endTime: { not: null },
        ...this.buildTimerWhereClause(filters),
      };

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());

      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

      const [totalStats, todayStats, weekStats, monthStats] = await Promise.all([
        this.model.aggregate({
          where: baseWhere,
          _sum: { elapsedTime: true },
          _count: { id: true },
          _avg: { elapsedTime: true },
        }),
        this.model.aggregate({
          where: {
            ...baseWhere,
            startTime: { gte: today },
          },
          _sum: { elapsedTime: true },
        }),
        this.model.aggregate({
          where: {
            ...baseWhere,
            startTime: { gte: weekStart },
          },
          _sum: { elapsedTime: true },
        }),
        this.model.aggregate({
          where: {
            ...baseWhere,
            startTime: { gte: monthStart },
          },
          _sum: { elapsedTime: true },
        }),
      ]);

      return {
        totalTime: totalStats._sum.elapsedTime || 0,
        totalSessions: totalStats._count.id || 0,
        averageSessionTime: totalStats._avg.elapsedTime || 0,
        todayTime: todayStats._sum.elapsedTime || 0,
        weekTime: weekStats._sum.elapsedTime || 0,
        monthTime: monthStats._sum.elapsedTime || 0,
      };
    } catch (error) {
      this.handleError('getTimerStats', error);
      throw error;
    }
  }

  /**
   * Build timer-specific where clause
   */
  private buildTimerWhereClause(filters: {
    status?: TimerStatus;
    projectId?: string;
    taskId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Prisma.TimerWhereInput {
    const where: Prisma.TimerWhereInput = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.taskId) {
      where.taskId = filters.taskId;
    }

    if (filters.projectId) {
      where.task = {
        projectId: filters.projectId,
      };
    }

    if (filters.startDate || filters.endDate) {
      where.startTime = {};
      if (filters.startDate) {
        where.startTime.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.startTime.lte = new Date(filters.endDate);
      }
    }

    return where;
  }

  /**
   * Override buildWhereClause for general filtering
   */
  protected buildWhereClause(filters: FilterOptions): Prisma.TimerWhereInput {
    const where: Prisma.TimerWhereInput = {};

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.projectId) {
      where.task = {
        projectId: filters.projectId,
      };
    }

    if (filters.taskId) {
      where.taskId = filters.taskId;
    }

    if (filters.search) {
      where.OR = [
        {
          project: {
            name: { contains: filters.search },
          },
        },
        {
          task: {
            title: { contains: filters.search },
          },
        },
      ];
    }

    return where;
  }
}