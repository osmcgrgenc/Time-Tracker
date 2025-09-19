import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const updateProgressSchema = z.object({
  userId: z.string(),
  userStats: z.object({
    todayHours: z.number(),
    todayTasks: z.number(),
    currentStreak: z.number(),
    focusTime: z.number(),
  })
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, userStats } = updateProgressSchema.parse(body);

    const today = new Date().toDateString();
    
    // Get today's challenges
    const challenges = await db.userChallenge.findMany({
      where: {
        userId,
        date: {
          gte: new Date(today),
          lt: new Date(new Date(today).getTime() + 24 * 60 * 60 * 1000)
        }
      }
    });

    const updatedChallenges: any[] = [];
    let totalXPGained = 0;

    for (const challenge of challenges) {
      let current = 0;
      
      switch (challenge.type) {
        case 'time':
          current = userStats.todayHours;
          break;
        case 'tasks':
          current = userStats.todayTasks;
          break;
        case 'focus':
          current = userStats.focusTime;
          break;
        case 'streak':
          current = userStats.currentStreak;
          break;
      }
      
      const wasCompleted = challenge.completed;
      const isCompleted = current >= challenge.target;
      
      if (!wasCompleted && isCompleted) {
        totalXPGained += challenge.xpReward;
      }
      
      const updatedChallenge = await db.userChallenge.update({
        where: { id: challenge.id },
        data: {
          current: Math.min(current, challenge.target),
          completed: isCompleted
        }
      });
      
      updatedChallenges.push(updatedChallenge);
    }

    // Award XP if any challenges were completed
    if (totalXPGained > 0) {
      await db.user.update({
        where: { id: userId },
        data: {
          totalXP: { increment: totalXPGained }
        }
      });
    }

    return NextResponse.json({ 
      challenges: updatedChallenges,
      xpGained: totalXPGained
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Update challenge progress error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}