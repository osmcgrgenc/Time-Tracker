import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const getTimeEntriesSchema = z.object({
  userId: z.string(),
  from: z.string().optional(),
  to: z.string().optional(),
  projectId: z.string().optional(),
  taskId: z.string().optional(),
  billable: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = {
      userId: searchParams.get('userId'),
      from: searchParams.get('from'),
      to: searchParams.get('to'),
      projectId: searchParams.get('projectId'),
      taskId: searchParams.get('taskId'),
      billable: searchParams.get('billable') === 'true' ? true : 
                searchParams.get('billable') === 'false' ? false : undefined,
    };

    const validatedParams = getTimeEntriesSchema.parse(params);

    const where: any = { userId: validatedParams.userId };
    
    if (validatedParams.from) {
      where.date = { gte: new Date(validatedParams.from) };
    }
    
    if (validatedParams.to) {
      where.date = { 
        ...where.date,
        lte: new Date(validatedParams.to) 
      };
    }
    
    if (validatedParams.projectId) {
      where.projectId = validatedParams.projectId;
    }
    
    if (validatedParams.taskId) {
      where.taskId = validatedParams.taskId;
    }
    
    if (validatedParams.billable !== undefined) {
      where.billable = validatedParams.billable;
    }

    const timeEntries = await db.timeEntry.findMany({
      where,
      include: {
        project: {
          select: { id: true, name: true, client: true },
        },
        task: {
          select: { id: true, title: true, status: true },
        },
      },
      orderBy: { date: 'desc' },
    });

    // Calculate summary statistics
    const totalMinutes = timeEntries.reduce((sum, entry) => sum + entry.minutes, 0);
    const billableMinutes = timeEntries
      .filter(entry => entry.billable)
      .reduce((sum, entry) => sum + entry.minutes, 0);

    // Group by project
    const projectSummary = timeEntries.reduce((acc, entry) => {
      const projectId = entry.projectId || 'unassigned';
      const projectName = entry.project?.name || 'Unassigned';
      
      if (!acc[projectId]) {
        acc[projectId] = {
          projectId,
          projectName,
          totalMinutes: 0,
          billableMinutes: 0,
          entryCount: 0,
        };
      }
      
      acc[projectId].totalMinutes += entry.minutes;
      acc[projectId].billableMinutes += entry.billable ? entry.minutes : 0;
      acc[projectId].entryCount += 1;
      
      return acc;
    }, {} as any);

    // Group by task
    const taskSummary = timeEntries.reduce((acc, entry) => {
      const taskId = entry.taskId || 'unassigned';
      const taskTitle = entry.task?.title || 'Unassigned';
      
      if (!acc[taskId]) {
        acc[taskId] = {
          taskId,
          taskTitle,
          totalMinutes: 0,
          billableMinutes: 0,
          entryCount: 0,
        };
      }
      
      acc[taskId].totalMinutes += entry.minutes;
      acc[taskId].billableMinutes += entry.billable ? entry.minutes : 0;
      acc[taskId].entryCount += 1;
      
      return acc;
    }, {} as any);

    return NextResponse.json({
      timeEntries,
      summary: {
        totalMinutes,
        billableMinutes,
        totalEntries: timeEntries.length,
        projectSummary: Object.values(projectSummary),
        taskSummary: Object.values(taskSummary),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Get time entries error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}