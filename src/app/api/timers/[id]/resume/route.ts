import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const timerId = params.id;
    const { userId } = await request.json();

    console.log('Resume API called with timerId:', timerId, 'userId:', userId);

    if (!userId) {
      console.log('User ID is missing');
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get the current timer
    const timer = await db.timer.findFirst({
      where: { id: timerId, userId },
    });

    if (!timer) {
      console.log('Timer not found for id:', timerId, 'userId:', userId);
      return NextResponse.json(
        { error: 'Timer not found' },
        { status: 404 }
      );
    }

    console.log('Found timer:', timer);

    if (timer.status !== 'PAUSED') {
      console.log('Timer is not paused, status:', timer.status);
      return NextResponse.json(
        { error: 'Timer is not paused' },
        { status: 400 }
      );
    }

    const now = new Date();
    const pausedDuration = timer.pausedAt ? now.getTime() - new Date(timer.pausedAt).getTime() : 0;
    const newTotalPausedMs = timer.totalPausedMs + pausedDuration;

    console.log('Updating timer - pausedDuration:', pausedDuration, 'newTotalPausedMs:', newTotalPausedMs);

    // Update timer to running state
    const updatedTimer = await db.timer.update({
      where: { id: timerId },
      data: {
        status: 'RUNNING',
        totalPausedMs: newTotalPausedMs,
        pausedAt: null,
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
    console.error('Resume timer error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}