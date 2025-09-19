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
      task: { select: { id: true, title: true, completed: true } },
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
    const sessionTime = Math.floor((now.getTime() - timer.startTime.getTime()) / 1000);
    const elapsedTime = timer.elapsedTime + sessionTime;

    const updatedTimer = await db.timer.update({
      where: { id: params.id },
      data: {
        status: 'PAUSED',
        pausedAt: now,
        elapsedTime,
      },
      include: {
        project: { select: { id: true, name: true, client: true } },
        task: { select: { id: true, title: true, completed: true } },
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
        startTime: new Date(),
        pausedAt: null,
      },
      include: {
        project: { select: { id: true, name: true, client: true } },
        task: { select: { id: true, title: true, completed: true } },
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
    let finalElapsedTime = timer.elapsedTime;

    if (timer.status === 'RUNNING') {
      const sessionTime = Math.floor((now.getTime() - timer.startTime.getTime()) / 1000);
      finalElapsedTime += sessionTime;
    }

    const result = await db.$transaction(async (tx) => {
      const updatedTimer = await tx.timer.update({
        where: { id: params.id },
        data: {
          status: 'COMPLETED',
          endTime: now,
          elapsedTime: finalElapsedTime,
          description: description || timer.description,
        },
        include: {
          project: { select: { id: true, name: true, client: true } },
          task: { select: { id: true, title: true, completed: true } },
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: { totalXP: { increment: xpReward } }
      });

      await tx.xPHistory.create({
        data: {
          userId,
          action: 'TIMER_COMPLETED',
          xpEarned: xpReward,
          description: `Completed timer: ${sanitizeForLog(description || timer.description || 'Untitled')}`,
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
        task: { select: { id: true, title: true, completed: true } },
      },
    });

    return createResponse({ timer: updatedTimer });
  });
}