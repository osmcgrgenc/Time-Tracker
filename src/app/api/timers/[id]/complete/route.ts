import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { 
  withErrorHandling, 
  createResponse, 
  createErrorResponse,
  HTTP_STATUS,
  ERROR_MESSAGES,
  parseRequestBody
} from '@/lib/api-helpers';
import { withAuth, requireResourceOwnership } from '@/lib/auth-middleware';
import { logger } from '@/lib/logger';
import { sanitizeForLog } from '@/lib/validation';

const completeTimerSchema = z.object({
  description: z.string().optional(),
  date: z.string().optional(),
});

export const POST = withAuth(withErrorHandling(async (
  request: NextRequest,
  { userId, params }: { userId: string; params: Promise<{ id: string }> }
) => {
  const resolvedParams = await params;
  const startTime = Date.now();
  const method = 'POST';
  const endpoint = `/api/timers/${resolvedParams.id}/complete`;
  
  logger.apiRequest(method, endpoint);
  
  const timerId = resolvedParams.id;
  const { description, date } = await parseRequestBody(request, completeTimerSchema);
  
  await requireResourceOwnership(userId, 'timer', timerId);

  const timer = await db.timer.findUnique({
      where: { id: timerId },
      include: {
        project: true,
        task: true,
      },
    });

    if (!timer) {
      return createErrorResponse(ERROR_MESSAGES.RESOURCE_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    if (timer.status === 'COMPLETED') {
      return createErrorResponse('Timer is already completed', HTTP_STATUS.BAD_REQUEST);
    }

    const now = new Date();
    let finalElapsedTime = timer.elapsedTime;

    // If timer is running, add the current session time
    if (timer.status === 'RUNNING') {
      const sessionTime = Math.floor((now.getTime() - new Date(timer.startTime).getTime()) / 1000);
      finalElapsedTime += sessionTime;
    }

    // Convert seconds to minutes (rounded up)
    const minutes = Math.ceil(finalElapsedTime / 60);

    // Determine the date for the time entry
    const entryDate = date ? new Date(date) : now;

    // Complete timer and award XP in single transaction
    const xpReward = 15;
    const result = await db.$transaction(async (tx) => {
      const timeEntry = await tx.timeEntry.create({
        data: {
          userId: timer.userId,
          projectId: timer.projectId,
          taskId: timer.taskId,
          date: entryDate,
          description: description || timer.description,
          billable: timer.billable,
          minutes,
          sourceTimer: timer.id,
        },
      });

      const updatedTimer = await tx.timer.update({
        where: { id: timerId },
        data: {
          status: 'COMPLETED',
          elapsedTime: finalElapsedTime,
          endTime: now,
        },
        include: {
          project: {
            select: { id: true, name: true, client: true },
          },
          task: {
            select: { id: true, title: true, completed: true },
          },
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: {
          totalXP: { increment: xpReward }
        }
      });

      await tx.xPHistory.create({
        data: {
          userId,
          action: 'TIMER_COMPLETED',
          xpEarned: xpReward,
          description: `Completed timer: ${sanitizeForLog(description || timer.description || 'Untitled')}`,
          timerId,
        }
      });

      return { timeEntry, updatedTimer };
    });

    const { timeEntry, updatedTimer } = result;

    const response = createResponse({
      timer: updatedTimer,
      timeEntry,
      xpGained: xpReward
    });
    
    const duration = Date.now() - startTime;
    logger.apiResponse(method, endpoint, HTTP_STATUS.OK, duration, userId);
    return response;
}));