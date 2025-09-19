import { BaseRepository } from './base/BaseRepository';
import { User, Prisma } from '@prisma/client';
import { FilterOptions, PaginationOptions } from '../services/base/IService';
import { db } from '@/lib/db';

export interface UserFilters extends FilterOptions {
  email?: string;
  name?: string;
  isActive?: boolean;
}

export interface UserWithStats {
  id: string;
  email: string;
  name: string | null;
  clerkId: string | null;
  totalXP: number;
  level: number;
  preferences: any;
  isActive: boolean;
  lastActiveAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    projects: number;
    tasks: number;
    timers: number;
  };
  totalTime?: number;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  clerkId: string | null;
  totalXP: number;
  level: number;
  preferences: any;
  isActive: boolean;
  lastActiveAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    projects: number;
    tasks: number;
    timers: number;
  };
  totalTime?: number;
  completedTasks?: number;
  activeProjects?: number;
}

export class UserRepository extends BaseRepository<User, Prisma.UserCreateInput, Prisma.UserUpdateInput> {
  readonly repositoryName = 'UserRepository';
  protected readonly model = db.user;
  protected readonly db = db;

  constructor() {
    super();
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      return await this.db.user.findUnique({
        where: { email }
      });
    } catch (error) {
      this.handleError('findByEmail', error);
      throw error;
    }
  }

  async findByClerkId(clerkId: string): Promise<User | null> {
    try {
      return await this.db.user.findUnique({
        where: { clerkId }
      });
    } catch (error) {
      this.handleError('findByClerkId', error);
      throw error;
    }
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const user = await this.db.user.findUnique({
        where: { id: userId },
        include: {
          _count: {
            select: {
              projects: true,
              tasks: true,
              timers: true
            }
          },
          projects: {
            select: {
              archived: true
            }
          },
          tasks: {
            select: {
              completed: true
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

      if (!user) return null;

      // Calculate total time
      const totalTime = user.timers.reduce((total, timer) => {
        if (timer.elapsedTime) {
          return total + timer.elapsedTime;
        }
        if (timer.startTime && timer.endTime) {
          return total + (timer.endTime.getTime() - timer.startTime.getTime());
        }
        return total;
      }, 0);

      // Calculate completed tasks
      const completedTasks = user.tasks.filter(task => task.completed).length;

      // Calculate active projects
      const activeProjects = user.projects.filter(project => !project.archived).length;

      // Remove sensitive data and computed fields
      const { hashedPassword, projects, tasks, timers, ...userProfile } = user;

      return {
        ...userProfile,
        totalXP: user.totalXP || 0,
        totalTime,
        completedTasks,
        activeProjects
      };
    } catch (error) {
      this.handleError('getUserProfile', error);
      throw error;
    }
  }

  async getUserStats(userId: string): Promise<{
    totalTime: number;
    totalXP: number;
    projectCount: number;
    taskCount: number;
    timerCount: number;
    completedTasks: number;
    activeProjects: number;
    averageSessionTime: number;
  } | null> {
    try {
      const user = await this.db.user.findUnique({
        where: { id: userId },
        include: {
          _count: {
            select: {
              projects: true,
              tasks: true,
              timers: true
            }
          },
          projects: {
            select: {
              archived: true
            }
          },
          tasks: {
            select: {
              completed: true
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

      if (!user) return null;

      // Calculate total time
      const totalTime = user.timers.reduce((total, timer) => {
        if (timer.elapsedTime) {
          return total + timer.elapsedTime;
        }
        if (timer.startTime && timer.endTime) {
          return total + (timer.endTime.getTime() - timer.startTime.getTime());
        }
        return total;
      }, 0);

      // Calculate completed tasks
      const completedTasks = user.tasks.filter(task => task.completed).length;

      // Calculate active projects
      const activeProjects = user.projects.filter(project => !project.archived).length;

      // Calculate average session time
      const completedTimers = user.timers.filter(timer => 
        timer.elapsedTime || (timer.startTime && timer.endTime)
      );
      const averageSessionTime = completedTimers.length > 0 
        ? totalTime / completedTimers.length 
        : 0;

      return {
        totalTime,
        totalXP: user.totalXP || 0,
        projectCount: user._count.projects,
        taskCount: user._count.tasks,
        timerCount: user._count.timers,
        completedTasks,
        activeProjects,
        averageSessionTime
      };
    } catch (error) {
      this.handleError('getUserStats', error);
      throw error;
    }
  }

  async updateXP(userId: string, xpAmount: number): Promise<User | null> {
    try {
      return await this.db.user.update({
        where: { id: userId },
        data: {
          totalXP: {
            increment: xpAmount
          }
        }
      });
    } catch (error) {
      this.handleError('updateXP', error);
      throw error;
    }
  }

  async updateLevel(userId: string, level: number): Promise<User | null> {
    try {
      return await this.db.user.update({
        where: { id: userId },
        data: { level }
      });
    } catch (error) {
      this.handleError('updateLevel', error);
      throw error;
    }
  }

  async updatePreferences(
    userId: string,
    preferences: Record<string, any>
  ): Promise<User | null> {
    try {
      return await this.db.user.update({
        where: { id: userId },
        data: {
          preferences: preferences
        }
      });
    } catch (error) {
      this.handleError('updatePreferences', error);
      throw error;
    }
  }

  async updateLastActiveAt(userId: string): Promise<User | null> {
    try {
      return await this.db.user.update({
        where: { id: userId },
        data: {
          lastActiveAt: new Date()
        }
      });
    } catch (error) {
      this.handleError('updateLastActiveAt', error);
      throw error;
    }
  }

  async deactivateUser(userId: string): Promise<User | null> {
    try {
      return await this.db.user.update({
        where: { id: userId },
        data: {
          isActive: false
        }
      });
    } catch (error) {
      this.handleError('deactivateUser', error);
      throw error;
    }
  }

  async activateUser(userId: string): Promise<User | null> {
    try {
      return await this.db.user.update({
        where: { id: userId },
        data: {
          isActive: true
        }
      });
    } catch (error) {
      this.handleError('activateUser', error);
      throw error;
    }
  }

  async getUsersWithFilters(
    filters: UserFilters = {},
    pagination?: PaginationOptions
  ): Promise<UserProfile[]> {
    try {
      const where: Prisma.UserWhereInput = {};
      
      if (filters.email) {
        where.email = {
          contains: filters.email
        };
      }
      
      if (filters.name) {
        where.name = {
          contains: filters.name
        };
      }
      
      if (typeof filters.isActive === 'boolean') {
        where.isActive = filters.isActive;
      }

      const users = await this.db.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          clerkId: true,
          totalXP: true,
          level: true,
          preferences: true,
          isActive: true,
          lastActiveAt: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              projects: true,
              tasks: true,
              timers: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        ...(pagination && pagination.page && pagination.limit && {
          skip: (pagination.page - 1) * pagination.limit,
          take: pagination.limit
        })
      });

      return users;
    } catch (error) {
      this.handleError('getUsersWithFilters', error);
      throw error;
    }
  }

  async searchUsers(query: string, pagination?: PaginationOptions): Promise<UserProfile[]> {
    try {
      return await this.getUsersWithFilters(
        {
          name: query
        },
        pagination
      );
    } catch (error) {
      this.handleError('searchUsers', error);
      throw error;
    }
  }
}