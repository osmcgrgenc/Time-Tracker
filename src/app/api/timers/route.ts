import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { sanitizeForLog } from '@/lib/validation';
import { Prisma } from '@prisma/client';

const createTimerSchema = z.object({
  projectId: z.string().optional(),
  taskId: z.string().optional(),
  note: z.string().optional(),
  billable: z.boolean().default(false),
});

// Helper function to compute elapsed time
function computeElapsedMs(timer: any, now: Date = new Date()): number {
  const base = timer.elapsedMs;
  if (timer.status === 'RUNNING') {
    return base + (now.getTime() - new Date(timer.startedAt).getTime());
  }
  return base;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const projectId = searchParams.get('projectId');
    const taskId = searchParams.get('taskId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const where: Prisma.TimerWhereInput = { userId };
    
    if (status) {
      where.status = status;
    }
    
    if (projectId) {
      where.projectId = projectId;
    }
    
    if (taskId) {
      where.taskId = taskId;
    }

    const timers = await db.timer.findMany({
      where,
      include: {
        project: {
          select: { id: true, name: true, client: true },
        },
        task: {
          select: { id: true, title: true, status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate current elapsed time for running timers
    const now = new Date();
    const timersWithElapsed = timers.map((timer) => ({
      ...timer,
      currentElapsedMs: computeElapsedMs(timer, now),
    }));

    return NextResponse.json({ 
      timers: timersWithElapsed.map(timer => ({
        ...timer,
        note: timer.note ? sanitizeForLog(timer.note) : null,
        project: timer.project ? {
          ...timer.project,
          name: sanitizeForLog(timer.project.name),
          client: timer.project.client ? sanitizeForLog(timer.project.client) : null
        } : null,
        task: timer.task ? {
          ...timer.task,
          title: sanitizeForLog(timer.task.title)
        } : null
      }))
    });
  } catch (error) {
    console.error('Get timers error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, taskId, note, billable } = createTimerSchema.parse(body);

    // For now, we'll get userId from the request body
    // In a real app, you'd get this from the session
    const { userId } = body;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Validate user exists
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Validate that task belongs to project if both are provided
    if (taskId && projectId) {
      const task = await db.task.findFirst({
        where: { id: taskId, projectId },
      });
      
      if (!task) {
        return NextResponse.json(
          { error: 'Task does not belong to the specified project' },
          { status: 400 }
        );
      }
    }

    // Create timer and award XP in single transaction
    const xpReward = 5;
    const result = await db.$transaction(async (tx) => {
      const timer = await tx.timer.create({
        data: {
          userId,
          projectId,
          taskId,
          note,
          billable,
          startedAt: new Date(),
          status: 'RUNNING',
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

      await tx.user.update({
        where: { id: userId },
        data: {
          xp: { increment: xpReward }
        }
      });

      await tx.xPHistory.create({
        data: {
          userId,
          action: 'TIMER_STARTED',
          xpEarned: xpReward,
          description: `Started timer: ${sanitizeForLog(note || 'Untitled')}`,
          timerId: timer.id,
        }
      });

      return timer;
    });

    const timer = result;

    return NextResponse.json({ timer, xpGained: xpReward }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Create timer error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}