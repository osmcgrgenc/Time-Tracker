import { BaseRepository } from './base/BaseRepository';
import { Task, Prisma } from '@prisma/client';
import { FilterOptions, PaginationOptions } from '@/lib/services/base/IService';
import { db } from '@/lib/db';

export interface TaskFilters extends FilterOptions {
  title?: string;
  completed?: boolean;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  projectId?: string;
  userId?: string;
}

export interface TaskWithProject extends Task {
  project?: {
    id: string;
    name: string;
    color: string | null;
    ownerId: string;
  };
  _count?: {
    timers: number;
  };
  totalTime?: number;
}

export class TaskRepository extends BaseRepository<Task, Prisma.TaskCreateInput, Prisma.TaskUpdateInput> {
  readonly repositoryName = 'TaskRepository';
  protected readonly model = db.task;

  constructor() {
    super();
  }

  async findById(id: string): Promise<TaskWithProject | null> {
    try {
      const task = await this.model.findUnique({
        where: { id },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              color: true,
              ownerId: true
            }
          }
        }
      });
      return task;
    } catch (error) {
      this.handleError('findById', error);
      throw error;
    }
  }

  async findByUserId(
    userId: string,
    filters: TaskFilters = {},
    pagination?: PaginationOptions
  ): Promise<TaskWithProject[]> {
    try {
      const where: Prisma.TaskWhereInput = {
        project: {
          ownerId: userId
        },
        ...(filters.title && {
          title: {
            contains: filters.title,

          }
        }),
        ...(typeof filters.completed === 'boolean' && { completed: filters.completed }),
        ...(filters.priority && { priority: filters.priority }),
        ...(filters.projectId && { projectId: filters.projectId })
      };

      const tasks = await this.model.findMany({
        where,
        include: {
          project: {
            select: {
              id: true,
              name: true,
              color: true,
              ownerId: true
            }
          },
          _count: {
            select: {
              timers: true
            }
          },
          timers: {
            select: {
              startTime: true,
              endTime: true,
              elapsedTime: true
            }
          }
        },
        orderBy: [
          { completed: 'asc' },
          { priority: 'desc' },
          { createdAt: 'desc' }
        ],
        ...(pagination && pagination.page && pagination.limit && {
          skip: (pagination.page - 1) * pagination.limit,
          take: pagination.limit
        })
      });

      // Calculate total time for each task
      return tasks.map(task => {
        const totalTime = task.timers.reduce((total, timer) => {
          if (timer.elapsedTime) {
            return total + timer.elapsedTime;
          }
          if (timer.startTime && timer.endTime) {
            return total + (timer.endTime.getTime() - timer.startTime.getTime());
          }
          return total;
        }, 0);

        const { timers, ...taskData } = task;
        return {
          ...taskData,
          totalTime
        };
      });
    } catch (error) {
      this.handleError('findByUserId', error);
      throw error;
    }
  }

  async findByProjectId(
    projectId: string,
    filters: Omit<TaskFilters, 'projectId'> = {},
    pagination?: PaginationOptions
  ): Promise<TaskWithProject[]> {
    try {
      const where: Prisma.TaskWhereInput = {
        projectId: projectId,
        ...(filters.title && {
          title: {
            contains: filters.title,
            mode: 'insensitive'
          }
        }),
        ...(typeof filters.completed === 'boolean' && { completed: filters.completed }),
        ...(filters.priority && { priority: filters.priority })
      };

      const tasks = await this.model.findMany({
        where,
        include: {
          project: {
            select: {
              id: true,
              name: true,
              color: true,
              ownerId: true
            }
          },
          _count: {
            select: {
              timers: true
            }
          },
          timers: {
            select: {
              startTime: true,
              endTime: true,
              elapsedTime: true
            }
          }
        },
        orderBy: [
          { completed: 'asc' },
          { priority: 'desc' },
          { createdAt: 'desc' }
        ],
        ...(pagination && pagination.page && pagination.limit && {
          skip: (pagination.page - 1) * pagination.limit,
          take: pagination.limit
        })
      });

      // Calculate total time for each task
      return tasks.map(task => {
        const totalTime = task.timers.reduce((total, timer) => {
          if (timer.elapsedTime) {
            return total + timer.elapsedTime;
          }
          if (timer.startTime && timer.endTime) {
            return total + (timer.endTime.getTime() - timer.startTime.getTime());
          }
          return total;
        }, 0);

        const { timers, ...taskData } = task;
        return {
          ...taskData,
          totalTime
        };
      });
    } catch (error) {
      this.handleError('findByProjectId', error);
      throw error;
    }
  }

  async findByUserIdAndTitle(userId: string, title: string): Promise<Task | null> {
    try {
      return await this.model.findFirst({
        where: {
          project: {
            ownerId: userId
          },
          title: {
            equals: title
          }
        }
      });
    } catch (error) {
      this.handleError('findByUserIdAndTitle', error);
      throw error;
    }
  }

  async getTaskStats(userId: string, taskId: string): Promise<{
    totalTime: number;
    timerCount: number;
    completionRate: number;
  } | null> {
    try {
      const task = await this.model.findFirst({
        where: {
          id: taskId,
          project: {
            ownerId: userId
          }
        },
        include: {
          _count: {
            select: {
              timers: true
            }
          },
          timers: {
            select: {
              startTime: true,
              endTime: true,
              elapsedTime: true
            }
          }
        }
      });

      if (!task) return null;

      const totalTime = task.timers.reduce((total, timer) => {
        if (timer.elapsedTime) {
          return total + timer.elapsedTime;
        }
        if (timer.startTime && timer.endTime) {
          return total + (timer.endTime.getTime() - timer.startTime.getTime());
        }
        return total;
      }, 0);

      const completionRate = task.completed ? 100 : 0;

      return {
        totalTime,
        timerCount: task._count.timers,
        completionRate
      };
    } catch (error) {
      this.handleError('getTaskStats', error);
      throw error;
    }
  }

  async markAsCompleted(userId: string, taskId: string): Promise<Task | null> {
    try {
      const task = await this.model.findFirst({
        where: {
          id: taskId,
          project: {
            ownerId: userId
          }
        }
      });
      
      if (!task) return null;
      
      return await this.model.update({
        where: {
          id: taskId
        },
        data: {
          completed: true
        }
      }).then(() => this.findById(taskId));
    } catch (error) {
      this.handleError('markAsCompleted', error);
      throw error;
    }
  }

  async markAsIncomplete(userId: string, taskId: string): Promise<Task | null> {
    try {
      const task = await this.model.findFirst({
        where: {
          id: taskId,
          project: {
            ownerId: userId
          }
        }
      });
      
      if (!task) return null;
      
      return await this.model.update({
        where: {
          id: taskId
        },
        data: {
          completed: false
        }
      }).then(() => this.findById(taskId));
    } catch (error) {
      this.handleError('markAsIncomplete', error);
      throw error;
    }
  }

  async getTasksByPriority(
    userId: string,
    priority: 'LOW' | 'MEDIUM' | 'HIGH',
    pagination?: PaginationOptions
  ): Promise<TaskWithProject[]> {
    try {
      return await this.findByUserId(
        userId,
        { priority },
        pagination
      );
    } catch (error) {
      this.handleError('getTasksByPriority', error);
      throw error;
    }
  }

  async getCompletedTasks(
    userId: string,
    pagination?: PaginationOptions
  ): Promise<TaskWithProject[]> {
    try {
      return await this.findByUserId(
        userId,
        { completed: true },
        pagination
      );
    } catch (error) {
      this.handleError('getCompletedTasks', error);
      throw error;
    }
  }

  async getPendingTasks(
    userId: string,
    pagination?: PaginationOptions
  ): Promise<TaskWithProject[]> {
    try {
      return await this.findByUserId(
        userId,
        { completed: false },
        pagination
      );
    } catch (error) {
      this.handleError('getPendingTasks', error);
      throw error;
    }
  }
}