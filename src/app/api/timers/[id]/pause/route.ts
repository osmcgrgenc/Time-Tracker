import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { withErrorHandling } from '@/lib/api-helpers';
import { TimerService } from '@/lib/services/TimerService';

const timerService = new TimerService();

export const POST = withAuth(async (
  request: NextRequest,
  { userId }: { userId: string },
  { params }: { params: Promise<{ id: string }> }
) => {
  const resolvedParams = await params;
  const timerId = resolvedParams.id;

  const result = await timerService.pauseTimer(userId, timerId);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error || 'Failed to pause timer' },
      { status: 400 }
    );
  }

  return NextResponse.json({ data: result.data });
});