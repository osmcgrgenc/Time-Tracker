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
  note: z.string().optional(),
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
  const base = timer.elapsedMs;
  if (timer.status === 'RUNNING') {
    return base + (now.getTime() - new Date(timer.startedAt).getTime());
  }
  return base;
}

function formatTimerResponse(timer: any): TimerResponse {
  return {
    id: timer.id,
    status: timer.status,
    note: timer.note ? sanitizeForLog(timer.note) : undefined,
    billable: timer.billable,
    startedAt: timer.startedAt.toISOString(),
    elapsedMs: timer.elapsedMs,
    currentElapsedMs: computeElapsedMs(timer),
    project: timer.project ? {
      id: timer.project.id,
      name: sanitizeForLog(timer.project.name),
      client: timer.project.client ? sanitizeForLog(timer.project.client) : undefined,
    } : undefined,
    task: timer.task ? {
      id: timer.task.id,
      title: sanitizeForLog(timer.task.title),
      status: timer.task.status,
    } : undefined,
  };
}

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
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
          task: { select: { id: true, title: true, status: true } },
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
}

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
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
          note: data.note,
          billable: data.billable,
          startedAt: new Date(),
          status: 'RUNNING',
        },
        include: {
          project: { select: { id: true, name: true, client: true } },
          task: { select: { id: true, title: true, status: true } },
        },
      });

      await tx.user.update({
        where: { id: data.userId },
        data: { xp: { increment: xpReward } }
      });

      await tx.xPHistory.create({
        data: {
          userId: data.userId,
          action: 'TIMER_STARTED',
          xpEarned: xpReward,
          description: `Started timer: ${sanitizeForLog(data.note || 'Untitled')}`,
          timerId: newTimer.id,
        }
      });

      return newTimer;
    });

    return createResponse({
      timer: formatTimerResponse(timer),
      xpGained: xpReward
    }, HTTP_STATUS.CREATED);
  });
}