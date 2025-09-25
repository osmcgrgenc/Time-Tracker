import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { Prisma, Priority } from '@prisma/client';
import { withAuth } from '@/lib/auth';

const createTaskSchema = z.object({
  projectId: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  completed: z.boolean().optional(),
  priority: z.string().optional(),
  assigneeId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const projectId = searchParams.get('projectId');
    const query = searchParams.get('query');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    let where: Prisma.TaskWhereInput = {};
    
    // Base filter for user's projects or assigned tasks
    const userFilter: Prisma.TaskWhereInput = {
      OR: [
        { project: { ownerId: userId } },
        { assigneeId: userId },
      ],
    };
    
    if (projectId) {
      where.projectId = projectId;
    }
    
    if (query) {
      // Combine user filter with search query
      where.AND = [
        userFilter,
        {
          OR: [
            { title: { contains: query } },
            { description: { contains: query } },
          ],
        },
      ];
    } else {
      // Use user filter directly when no search query
      where = { ...where, ...userFilter };
    }

    const tasks = await db.task.findMany({
      where,
      include: {
        project: {
          select: { id: true, name: true, client: true },
        },
        assignee: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: {
            timers: true,
            timeEntries: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('Get tasks error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(async (request: NextRequest, userId: string) => {
  try {
    const body = await request.json();
    const { projectId, title, description, completed, priority, assigneeId } = createTaskSchema.parse(body);

    // Verify project exists and user has access
    const project = await db.project.findFirst({
      where: { 
        id: projectId,
        ownerId: userId // Ensure requesting user owns the project
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    const task = await db.task.create({
      data: {
        projectId,
        title,
        description,
        completed,
        priority: priority as Priority,
        assigneeId,
      },
      include: {
        project: {
          select: { id: true, name: true, client: true },
        },
        assignee: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: {
            timers: true,
            timeEntries: true,
          },
        },
      },
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Create task error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});