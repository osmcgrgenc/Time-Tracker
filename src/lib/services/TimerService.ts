import { Timer, TimerStatus, XPAction } from '@prisma/client';
import { BaseService } from './base/BaseService';
import { ServiceResult, FilterOptions, PaginationOptions } from './base/IService';
import { TimerRepository, CreateTimerData, UpdateTimerData, TimerWithRelations } from '../repositories/TimerRepository';
import { XPService } from './XPService';
import { db } from '@/lib/db';

/**
 * Timer service business logic
 */
export class TimerService extends BaseService {
  readonly serviceName = 'TimerService';
  private timerRepository: TimerRepository;
  private xpService: XPService;

  constructor() {
    super();
    this.timerRepository = new TimerRepository();
    this.xpService = new XPService();
  }

  /**
   * Get all timers for a user with optional filters
   */
  async getTimers(
    userId: string,
    filters: {
      status?: TimerStatus;
      projectId?: string;
      taskId?: string;
      startDate?: Date;
      endDate?: Date;
      search?: string;
    } = {},
    pagination?: PaginationOptions
  ): Promise<ServiceResult<TimerWithRelations[]>> {
    try {
      this.logOperation('getTimers', userId, { filters, pagination });

      // Validate user ID
      const userValidation = await this.validateUserId(userId);
      if (!userValidation.success) {
        return this.createErrorResult('Invalid user ID');
      }

      const timers = await this.timerRepository.findByUserId(userId, filters);

      // Calculate elapsed time for running timers
      const timersWithElapsed = timers.map(timer => {
        if (timer.status === 'RUNNING' && timer.startTime) {
          const now = new Date();
          const runningTime = Math.floor((now.getTime() - timer.startTime.getTime()) / 1000);
          const totalElapsed = timer.elapsedTime + runningTime - Math.floor((timer.totalPausedTime || 0) / 1000);
          return { ...timer, calculatedElapsedTime: totalElapsed };
        }
        return { ...timer, calculatedElapsedTime: timer.elapsedTime };
      });

      return this.createSuccessResult(timersWithElapsed);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get active timer for user
   */
  async getActiveTimer(userId: string): Promise<ServiceResult<TimerWithRelations | null>> {
    try {
      this.logOperation('getActiveTimer', userId);

      const userValidation = await this.validateUserId(userId);
      if (!userValidation.success) {
        return this.createErrorResult('Invalid user ID');
      }

      const activeTimer = await this.timerRepository.findActiveTimer(userId);
      
      if (activeTimer && activeTimer.status === 'RUNNING' && activeTimer.startTime) {
        const now = new Date();
        const runningTime = Math.floor((now.getTime() - activeTimer.startTime.getTime()) / 1000);
        const totalElapsed = activeTimer.elapsedTime + runningTime - Math.floor((activeTimer.totalPausedTime || 0) / 1000);
        return this.createSuccessResult({ ...activeTimer, calculatedElapsedTime: totalElapsed });
      }

      return this.createSuccessResult(activeTimer);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Create a new timer
   */
  async createTimer(
    userId: string,
    data: Omit<CreateTimerData, 'userId'>
  ): Promise<ServiceResult<TimerWithRelations>> {
    try {
      this.logOperation('createTimer', userId, { data });

      // Validate user ID
      const userValidation = await this.validateUserId(userId);
      if (!userValidation.success) {
        return this.createErrorResult('Invalid user ID');
      }

      // Check if user has an active timer
      const activeTimer = await this.timerRepository.findActiveTimer(userId);
      if (activeTimer) {
        return this.createErrorResult('User already has an active timer. Please stop the current timer before starting a new one.');
      }

      // Validate project and task if provided
      if (data.projectId) {
        const projectExists = await db.project.findFirst({
          where: { id: data.projectId, ownerId: userId },
        });
        if (!projectExists) {
          return this.createErrorResult('Project not found or access denied');
        }
      }

      if (data.taskId) {
        const taskExists = await db.task.findFirst({
          where: { 
            id: data.taskId,
            ...(data.projectId ? { project_id: data.projectId } : {}),
          },
        });
        if (!taskExists) {
          return this.createErrorResult('Task not found or does not belong to the specified project');
        }
      }

      const timerData: CreateTimerData = {
        ...data,
        userId,
        startTime: new Date(),
        status: 'RUNNING',
      };

      const timer = await this.timerRepository.create(timerData);
      
      // Award XP for starting a timer
      await this.xpService.awardXP(userId, XPAction.TIMER_STARTED);

      // Get the created timer with relations
      const timerWithRelations = await this.timerRepository.findById(timer.id, {
        project: {
          select: { id: true, name: true, client: true },
        },
        task: {
          select: { id: true, title: true, completed: true },
        },
      });

      return this.createSuccessResult(timerWithRelations as TimerWithRelations);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Update a timer
   */
  async updateTimer(
    userId: string,
    timerId: string,
    data: UpdateTimerData
  ): Promise<ServiceResult<TimerWithRelations>> {
    try {
      this.logOperation('updateTimer', userId, { timerId, data });

      // Validate user ID
      const userValidation = await this.validateUserId(userId);
      if (!userValidation.success) {
        return this.createErrorResult('Invalid user ID');
      }

      // Check if timer exists and belongs to user
      const existingTimer = await this.timerRepository.findById(timerId);
      if (!existingTimer || existingTimer.userId !== userId) {
        return this.createErrorResult('Timer not found or access denied');
      }

      // Validate project and task if provided
      if (data.projectId) {
        const projectExists = await db.project.findFirst({
          where: { id: data.projectId, ownerId: userId },
        });
        if (!projectExists) {
          return this.createErrorResult('Project not found or access denied');
        }
      }

      if (data.taskId) {
        const taskExists = await db.task.findFirst({
          where: { 
            id: data.taskId,
            ...(data.projectId ? { projectId: data.projectId } : {}),
          },
        });
        if (!taskExists) {
          return this.createErrorResult('Task not found or does not belong to the specified project');
        }
      }

      const updatedTimer = await this.timerRepository.update(timerId, data);
      
      // Get the updated timer with relations
      const timerWithRelations = await this.timerRepository.findById(timerId, {
        project: {
          select: { id: true, name: true, client: true },
        },
        task: {
          select: { id: true, title: true, status: true },
        },
      });

      return this.createSuccessResult(timerWithRelations as TimerWithRelations);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Pause a running timer
   */
  async pauseTimer(userId: string, timerId: string): Promise<ServiceResult<TimerWithRelations>> {
    try {
      this.logOperation('pauseTimer', userId, { timerId });

      const timer = await this.timerRepository.findById(timerId);
      if (!timer || timer.userId !== userId) {
        return this.createErrorResult('Timer not found or access denied');
      }

      if (timer.status !== 'RUNNING') {
        return this.createErrorResult('Timer is not currently running');
      }

      const now = new Date();
      const runningTime = Math.floor((now.getTime() - timer.startTime.getTime()) / 1000);
      const newElapsedTime = timer.elapsedTime + runningTime - Math.floor((timer.totalPausedTime || 0) / 1000);

      const updateData: UpdateTimerData = {
        status: 'PAUSED',
        pausedAt: now,
        elapsedTime: newElapsedTime,
      };

      return await this.updateTimer(userId, timerId, updateData);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Resume a paused timer
   */
  async resumeTimer(userId: string, timerId: string): Promise<ServiceResult<TimerWithRelations>> {
    try {
      this.logOperation('resumeTimer', userId, { timerId });

      const timer = await this.timerRepository.findById(timerId);
      if (!timer || timer.userId !== userId) {
        return this.createErrorResult('Timer not found or access denied');
      }

      if (timer.status !== 'PAUSED') {
        return this.createErrorResult('Timer is not currently paused');
      }

      // Check if user has another active timer
      const activeTimer = await this.timerRepository.findActiveTimer(userId);
      if (activeTimer && activeTimer.id !== timerId) {
        return this.createErrorResult('User already has an active timer. Please stop the current timer before resuming this one.');
      }

      const now = new Date();
      const pausedTime = timer.pausedAt ? now.getTime() - timer.pausedAt.getTime() : 0;
      const newTotalPausedMs = (timer.totalPausedTime || 0) + pausedTime;

      const updateData: UpdateTimerData = {
        status: 'RUNNING',
        pausedAt: undefined,
        totalPausedTime: newTotalPausedMs,
      };

      return await this.updateTimer(userId, timerId, updateData);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Stop and complete a timer
   */
  async stopTimer(userId: string, timerId: string): Promise<ServiceResult<TimerWithRelations>> {
    try {
      this.logOperation('stopTimer', userId, { timerId });

      const timer = await this.timerRepository.findById(timerId);
      if (!timer || timer.userId !== userId) {
        return this.createErrorResult('Timer not found or access denied');
      };

      if (timer.status === 'COMPLETED') {
        return this.createErrorResult('Timer is already completed');
      }

      const now = new Date();
      let finalElapsedTime = timer.elapsedTime;

      if (timer.status === 'RUNNING') {
        const runningTime = Math.floor((now.getTime() - timer.startTime.getTime()) / 1000);
        finalElapsedTime = timer.elapsedTime + runningTime - Math.floor((timer.totalPausedTime || 0) / 1000);
      }

      const updateData: UpdateTimerData = {
        status: 'COMPLETED',
        endTime: now,
        elapsedTime: finalElapsedTime,
      };

      const result = await this.updateTimer(userId, timerId, updateData);
      
      // Award XP for completing a timer
      if (result.success) {
        await this.xpService.awardXP(userId, XPAction.TIMER_COMPLETED);
      }

      return result;
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Delete a timer
   */
  async deleteTimer(userId: string, timerId: string): Promise<ServiceResult<void>> {
    try {
      this.logOperation('deleteTimer', userId, { timerId });

      const timer = await this.timerRepository.findById(timerId);
      if (!timer || timer.userId !== userId) {
        return this.createErrorResult('Timer not found or access denied');
      };

      await this.timerRepository.delete(timerId);
      return this.createSuccessResult(undefined);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get timer statistics for user
   */
  async getTimerStats(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<ServiceResult<{
    totalTime: number;
    totalSessions: number;
    averageSessionTime: number;
    todayTime: number;
    weekTime: number;
    monthTime: number;
  }>> {
    try {
      this.logOperation('getTimerStats', userId, { startDate, endDate });

      const userValidation = await this.validateUserId(userId);
      if (!userValidation.success) {
        return this.createErrorResult('Invalid user ID');
      }

      const filters = { startDate, endDate };
      const stats = await this.timerRepository.getTimerStats(userId, filters);
      
      return this.createSuccessResult(stats);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get timers by project
   */
  async getTimersByProject(
    userId: string,
    projectId: string
  ): Promise<ServiceResult<TimerWithRelations[]>> {
    try {
      this.logOperation('getTimersByProject', userId, { projectId });

      const userValidation = await this.validateUserId(userId);
      if (!userValidation.success) {
        return this.createErrorResult('Invalid user ID');
      }

      // Verify project belongs to user
      const project = await db.project.findFirst({
        where: { 
          id: projectId,
          ownerId: userId 
        },
      });
      if (!project) {
        return this.createErrorResult('Project not found or access denied');
      }

      const timers = await this.timerRepository.findByProjectId(projectId, userId);
      return this.createSuccessResult(timers);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get timers by task
   */
  async getTimersByTask(
    userId: string,
    taskId: string
  ): Promise<ServiceResult<TimerWithRelations[]>> {
    try {
      this.logOperation('getTimersByTask', userId, { taskId });

      const userValidation = await this.validateUserId(userId);
      if (!userValidation.success) {
        return this.createErrorResult('Invalid user ID');
      }

      // Verify task exists and user has access
      const task = await db.task.findFirst({
        where: { 
          id: taskId,
          project: { ownerId: userId },
        },
      });
      if (!task) {
        return this.createErrorResult('Task not found or access denied');
      }

      const timers = await this.timerRepository.findByTaskId(taskId, userId);
      return this.createSuccessResult(timers);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Validate user ID exists
   */
  private async validateUserId(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const user = await db.user.findUnique({ where: { id: userId } });
      if (!user) {
        return { success: false, error: 'User not found' };
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Database error while validating user' };
    }
  }
}