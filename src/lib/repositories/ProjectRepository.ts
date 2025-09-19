import { BaseRepository } from './base/BaseRepository';
import { Project, Prisma } from '@prisma/client';
import { FilterOptions, PaginationOptions } from '../services/base/IService';
import { db } from '@/lib/db';

export interface ProjectFilters extends FilterOptions {
  name?: string;
  color?: string;
  archived?: boolean;
  userId?: string;
}

export interface ProjectWithStats extends Project {
  _count?: {
    timers: number;
    tasks: number;
  };
  totalTime?: number;
}

export class ProjectRepository extends BaseRepository<Project, Prisma.ProjectCreateInput, Prisma.ProjectUpdateInput> {
  readonly repositoryName = 'ProjectRepository';
  protected readonly model = db.project;

  constructor() {
    super();
  }

  async findByUserId(
    userId: string,
    filters: ProjectFilters = {},
    pagination?: PaginationOptions
  ): Promise<ProjectWithStats[]> {
    try {
      const where: Prisma.ProjectWhereInput = {
        ownerId: userId,
        ...(filters.name && {
          name: {
            contains: filters.name
          }
        }),
        ...(filters.color && { color: filters.color }),
        ...(typeof filters.archived === 'boolean' && { archived: filters.archived })
      };

      const projects = await this.model.findMany({
        where,
        include: {
          _count: {
            select: {
              timers: true,
              tasks: true
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
        orderBy: { createdAt: 'desc' },
        ...(pagination && pagination.page && pagination.limit && {
          skip: (pagination.page - 1) * pagination.limit,
          take: pagination.limit
        })
      });

      // Calculate total time for each project
      return projects.map(project => {
        const totalTime = project.timers.reduce((total, timer) => {
          if (timer.elapsedTime) {
            return total + timer.elapsedTime;
          }
          if (timer.startTime && timer.endTime) {
            return total + (timer.endTime.getTime() - timer.startTime.getTime());
          }
          return total;
        }, 0);

        const { timers, ...projectData } = project;
        return {
          ...projectData,
          totalTime
        };
      });
    } catch (error) {
      this.handleError('findByUserId', error);
      throw error;
    }
  }

  async findByUserIdAndName(userId: string, name: string): Promise<Project | null> {
    try {
      return await this.model.findFirst({
        where: {
          ownerId: userId,
          name: {
            equals: name
          }
        }
      });
    } catch (error) {
      this.handleError('findByUserIdAndName', error);
      throw error;
    }
  }

  async getProjectStats(userId: string, projectId: string): Promise<{
    totalTime: number;
    timerCount: number;
    taskCount: number;
    completedTasks: number;
  } | null> {
    try {
      const project = await this.model.findFirst({
        where: {
          id: projectId,
          ownerId: userId
        },
        include: {
          _count: {
            select: {
              timers: true,
              tasks: true
            }
          },
          timers: {
            select: {
              startTime: true,
              endTime: true,
              elapsedTime: true
            }
          },
          tasks: {
            select: {
              completed: true
            }
          }
        }
      });

      if (!project) return null;

      const totalTime = project.timers.reduce((total, timer) => {
        if (timer.elapsedTime) {
          return total + timer.elapsedTime;
        }
        if (timer.startTime && timer.endTime) {
          return total + (timer.endTime.getTime() - timer.startTime.getTime());
        }
        return total;
      }, 0);

      const completedTasks = project.tasks.filter(task => task.completed).length;

      return {
        totalTime,
        timerCount: project._count.timers,
        taskCount: project._count.tasks,
        completedTasks
      };
    } catch (error) {
      this.handleError('getProjectStats', error);
      throw error;
    }
  }

  async archiveProject(userId: string, projectId: string): Promise<Project | null> {
    try {
      return await this.model.updateMany({
        where: {
          id: projectId,
          ownerId: userId
        },
        data: {
          archived: true
        }
      }).then(() => this.findById(projectId));
    } catch (error) {
      this.handleError('archiveProject', error);
      throw error;
    }
  }

  async unarchiveProject(userId: string, projectId: string): Promise<Project | null> {
    try {
      return await this.model.updateMany({
        where: {
          id: projectId,
          ownerId: userId
        },
        data: {
          archived: false
        }
      }).then(() => this.findById(projectId));
    } catch (error) {
      this.handleError('unarchiveProject', error);
      throw error;
    }
  }
}