import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateUserId } from '@/lib/validation';

function calculateStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  
  const sortedDates = [...new Set(dates)].sort();
  let streak = 0;
  let currentDate = new Date();
  
  for (let i = sortedDates.length - 1; i >= 0; i--) {
    const entryDate = new Date(sortedDates[i]);
    const daysDiff = Math.floor((currentDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === streak) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}

function calculateTodayStats(timeEntries: any[], timers: any[]) {
  const today = new Date().toDateString();
  const todayEntries = timeEntries.filter(entry => entry.date.toDateString() === today);
  const todayMinutes = todayEntries.reduce((sum, entry) => sum + entry.minutes, 0);
  const todayHours = Math.floor(todayMinutes / 60);
  const todayTasks = timers.filter(timer => new Date(timer.startedAt).toDateString() === today).length;
  
  return { todayHours, todayTasks };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = validateUserId(params.id);

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
    const { todayHours, todayTasks } = calculateTodayStats(user.timeEntries, user.timers);

    // Calculate streak
    const uniqueDates = user.timeEntries.map(e => e.date.toDateString());
    const streak = calculateStreak(uniqueDates);

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