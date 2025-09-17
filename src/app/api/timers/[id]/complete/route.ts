import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const completeTimerSchema = z.object({
  userId: z.string(),
  description: z.string().optional(),
  date: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const timerId = params.id;
    const body = await request.json();
    const { userId, description, date } = completeTimerSchema.parse(body);

    // Get the current timer
    const timer = await db.timer.findFirst({
      where: { id: timerId, userId },
      include: {
        project: true,
        task: true,
      },
    });

    if (!timer) {
      return NextResponse.json(
        { error: 'Timer not found' },
        { status: 404 }
      );
    }

    if (timer.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Timer is already completed' },
        { status: 400 }
      );
    }

    const now = new Date();
    let finalElapsedMs = timer.elapsedMs;

    // If timer is running, add the current session time
    if (timer.status === 'RUNNING') {
      finalElapsedMs += now.getTime() - new Date(timer.startedAt).getTime();
    }

    // Convert milliseconds to minutes (rounded up)
    const minutes = Math.ceil(finalElapsedMs / 60000);

    // Determine the date for the time entry
    const entryDate = date ? new Date(date) : now;

    // Create time entry
    const timeEntry = await db.timeEntry.create({
      data: {
        userId: timer.userId,
        projectId: timer.projectId,
        taskId: timer.taskId,
        date: entryDate,
        description: description || timer.note,
        billable: timer.billable,
        minutes,
        sourceTimer: timer.id,
      },
    });

    // Update timer to completed state
    const updatedTimer = await db.timer.update({
      where: { id: timerId },
      data: {
        status: 'COMPLETED',
        elapsedMs: finalElapsedMs,
        completedAt: now,
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

    // Award XP for completing timer
    const xpReward = 15;
    await db.user.update({
      where: { id: userId },
      data: {
        xp: { increment: xpReward }
      }
    });

    // Create XP history entry
    await db.xPHistory.create({
      data: {
        userId,
        action: 'TIMER_COMPLETED',
        xpEarned: xpReward,
        description: `Completed timer: ${description || timer.note || 'Untitled'}`,
        timerId,
      }
    });

    return NextResponse.json({
      timer: updatedTimer,
      timeEntry,
      xpGained: xpReward
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Complete timer error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}