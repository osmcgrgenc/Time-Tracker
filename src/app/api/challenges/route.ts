import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { ChallengeType } from '@prisma/client';

const updateChallengeSchema = z.object({
  userId: z.string(),
  challengeId: z.string(),
  completed: z.boolean(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const today = new Date().toDateString();
    
    // Check if user has challenges for today
    let userChallenges = await db.userChallenge.findMany({
      where: {
        userId,
        date: {
          gte: new Date(today),
          lt: new Date(new Date(today).getTime() + 24 * 60 * 60 * 1000)
        }
      }
    });

    // If no challenges for today, create them
    if (userChallenges.length === 0) {
      const challengeTemplates = [
        {
          id: 'daily_time',
          title: 'Time Goal',
          description: 'Track 2 hours today',
          target: 2,
          xpReward: 100,
          type: 'TIME'
        },
        {
          id: 'daily_tasks',
          title: 'Task Master',
          description: 'Complete 3 tasks today',
          target: 3,
          xpReward: 75,
          type: 'TASKS'
        },
        {
          id: 'focus_session',
          title: 'Deep Focus',
          description: 'Have a 25-minute focused session',
          target: 25,
          xpReward: 50,
          type: 'FOCUS'
        }
      ];

      const createPromises = challengeTemplates.map(template =>
        db.userChallenge.create({
          data: {
            userId,
            challengeId: template.id,
            title: template.title,
            description: template.description,
            target: template.target,
            current: 0,
            xpReward: template.xpReward,
            type: template.type as ChallengeType,
            completed: false,
            date: new Date()
          }
        })
      );

      userChallenges = await Promise.all(createPromises);
    }

    return NextResponse.json({ challenges: userChallenges });
  } catch (error) {
    console.error('Get challenges error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, challengeId, completed } = updateChallengeSchema.parse(body);

    const challenge = await db.userChallenge.findFirst({
      where: {
        userId,
        challengeId,
        date: {
          gte: new Date(new Date().toDateString()),
          lt: new Date(new Date().getTime() + 24 * 60 * 60 * 1000)
        }
      }
    });

    if (!challenge) {
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 }
      );
    }

    const updatedChallenge = await db.userChallenge.update({
      where: { id: challenge.id },
      data: { completed }
    });

    // If completed, award XP to user
    if (completed && !challenge.completed) {
      await db.user.update({
        where: { id: userId },
        data: {
          totalXP: { increment: challenge.xpReward }
        }
      });
    }

    return NextResponse.json({ challenge: updatedChallenge });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Update challenge error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}