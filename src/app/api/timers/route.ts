import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

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

    const where: any = { userId };
    
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

    return NextResponse.json({ timers: timersWithElapsed });
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

    const timer = await db.timer.create({
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

    return NextResponse.json({ timer }, { status: 201 });
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