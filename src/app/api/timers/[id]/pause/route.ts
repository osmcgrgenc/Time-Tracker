import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sanitizeForLog, validateUserId } from '@/lib/validation';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const timerId = params.id;
    if (!timerId) {
      return NextResponse.json(
        { error: 'Timer ID is required' },
        { status: 400 }
      );
    }
    
    const { userId } = await request.json();

    const validatedUserId = validateUserId(userId);
    console.log('Pause API called with timerId:', sanitizeForLog(timerId), 'userId:', sanitizeForLog(validatedUserId));

    // Get the current timer
    const timer = await db.timer.findFirst({
      where: { id: timerId, userId: validatedUserId },
    });

    if (!timer) {
      console.log('Timer not found for id:', sanitizeForLog(timerId));
      return NextResponse.json(
        { error: 'Timer not found' },
        { status: 404 }
      );
    }

    if (timer.status !== 'RUNNING') {
      console.log('Timer is not running, status:', timer.status);
      return NextResponse.json(
        { error: 'Timer is not running' },
        { status: 400 }
      );
    }

    const now = new Date();
    const elapsedSinceStart = now.getTime() - new Date(timer.startedAt).getTime();
    const newElapsedMs = timer.elapsedMs + elapsedSinceStart;

    console.log('Updating timer - elapsedSinceStart:', elapsedSinceStart, 'newElapsedMs:', newElapsedMs);

    // Update timer to paused state
    const updatedTimer = await db.timer.update({
      where: { id: timerId },
      data: {
        status: 'PAUSED',
        elapsedMs: newElapsedMs,
        pausedAt: now,
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

    console.log('Timer updated successfully:', updatedTimer);

    return NextResponse.json({ timer: updatedTimer });
  } catch (error) {
    console.error('Pause timer error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}