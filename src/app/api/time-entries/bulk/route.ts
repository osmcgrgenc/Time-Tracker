import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const bulkDeleteSchema = z.object({
  userId: z.string(),
  timeEntryIds: z.array(z.string()),
});

const bulkInsertSchema = z.object({
  userId: z.string(),
  entries: z.array(z.object({
    date: z.string(),
    description: z.string().optional(),
    minutes: z.number(),
    billable: z.boolean(),
    projectId: z.string().optional(),
    taskId: z.string().optional(),
  })),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, entries } = bulkInsertSchema.parse(body);

    if (!entries || entries.length === 0) {
      return NextResponse.json(
        { error: 'No entries provided' },
        { status: 400 }
      );
    }

    // Create time entries
    const timeEntries = await db.timeEntry.createMany({
      data: entries.map(entry => ({
        userId,
        date: new Date(entry.date),
        description: entry.description,
        minutes: entry.minutes,
        billable: entry.billable,
        projectId: entry.projectId,
        taskId: entry.taskId,
      })),
    });

    return NextResponse.json({
      message: `Successfully created ${timeEntries.count} time entries`,
      createdCount: timeEntries.count,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Bulk insert time entries error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, timeEntryIds } = bulkDeleteSchema.parse(body);

    if (!timeEntryIds || timeEntryIds.length === 0) {
      return NextResponse.json(
        { error: 'No time entry IDs provided' },
        { status: 400 }
      );
    }

    // Delete time entries that belong to the user
    const result = await db.timeEntry.deleteMany({
      where: {
        id: {
          in: timeEntryIds,
        },
        userId,
      },
    });

    return NextResponse.json({
      message: `Successfully deleted ${result.count} time entries`,
      deletedCount: result.count,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Bulk delete time entries error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}