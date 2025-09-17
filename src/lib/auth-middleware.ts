import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { ERROR_MESSAGES } from '@/lib/api-helpers';

export async function validateResourceOwnership(
  userId: string,
  resourceType: 'timer' | 'project' | 'task' | 'timeEntry',
  resourceId: string
): Promise<boolean> {
  switch (resourceType) {
    case 'timer':
      const timer = await db.timer.findFirst({
        where: { id: resourceId, userId },
        select: { id: true }
      });
      return !!timer;

    case 'project':
      const project = await db.project.findFirst({
        where: { id: resourceId, ownerId: userId },
        select: { id: true }
      });
      return !!project;

    case 'task':
      const task = await db.task.findFirst({
        where: { 
          id: resourceId,
          project: { ownerId: userId }
        },
        select: { id: true }
      });
      return !!task;

    case 'timeEntry':
      const timeEntry = await db.timeEntry.findFirst({
        where: { id: resourceId, userId },
        select: { id: true }
      });
      return !!timeEntry;

    default:
      return false;
  }
}

export async function requireResourceOwnership(
  userId: string,
  resourceType: 'timer' | 'project' | 'task' | 'timeEntry',
  resourceId: string
): Promise<void> {
  const hasAccess = await validateResourceOwnership(userId, resourceType, resourceId);
  
  if (!hasAccess) {
    throw new Error(ERROR_MESSAGES.FORBIDDEN);
  }
}