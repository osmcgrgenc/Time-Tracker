import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const cancelTimerSchema = z.object({
  userId: z.string(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: timerId } = await params;
    const { userId } = cancelTimerSchema.parse(await request.json());

    // Get the current timer
    const timer = await db.timer.findFirst({
      where: { id: timerId, userId },
    });

    if (!timer) {
      return NextResponse.json(
        { error: 'Timer not found' },
        { status: 404 }
      );
    }

    if (timer.status === 'COMPLETED' || timer.status === 'CANCELED') {
      return NextResponse.json(
        { error: 'Timer is already completed or canceled' },
        { status: 400 }
      );
    }

    const now = new Date();
    let finalElapsedTime = timer.elapsedTime;

    // If timer is running, add the current session time
    if (timer.status === 'RUNNING') {
      finalElapsedTime += Math.floor((now.getTime() - new Date(timer.startTime).getTime()) / 1000);
    }

    // Update timer to canceled state
    const updatedTimer = await db.timer.update({
      where: { id: timerId },
      data: {
        status: 'CANCELED',
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

    return NextResponse.json({ timer: updatedTimer });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Cancel timer error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}