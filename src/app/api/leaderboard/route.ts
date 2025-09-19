import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateLimit, sanitizeForLog } from '@/lib/validation';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'xp';
    const limit = validateLimit(searchParams.get('limit'));

    // Get all users with their stats
    const users = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        level: true,
        totalXP: true,
        _count: {
          select: {
            timers: {
              where: { status: 'COMPLETED' }
            },
            timeEntries: true
          }
        },
        timeEntries: {
          select: {
            minutes: true,
            date: true
          }
        }
      }
    });

    // Calculate stats for each user
    const leaderboardData = users.map(user => {
      const totalHours = Math.floor(
        user.timeEntries.reduce((sum, entry) => sum + entry.minutes, 0) / 60
      );
      
      const completedTasks = user._count.timers;
      
      // Calculate streak (simplified - consecutive days with time entries)
      const sortedDates = [...new Set(user.timeEntries.map(e => e.date.toDateString()))].sort();
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

      return {
        id: user.id,
        name: sanitizeForLog(user.name || user.email.split('@')[0]),
        level: user.level || 1,
        xp: user.totalXP || 0,
        totalHours,
        completedTasks,
        streak
      };
    });

    // Sort based on type
    const sortedData = leaderboardData.sort((a, b) => {
      switch (type) {
        case 'hours':
          return b.totalHours - a.totalHours;
        case 'tasks':
          return b.completedTasks - a.completedTasks;
        case 'streak':
          return b.streak - a.streak;
        default: // xp
          return b.xp - a.xp;
      }
    });

    // Add ranks and limit results
    const rankedData = sortedData.slice(0, limit).map((entry, index) => ({
      ...entry,
      rank: index + 1
    }));

    return NextResponse.json({ leaderboard: rankedData });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}