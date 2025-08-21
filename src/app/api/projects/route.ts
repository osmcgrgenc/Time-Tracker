import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const createProjectSchema = z.object({
  name: z.string().min(1),
  client: z.string().optional(),
  userId: z.string(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const query = searchParams.get('query');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const where: any = { ownerId: userId };
    
    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { client: { contains: query, mode: 'insensitive' } },
      ];
    }

    const projects = await db.project.findMany({
      where,
      include: {
        tasks: {
          select: { id: true, title: true, status: true },
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

    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Get projects error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, client, userId } = createProjectSchema.parse(body);

    const project = await db.project.create({
      data: {
        name,
        client,
        ownerId: userId,
      },
      include: {
        tasks: {
          select: { id: true, title: true, status: true },
        },
        _count: {
          select: {
            timers: true,
            timeEntries: true,
          },
        },
      },
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Create project error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}