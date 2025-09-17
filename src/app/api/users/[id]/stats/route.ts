import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;

    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        timeEntries: {
          select: {
            minutes: true,
            date: true
          }
        },
        timers: {
          where: { status: 'COMPLETED' },
          select: { id: true, startedAt: true }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Calculate total hours
    const totalMinutes = user.timeEntries.reduce((sum, entry) => sum + entry.minutes, 0);
    const totalHours = Math.floor(totalMinutes / 60);

    // Calculate completed tasks
    const completedTasks = user.timers.length;

    // Calculate today's stats
    const today = new Date().toDateString();
    const todayEntries = user.timeEntries.filter(entry => 
      entry.date.toDateString() === today
    );
    const todayMinutes = todayEntries.reduce((sum, entry) => sum + entry.minutes, 0);
    const todayHours = Math.floor(todayMinutes / 60);
    
    const todayTasks = user.timers.filter(timer => 
      new Date(timer.startedAt).toDateString() === today
    ).length;

    // Calculate streak (simplified)
    const uniqueDates = [...new Set(user.timeEntries.map(e => e.date.toDateString()))].sort();
    let streak = 0;
    let currentDate = new Date();
    
    for (let i = uniqueDates.length - 1; i >= 0; i--) {
      const entryDate = new Date(uniqueDates[i]);
      const daysDiff = Math.floor((currentDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === streak) {
        streak++;
      } else {
        break;
      }
    }

    // Calculate level based on XP
    const currentXP = user.xp || 0;
    const level = Math.floor(currentXP / 100) + 1;
    const xpToNext = 100 - (currentXP % 100);

    // Update user level if changed
    if (user.level !== level) {
      await db.user.update({
        where: { id: userId },
        data: { level }
      });
    }

    const stats = {
      level,
      xp: currentXP,
      xpToNext,
      streak,
      totalHours,
      completedTasks,
      todayHours,
      todayTasks,
      focusTime: 0 // This would need to be tracked separately
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Get user stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}