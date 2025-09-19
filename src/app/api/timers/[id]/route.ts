import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { withErrorHandling } from '@/lib/api-helpers';
import { TimerService } from '@/lib/services/TimerService';
import { z } from 'zod';

const updateTimerSchema = z.object({
  projectId: z.string().optional(),
  taskId: z.string().optional(),
  note: z.string().optional(),
  billable: z.boolean().optional(),
  status: z.enum(['RUNNING', 'PAUSED', 'COMPLETED']).optional(),
});

const timerService = new TimerService();

// GET single timer
export const GET = withAuth(async (
  request: NextRequest,
  { userId }: { userId: string },
  { params }: { params: Promise<{ id: string }> }
) => {
  const resolvedParams = await params;
  const timerId = resolvedParams.id;

  const result = await timerService.getTimers(userId, {});
  
  if (!result.success) {
    return NextResponse.json(
      { error: result.error || 'Failed to fetch timer' },
      { status: 400 }
    );
  }

  const timer = result.data?.find(t => t.id === timerId);
  if (!timer) {
    return NextResponse.json(
      { error: 'Timer not found' },
      { status: 404 }
    );
  }

  return NextResponse.json(timer);
});

// UPDATE timer
export const PUT = withAuth(async (
  request: NextRequest,
  { userId }: { userId: string },
  { params }: { params: Promise<{ id: string }> }
) => {
  const resolvedParams = await params;
  const timerId = resolvedParams.id;
  const body = await request.json();
  const validatedData = updateTimerSchema.parse(body);

  const result = await timerService.updateTimer(userId, timerId, validatedData);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error || 'Failed to update timer' },
      { status: 400 }
    );
  }

  return NextResponse.json(result.data);
});

// DELETE timer
export const DELETE = withAuth(async (
  request: NextRequest,
  { userId }: { userId: string },
  { params }: { params: Promise<{ id: string }> }
) => {
  const resolvedParams = await params;
  const timerId = resolvedParams.id;

  const result = await timerService.deleteTimer(userId, timerId);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error || 'Failed to delete timer' },
      { status: 400 }
    );
  }

  return NextResponse.json({ message: 'Timer deleted successfully' });
});