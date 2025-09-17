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
  parseRequestBody
} from '@/lib/api-helpers';
import { requireResourceOwnership } from '@/lib/auth-middleware';
import { sanitizeForLog } from '@/lib/validation';

const actionSchema = z.object({
  userId: z.string(),
});

const completeSchema = actionSchema.extend({
  description: z.string().optional(),
});

async function getTimerWithValidation(timerId: string, userId: string) {
  await validateUser(userId);
  await requireResourceOwnership(userId, 'timer', timerId);
  
  const timer = await db.timer.findUnique({
    where: { id: timerId },
    include: {
      project: { select: { id: true, name: true, client: true } },
      task: { select: { id: true, title: true, status: true } },
    },
  });

  if (!timer) {
    throw new Error(ERROR_MESSAGES.RESOURCE_NOT_FOUND);
  }

  return timer;
}

export async function pauseTimer(request: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const { userId } = await parseRequestBody(request, actionSchema);
    const timer = await getTimerWithValidation(params.id, userId);

    if (timer.status !== 'RUNNING') {
      return createErrorResponse('Timer is not running', HTTP_STATUS.BAD_REQUEST);
    }

    const now = new Date();
    const elapsedMs = timer.elapsedMs + (now.getTime() - timer.startedAt.getTime());

    const updatedTimer = await db.timer.update({
      where: { id: params.id },
      data: {
        status: 'PAUSED',
        pausedAt: now,
        elapsedMs,
      },
      include: {
        project: { select: { id: true, name: true, client: true } },
        task: { select: { id: true, title: true, status: true } },
      },
    });

    return createResponse({ timer: updatedTimer });
  });
}

export async function resumeTimer(request: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const { userId } = await parseRequestBody(request, actionSchema);
    const timer = await getTimerWithValidation(params.id, userId);

    if (timer.status !== 'PAUSED') {
      return createErrorResponse('Timer is not paused', HTTP_STATUS.BAD_REQUEST);
    }

    const updatedTimer = await db.timer.update({
      where: { id: params.id },
      data: {
        status: 'RUNNING',
        startedAt: new Date(),
        pausedAt: null,
      },
      include: {
        project: { select: { id: true, name: true, client: true } },
        task: { select: { id: true, title: true, status: true } },
      },
    });

    return createResponse({ timer: updatedTimer });
  });
}

export async function completeTimer(request: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const { userId, description } = await parseRequestBody(request, completeSchema);
    const timer = await getTimerWithValidation(params.id, userId);

    if (timer.status === 'COMPLETED') {
      return createErrorResponse('Timer is already completed', HTTP_STATUS.BAD_REQUEST);
    }

    const xpReward = 15;
    const now = new Date();
    let finalElapsedMs = timer.elapsedMs;

    if (timer.status === 'RUNNING') {
      finalElapsedMs += now.getTime() - timer.startedAt.getTime();
    }

    const result = await db.$transaction(async (tx) => {
      const updatedTimer = await tx.timer.update({
        where: { id: params.id },
        data: {
          status: 'COMPLETED',
          completedAt: now,
          elapsedMs: finalElapsedMs,
          note: description || timer.note,
        },
        include: {
          project: { select: { id: true, name: true, client: true } },
          task: { select: { id: true, title: true, status: true } },
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: { xp: { increment: xpReward } }
      });

      await tx.xPHistory.create({
        data: {
          userId,
          action: 'TIMER_COMPLETED',
          xpEarned: xpReward,
          description: `Completed timer: ${sanitizeForLog(description || timer.note || 'Untitled')}`,
          timerId: params.id,
        }
      });

      return updatedTimer;
    });

    return createResponse({ timer: result, xpGained: xpReward });
  });
}

export async function cancelTimer(request: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const { userId } = await parseRequestBody(request, actionSchema);
    const timer = await getTimerWithValidation(params.id, userId);

    if (timer.status === 'COMPLETED' || timer.status === 'CANCELED') {
      return createErrorResponse('Timer cannot be canceled', HTTP_STATUS.BAD_REQUEST);
    }

    const updatedTimer = await db.timer.update({
      where: { id: params.id },
      data: { status: 'CANCELED' },
      include: {
        project: { select: { id: true, name: true, client: true } },
        task: { select: { id: true, title: true, status: true } },
      },
    });

    return createResponse({ timer: updatedTimer });
  });
}