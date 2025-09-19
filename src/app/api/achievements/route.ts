import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sanitizeForLog } from '@/lib/validation';

const achievementTemplates = [
  {
    id: 'first_hour',
    title: 'Getting Started',
    description: 'Track your first hour',
    requirement: 1,
    xpReward: 50,
    category: 'time',
    rarity: 'common'
  },
  {
    id: 'ten_hours',
    title: 'Time Keeper',
    description: 'Track 10 hours total',
    requirement: 10,
    xpReward: 100,
    category: 'time',
    rarity: 'common'
  },
  {
    id: 'hundred_hours',
    title: 'Time Master',
    description: 'Track 100 hours total',
    requirement: 100,
    xpReward: 500,
    category: 'time',
    rarity: 'rare'
  },
  {
    id: 'first_task',
    title: 'Task Rookie',
    description: 'Complete your first task',
    requirement: 1,
    xpReward: 25,
    category: 'tasks',
    rarity: 'common'
  },
  {
    id: 'ten_tasks',
    title: 'Task Warrior',
    description: 'Complete 10 tasks',
    requirement: 10,
    xpReward: 150,
    category: 'tasks',
    rarity: 'common'
  },
  {
    id: 'week_streak',
    title: 'Consistent',
    description: 'Maintain a 7-day streak',
    requirement: 7,
    xpReward: 200,
    category: 'streak',
    rarity: 'rare'
  }
];

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

    // Get user's current stats
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        timeEntries: {
          select: { minutes: true }
        },
        timers: {
          where: { status: 'COMPLETED' },
          select: { id: true }
        },
        achievements: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Calculate current stats
    const totalHours = Math.floor(
      user.timeEntries.reduce((sum, entry) => sum + entry.minutes, 0) / 60
    );
    const completedTasks = user.timers.length;
    const streak = 0; // Simplified for now

    // Check achievements
    const achievements = achievementTemplates.map(template => {
      let current = 0;
      
      switch (template.category) {
        case 'time':
          current = totalHours;
          break;
        case 'tasks':
          current = completedTasks;
          break;
        case 'streak':
          current = streak;
          break;
      }
      
      const isUnlocked = user.achievements.some(a => a.achievementId === template.id);
      const shouldUnlock = !isUnlocked && current >= template.requirement;
      
      return {
        ...template,
        current: Math.min(current, template.requirement),
        unlocked: isUnlocked,
        shouldUnlock
      };
    });

    // Unlock new achievements
    const newAchievements = achievements.filter(a => a.shouldUnlock);
    
    if (newAchievements.length > 0) {
      const createPromises = newAchievements.map(achievement =>
        db.userAchievement.create({
          data: {
            userId,
            achievementId: achievement.id,
            title: sanitizeForLog(achievement.title),
            description: sanitizeForLog(achievement.description),
            xpReward: achievement.xpReward,
            category: achievement.category,
            rarity: achievement.rarity
          }
        })
      );

      await Promise.all(createPromises);

      // Award XP
      const totalXP = newAchievements.reduce((sum, a) => sum + a.xpReward, 0);
      await db.user.update({
        where: { id: userId },
        data: {
          totalXP: { increment: totalXP }
        }
      });
    }

    return NextResponse.json({ 
      achievements: achievements.map(a => ({
        ...a,
        title: sanitizeForLog(a.title),
        description: sanitizeForLog(a.description),
        unlocked: a.unlocked || a.shouldUnlock
      })),
      newUnlocked: newAchievements.map(a => ({
        ...a,
        title: sanitizeForLog(a.title),
        description: sanitizeForLog(a.description)
      }))
    });
  } catch (error) {
    console.error('Get achievements error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}