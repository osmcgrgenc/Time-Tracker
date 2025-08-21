import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const bulkDeleteSchema = z.object({
  userId: z.string(),
  timerIds: z.array(z.string()),
});

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, timerIds } = bulkDeleteSchema.parse(body);

    if (!timerIds || timerIds.length === 0) {
      return NextResponse.json(
        { error: 'No timer IDs provided' },
        { status: 400 }
      );
    }

    // Delete timers that belong to the user
    const result = await db.timer.deleteMany({
      where: {
        id: {
          in: timerIds,
        },
        userId,
      },
    });

    return NextResponse.json({
      message: `Successfully deleted ${result.count} timers`,
      deletedCount: result.count,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Bulk delete timers error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}