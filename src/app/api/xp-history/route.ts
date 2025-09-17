import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, action, xpEarned, description, timerId, metadata } = body;

    if (!userId || !action || typeof xpEarned !== 'number') {
      return NextResponse.json(
        { error: 'Missing required fields: userId, action, xpEarned' },
        { status: 400 }
      );
    }

    // Create XP history entry
    const xpHistory = await db.xPHistory.create({
      data: {
        userId,
        action,
        xpEarned,
        description,
        timerId,
        metadata,
      },
    });

    return NextResponse.json({ xpHistory });
  } catch (error) {
    console.error('Error saving XP history:', error);
    return NextResponse.json(
      { error: 'Failed to save XP history' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const xpHistory = await db.xPHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        timer: {
          select: {
            note: true,
            project: {
              select: {
                name: true,
              },
            },
            task: {
              select: {
                title: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ xpHistory });
  } catch (error) {
    console.error('Error fetching XP history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch XP history' },
      { status: 500 }
    );
  }
}
