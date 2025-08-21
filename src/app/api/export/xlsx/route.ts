import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import * as XLSX from 'xlsx';

const exportSchema = z.object({
  userId: z.string(),
  from: z.string().optional(),
  to: z.string().optional(),
  projectId: z.string().optional(),
  taskId: z.string().optional(),
  billable: z.boolean().optional(),
  groupBy: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      from,
      to,
      projectId,
      taskId,
      billable,
      groupBy = [],
    } = exportSchema.parse(body);

    // Build where clause
    const where: any = { userId };
    
    if (from) {
      where.date = { gte: new Date(from) };
    }
    
    if (to) {
      where.date = { 
        ...where.date,
        lte: new Date(to) 
      };
    }
    
    if (projectId) {
      where.projectId = projectId;
    }
    
    if (taskId) {
      where.taskId = taskId;
    }
    
    if (billable !== undefined) {
      where.billable = billable;
    }

    // Fetch time entries with related data
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

    // Prepare data for Excel
    const excelData = timeEntries.map((entry) => ({
      'Date': entry.date.toISOString().split('T')[0],
      'Project': entry.project?.name || 'Unassigned',
      'Client': entry.project?.client || '',
      'Task': entry.task?.title || 'Unassigned',
      'Description': entry.description || '',
      'Duration (Hours)': (entry.minutes / 60).toFixed(2),
      'Duration (Minutes)': entry.minutes,
      'Billable': entry.billable ? 'Yes' : 'No',
      'Created At': entry.createdAt.toISOString().split('T')[0],
    }));

    // Create workbook
    const ws = XLSX.utils.json_to_sheet(excelData);
    
    // Auto-size columns
    const colWidths = Object.keys(excelData[0] || {}).map(key => ({
      wch: Math.max(key.length, ...excelData.map(row => String(row[key]).length))
    }));
    ws['!cols'] = colWidths;

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Timesheet');

    // Add summary sheet if requested
    if (groupBy.length > 0) {
      const summaryData = generateSummaryData(timeEntries, groupBy);
      const summaryWs = XLSX.utils.json_to_sheet(summaryData);
      summaryWs['!cols'] = Object.keys(summaryData[0] || {}).map(key => ({
        wch: Math.max(key.length, ...summaryData.map(row => String(row[key]).length))
      }));
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
    }

    // Generate Excel buffer
    const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Generate filename
    const fromDate = from ? new Date(from).toISOString().split('T')[0] : 'start';
    const toDate = to ? new Date(to).toISOString().split('T')[0] : 'end';
    const filename = `timesheet-${fromDate}-to-${toDate}.xlsx`;

    // Return response
    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateSummaryData(timeEntries: any[], groupBy: string[]) {
  const grouped = timeEntries.reduce((acc, entry) => {
    const key = groupBy.map(field => {
      switch (field) {
        case 'date':
          return entry.date.toISOString().split('T')[0];
        case 'project':
          return entry.project?.name || 'Unassigned';
        case 'task':
          return entry.task?.title || 'Unassigned';
        case 'billable':
          return entry.billable ? 'Billable' : 'Non-billable';
        default:
          return 'Unknown';
      }
    }).join(' - ');

    if (!acc[key]) {
      acc[key] = {
        Group: key,
        'Total Hours': 0,
        'Total Minutes': 0,
        'Entry Count': 0,
        'Billable Hours': 0,
        'Non-billable Hours': 0,
      };
    }

    acc[key]['Total Hours'] += entry.minutes / 60;
    acc[key]['Total Minutes'] += entry.minutes;
    acc[key]['Entry Count'] += 1;
    
    if (entry.billable) {
      acc[key]['Billable Hours'] += entry.minutes / 60;
    } else {
      acc[key]['Non-billable Hours'] += entry.minutes / 60;
    }

    return acc;
  }, {});

  return Object.values(grouped).map((group: any) => ({
    ...group,
    'Total Hours': Math.round(group['Total Hours'] * 100) / 100,
    'Billable Hours': Math.round(group['Billable Hours'] * 100) / 100,
    'Non-billable Hours': Math.round(group['Non-billable Hours'] * 100) / 100,
  }));
}