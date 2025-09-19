import { BaseService } from './base/BaseService';
import { TaskRepository, TaskFilters, TaskWithProject } from '../repositories/TaskRepository';
import { ProjectRepository } from '../repositories/ProjectRepository';
import { ServiceResult, PaginationOptions } from './base/IService';
import { Task } from '@prisma/client';
import { logger } from '@/lib/logger';
import { XPService } from './XPService';

export interface CreateTaskData {
  title: string;
  description?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  projectId?: string;
  userId: string;
  estimatedTime?: number;
  dueDate?: Date;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  projectId?: string;
  estimatedTime?: number;
  dueDate?: Date;
  completed?: boolean;
}

export class TaskService extends BaseService {
  readonly serviceName = 'TaskService';
  private taskRepository: TaskRepository;
  private projectRepository: ProjectRepository;
  private xpService: XPService;

  constructor() {
    super();
    this.taskRepository = new TaskRepository();
    this.projectRepository = new ProjectRepository();
    this.xpService = new XPService();
  }

  private validateUserId(userId: string): void {
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      throw new Error('Valid user ID is required');
    }
  }

  private validateId(id: string, fieldName: string): void {
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      throw new Error(`Valid ${fieldName} is required`);
    }
  }

  private validateTaskRequired(value: any, fieldName: string): void {
    if (value === undefined || value === null || (typeof value === 'string' && value.trim().length === 0)) {
      throw new Error(`${fieldName} is required`);
    }
  }

  async getTasks(
    userId: string,
    filters: TaskFilters = {},
    pagination?: PaginationOptions
  ): Promise<ServiceResult<TaskWithProject[]>> {
    try {
      this.validateUserId(userId);

      const tasks = await this.taskRepository.findByUserId(
        userId,
        filters,
        pagination
      );

      logger.info('Tasks retrieved successfully', {
        userId,
        count: tasks.length,
        filters
      });

      return this.createSuccessResult(tasks);
    } catch (error) {
      logger.error(`Failed to get tasks - ${error instanceof Error ? error.message : String(error)}`);
      return this.createErrorResult('Failed to retrieve tasks');
    }
  }

  async getTaskById(
    userId: string,
    taskId: string
  ): Promise<ServiceResult<TaskWithProject | null>> {
    try {
      this.validateUserId(userId);
      this.validateId(taskId, 'Task ID');

      const tasks = await this.taskRepository.findByUserId(
        userId,
        {},
        undefined
      );

      const task = tasks.find(t => t.id === taskId);

      if (!task) {
        return this.createErrorResult('Task not found');
      }

      logger.info('Task retrieved successfully', {
        userId,
        taskId
      });

      return this.createSuccessResult(task);
    } catch (error) {
      logger.error(`Failed to get task by ID: ${taskId} - ${error instanceof Error ? error.message : String(error)}`);
      return this.createErrorResult('Failed to retrieve task');
    }
  }

  async getTasksByProject(
    userId: string,
    projectId: string,
    filters: Omit<TaskFilters, 'projectId'> = {},
    pagination?: PaginationOptions
  ): Promise<ServiceResult<TaskWithProject[]>> {
    try {
      this.validateUserId(userId);
      this.validateId(projectId, 'Project ID');

      // Verify project belongs to user
      const project = await this.projectRepository.findById(projectId);
      if (!project || project.ownerId !== userId) {
        return this.createErrorResult('Project not found');
      }

      const tasks = await this.taskRepository.findByProjectId(
        projectId,
        filters,
        pagination
      );

      logger.info('Project tasks retrieved successfully', {
        userId,
        projectId,
        count: tasks.length
      });

      return this.createSuccessResult(tasks);
    } catch (error) {
      logger.error(`Failed to get tasks by project: ${projectId} - ${error instanceof Error ? error.message : String(error)}`);
      return this.createErrorResult('Failed to retrieve project tasks');
    }
  }

  async createTask(
    data: CreateTaskData
  ): Promise<ServiceResult<Task>> {
    try {
      this.validateUserId(data.userId);
      this.validateTaskRequired(data.title, 'Task title');

      if (data.title.length < 1 || data.title.length > 200) {
        return this.createErrorResult('Task title must be between 1 and 200 characters');
      }

      // Check if task with same title already exists for user
      const existingTask = await this.taskRepository.findByUserIdAndTitle(
        data.userId,
        data.title
      );

      if (existingTask) {
        return this.createErrorResult('A task with this title already exists');
      }

      // Verify project exists and belongs to user if projectId is provided
      if (data.projectId) {
        const project = await this.projectRepository.findById(data.projectId);
        if (!project || project.ownerId !== data.userId) {
          return this.createErrorResult('Invalid project ID');
        }
      }

      // Validate estimated time
      if (data.estimatedTime !== undefined && data.estimatedTime < 0) {
        return this.createErrorResult('Estimated time cannot be negative');
      }

      // Validate due date
      if (data.dueDate && data.dueDate < new Date()) {
        return this.createErrorResult('Due date cannot be in the past');
      }

      const task = await this.taskRepository.create({
        title: data.title.trim(),
        description: data.description?.trim(),
        priority: data.priority || 'MEDIUM',
        project: {
          connect: { id: data.projectId }
        },
        assignee: data.userId ? {
          connect: { id: data.userId }
        } : undefined,
        estimatedMinutes: data.estimatedTime,
        dueDate: data.dueDate,
        completed: false
      });

      logger.info('Task created successfully', {
        userId: data.userId,
        taskId: task.id,
        title: data.title,
        projectId: data.projectId
      });

      return this.createSuccessResult(task);
    } catch (error) {
      logger.error(`Failed to create task - ${error instanceof Error ? error.message : String(error)}`);
      return this.createErrorResult('Failed to create task');
    }
  }

  async updateTask(
    userId: string,
    taskId: string,
    data: UpdateTaskData
  ): Promise<ServiceResult<Task>> {
    try {
      this.validateUserId(userId);
      this.validateId(taskId, 'Task ID');

      // Check if task exists
      const existingTask = await this.taskRepository.findById(taskId);
      if (!existingTask) {
        return this.createErrorResult('Task not found');
      }

      // Verify task belongs to user through project ownership
      if (existingTask.project && existingTask.project.ownerId !== userId) {
        return this.createErrorResult('Task not found');
      }

      // Validate title if provided
      if (data.title !== undefined) {
        if (data.title.length < 1 || data.title.length > 200) {
          return this.createErrorResult('Task title must be between 1 and 200 characters');
        }

        // Check if another task with same title exists
        if (data.title !== existingTask.title) {
          const duplicateTask = await this.taskRepository.findByUserIdAndTitle(
            userId,
            data.title
          );
          if (duplicateTask && duplicateTask.id !== taskId) {
            return this.createErrorResult('A task with this title already exists');
          }
        }
      }

      // Verify project exists and belongs to user if projectId is provided
      if (data.projectId !== undefined) {
        if (data.projectId) {
          const project = await this.projectRepository.findById(data.projectId);
          if (!project || project.ownerId !== userId) {
            return this.createErrorResult('Invalid project ID');
          }
        }
      }

      // Validate estimated time
      if (data.estimatedTime !== undefined && data.estimatedTime < 0) {
        return this.createErrorResult('Estimated time cannot be negative');
      }

      // Validate due date
      if (data.dueDate && data.dueDate < new Date()) {
        return this.createErrorResult('Due date cannot be in the past');
      }

      const updateData: any = {};
      if (data.title !== undefined) updateData.title = data.title.trim();
      if (data.description !== undefined) updateData.description = data.description?.trim();
      if (data.priority !== undefined) updateData.priority = data.priority;
      if (data.projectId !== undefined) updateData.projectId = data.projectId;
      if (data.estimatedTime !== undefined) updateData.estimatedMinutes = data.estimatedTime;
      if (data.dueDate !== undefined) updateData.dueDate = data.dueDate;
      if (data.completed !== undefined) {
        updateData.completed = data.completed;
      }

      const updatedTask = await this.taskRepository.update(taskId, updateData);

      if (!updatedTask) {
        return this.createErrorResult('Task not found');
      }

      logger.info('Task updated successfully', {
        userId,
        taskId,
        updates: Object.keys(updateData)
      });

      return this.createSuccessResult(updatedTask);
    } catch (error) {
      logger.error(`Failed to update task: ${taskId} - ${error instanceof Error ? error.message : String(error)}`);
      return this.createErrorResult('Failed to update task');
    }
  }

  async deleteTask(
    userId: string,
    taskId: string
  ): Promise<ServiceResult<void>> {
    try {
      this.validateUserId(userId);
      this.validateId(taskId, 'Task ID');

      // Check if task exists
      const existingTask = await this.taskRepository.findById(taskId);
      if (!existingTask) {
        return this.createErrorResult('Task not found');
      }

      // Verify task belongs to user through project ownership
      if (existingTask.project && existingTask.project.ownerId !== userId) {
        return this.createErrorResult('Task not found');
      }

      await this.taskRepository.delete(taskId);

      logger.info('Task deleted successfully', {
        userId,
        taskId
      });

      return this.createSuccessResult(undefined);
    } catch (error) {
      logger.error(`Failed to delete task: ${taskId} - ${error instanceof Error ? error.message : String(error)}`);
      return this.createErrorResult('Failed to delete task');
    }
  }

  async completeTask(
    userId: string,
    taskId: string
  ): Promise<ServiceResult<Task>> {
    try {
      this.validateUserId(userId);
      this.validateId(taskId, 'Task ID');

      const completedTask = await this.taskRepository.markAsCompleted(userId, taskId);

      if (!completedTask) {
        return this.createErrorResult('Task not found');
      }

      logger.info('Task completed successfully', {
        userId,
        taskId
      });

      return this.createSuccessResult(completedTask);
    } catch (error) {
      logger.error(`Failed to complete task: ${taskId} - ${error instanceof Error ? error.message : String(error)}`);
      return this.createErrorResult('Failed to complete task');
    }
  }

  async uncompleteTask(
    userId: string,
    taskId: string
  ): Promise<ServiceResult<Task>> {
    try {
      this.validateUserId(userId);
      this.validateId(taskId, 'Task ID');

      const uncompletedTask = await this.taskRepository.markAsIncomplete(userId, taskId);

      if (!uncompletedTask) {
        return this.createErrorResult('Task not found');
      }

      logger.info('Task marked as incomplete successfully', {
        userId,
        taskId
      });

      return this.createSuccessResult(uncompletedTask);
    } catch (error) {
      logger.error(`Failed to mark task as incomplete: ${taskId} - ${error instanceof Error ? error.message : String(error)}`);
      return this.createErrorResult('Failed to mark task as incomplete');
    }
  }

  async getTaskStats(
    userId: string,
    taskId: string
  ): Promise<ServiceResult<{
    totalTime: number;
    timerCount: number;
    completionRate: number;
  }>> {
    try {
      this.validateUserId(userId);
      this.validateId(taskId, 'Task ID');

      const stats = await this.taskRepository.getTaskStats(userId, taskId);

      if (!stats) {
        return this.createErrorResult('Task not found');
      }

      logger.info('Task stats retrieved successfully', {
        userId,
        taskId
      });

      return this.createSuccessResult(stats);
    } catch (error) {
      logger.error(`Failed to get task stats: ${taskId} - ${error instanceof Error ? error.message : String(error)}`);
      return this.createErrorResult('Failed to retrieve task statistics');
    }
  }

  async getTasksByPriority(
    userId: string,
    priority: 'LOW' | 'MEDIUM' | 'HIGH',
    pagination?: PaginationOptions
  ): Promise<ServiceResult<TaskWithProject[]>> {
    try {
      this.validateUserId(userId);

      const tasks = await this.taskRepository.getTasksByPriority(
        userId,
        priority,
        pagination
      );

      logger.info('Tasks by priority retrieved successfully', {
        userId,
        priority,
        count: tasks.length
      });

      return this.createSuccessResult(tasks);
    } catch (error) {
      logger.error(`Failed to get tasks by priority: ${priority} - ${error instanceof Error ? error.message : String(error)}`);
      return this.createErrorResult('Failed to retrieve tasks by priority');
    }
  }

  async getCompletedTasks(
    userId: string,
    pagination?: PaginationOptions
  ): Promise<ServiceResult<TaskWithProject[]>> {
    try {
      this.validateUserId(userId);

      const tasks = await this.taskRepository.getCompletedTasks(
        userId,
        pagination
      );

      logger.info('Completed tasks retrieved successfully', {
        userId,
        count: tasks.length
      });

      return this.createSuccessResult(tasks);
    } catch (error) {
      logger.error(`Failed to get completed tasks - ${error instanceof Error ? error.message : String(error)}`);
      return this.createErrorResult('Failed to retrieve completed tasks');
    }
  }

  async getPendingTasks(
    userId: string,
    pagination?: PaginationOptions
  ): Promise<ServiceResult<TaskWithProject[]>> {
    try {
      this.validateUserId(userId);

      const tasks = await this.taskRepository.getPendingTasks(
        userId,
        pagination
      );

      logger.info('Pending tasks retrieved successfully', {
        userId,
        count: tasks.length
      });

      return this.createSuccessResult(tasks);
    } catch (error) {
      logger.error(`Failed to get pending tasks - ${error instanceof Error ? error.message : String(error)}`);
      return this.createErrorResult('Failed to retrieve pending tasks');
    }
  }
}