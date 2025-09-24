import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
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
import { sanitizeForLog } from '@/lib/validation';
import { TimerResponse } from '@/types/api';

const createTimerSchema = z.object({
  projectId: z.string().optional(),
  taskId: z.string().optional(),
  billable: z.boolean().default(false),
  userId: z.string(),
});

const querySchema = z.object({
  status: z.enum(['RUNNING', 'PAUSED', 'COMPLETED', 'CANCELED']).optional(),
  projectId: z.string().optional(),
  taskId: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

function computeElapsedMs(timer: any, now: Date = new Date()): number {
  // Add null checks
  if (!timer) return 0;

  const base = timer.elapsedMs || 0;
  if (timer.status === 'RUNNING' && timer.startTime) {
    return base + (now.getTime() - new Date(timer.startTime).getTime());
  }
  return base;
}

function formatTimerResponse(timer: any): TimerResponse {
  // Add null checks for timer object
  if (!timer || !timer.id || !timer.status) {
    throw new Error('Geçersiz timer verisi: Timer ID veya status bulunamadı');
  }

  return {
    id: timer.id,
    status: timer.status,
    billable: timer.billable,
    startedAt: timer.startTime?.toISOString() || new Date().toISOString(),
    elapsedMs: timer.elapsedMs || 0,
    currentElapsedMs: computeElapsedMs(timer),
    project: timer.project ? {
      id: timer.project.id,
      name: sanitizeForLog(timer.project.name),
      client: timer.project.client ? sanitizeForLog(timer.project.client) : undefined,
    } : undefined,
    task: timer.task ? {
      id: timer.task.id,
      title: sanitizeForLog(timer.task.title),
    } : undefined,
  };
}

export const GET = withErrorHandling(async (request: NextRequest) => {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return createErrorResponse(ERROR_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
  }

  await validateUser(userId);

  const { searchParams } = new URL(request.url);
  const query = querySchema.parse(Object.fromEntries(searchParams));

  const where: any = { userId };
  if (query.status) where.status = query.status;
  if (query.projectId) where.projectId = query.projectId;
  if (query.taskId) where.taskId = query.taskId;

  const [timers, total] = await Promise.all([
    db.timer.findMany({
      where,
      include: {
        project: { select: { id: true, name: true, client: true } },
        task: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: query.limit,
      skip: query.offset,
    }),
    db.timer.count({ where })
  ]);

  const formattedTimers = timers.map(formatTimerResponse);

  return createResponse({
    timers: formattedTimers,
    meta: { total, limit: query.limit, offset: query.offset }
  });
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const data = await parseRequestBody(request, createTimerSchema);
  
  await validateUser(data.userId);

  // Validate task-project relationship
  if (data.taskId && data.projectId) {
    const task = await db.task.findFirst({
      where: { id: data.taskId, projectId: data.projectId },
    });
    
    if (!task) {
      return createErrorResponse(
        'Task does not belong to the specified project',
        HTTP_STATUS.BAD_REQUEST
      );
    }
  }

  const xpReward = 5;
  const timer = await db.$transaction(async (tx) => {
    const newTimer = await tx.timer.create({
      data: {
        userId: data.userId,
        projectId: data.projectId,
        taskId: data.taskId,
        billable: data.billable,
        startTime: new Date(),
        status: 'RUNNING',
      },
      include: {
        project: { select: { id: true, name: true, client: true } },
        task: { select: { id: true, title: true } },
      },
    });

    await tx.user.update({
      where: { id: data.userId },
      data: { totalXP: { increment: xpReward } }
    });

    await tx.xPHistory.create({
      data: {
        userId: data.userId,
        action: 'TIMER_STARTED',
        xpEarned: xpReward,
        description: 'Started timer',
        timerId: newTimer.id,
      }
    });

    return newTimer;
  });

  // Add null check for timer
  if (!timer) {
    return createErrorResponse(
      'Timer oluşturulamadı',
      HTTP_STATUS.INTERNAL_ERROR
    );
  }

  return createResponse({
    timer: formatTimerResponse(timer),
    xpGained: xpReward
  }, HTTP_STATUS.CREATED);
});