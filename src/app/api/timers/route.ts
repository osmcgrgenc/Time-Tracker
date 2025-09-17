import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { sanitizeForLog } from '@/lib/validation';
import { Prisma } from '@prisma/client';
import { 
  withErrorHandling, 
  createResponse, 
  createErrorResponse,
  HTTP_STATUS,
  ERROR_MESSAGES,
  validateUser,
  getUserIdFromRequest,
  parseRequestBody
} from '@/lib/api-helpers';
import { logger } from '@/lib/logger';

const createTimerSchema = z.object({
  projectId: z.string().optional(),
  taskId: z.string().optional(),
  note: z.string().optional(),
  billable: z.boolean().default(false),
});

// Helper function to compute elapsed time
function computeElapsedMs(timer: any, now: Date = new Date()): number {
  const base = timer.elapsedMs;
  if (timer.status === 'RUNNING') {
    return base + (now.getTime() - new Date(timer.startedAt).getTime());
  }
  return base;
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const method = 'GET';
  const endpoint = '/api/timers';
  
  return withErrorHandling(async () => {
    logger.apiRequest(method, endpoint);
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const projectId = searchParams.get('projectId');
    const taskId = searchParams.get('taskId');

    if (!userId) {
      return createErrorResponse(ERROR_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
    }
    
    await validateUser(userId);
    logger.debug('User validated', { userId });

    const where: Prisma.TimerWhereInput = { userId };
    
    if (status) {
      where.status = status;
    }
    
    if (projectId) {
      where.projectId = projectId;
    }
    
    if (taskId) {
      where.taskId = taskId;
    }

    const timers = await db.timer.findMany({
      where,
      include: {
        project: {
          select: { id: true, name: true, client: true },
        },
        task: {
          select: { id: true, title: true, status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate current elapsed time for running timers
    const now = new Date();
    const timersWithElapsed = timers.map((timer) => ({
      ...timer,
      currentElapsedMs: computeElapsedMs(timer, now),
    }));

    const response = createResponse({
      timers: timersWithElapsed.map(timer => ({
        ...timer,
        note: timer.note ? sanitizeForLog(timer.note) : null,
        project: timer.project ? {
          ...timer.project,
          name: sanitizeForLog(timer.project.name),
          client: timer.project.client ? sanitizeForLog(timer.project.client) : null
        } : null,
        task: timer.task ? {
          ...timer.task,
          title: sanitizeForLog(timer.task.title)
        } : null
      }))
    });
    
    const duration = Date.now() - startTime;
    logger.apiResponse(method, endpoint, HTTP_STATUS.OK, duration, userId);
    return response;
  });
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const method = 'POST';
  const endpoint = '/api/timers';
  
  return withErrorHandling(async () => {
    logger.apiRequest(method, endpoint);
    
    const body = await parseRequestBody(request, createTimerSchema.extend({ userId: z.string() }));
    const { projectId, taskId, note, billable, userId } = body;
    
    await validateUser(userId);
    logger.debug('User validated for timer creation', { userId });

    // Validate that task belongs to project if both are provided
    if (taskId && projectId) {
      const task = await db.task.findFirst({
        where: { id: taskId, projectId },
      });
      
      if (!task) {
        return createErrorResponse(
          'Task does not belong to the specified project',
          HTTP_STATUS.BAD_REQUEST
        );
      }
    }

    // Create timer and award XP in single transaction
    const xpReward = 5;
    const result = await db.$transaction(async (tx) => {
      const timer = await tx.timer.create({
        data: {
          userId,
          projectId,
          taskId,
          note,
          billable,
          startedAt: new Date(),
          status: 'RUNNING',
        },
        include: {
          project: {
            select: { id: true, name: true, client: true },
          },
          task: {
            select: { id: true, title: true, status: true },
          },
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: {
          xp: { increment: xpReward }
        }
      });

      await tx.xPHistory.create({
        data: {
          userId,
          action: 'TIMER_STARTED',
          xpEarned: xpReward,
          description: `Started timer: ${sanitizeForLog(note || 'Untitled')}`,
          timerId: timer.id,
        }
      });

      return timer;
    });

    const timer = result;

    const response = createResponse({ timer, xpGained: xpReward }, HTTP_STATUS.CREATED);
    const duration = Date.now() - startTime;
    logger.apiResponse(method, endpoint, HTTP_STATUS.CREATED, duration, userId);
    return response;
  });
}