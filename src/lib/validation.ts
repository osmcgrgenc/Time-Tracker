import { z } from 'zod';

export const userIdSchema = z.string().cuid();
export const limitSchema = z.coerce.number().int().min(1).max(100).default(10);
export const dateStringSchema = z.string().refine((date) => !isNaN(Date.parse(date)), {
  message: "Invalid date format"
});

export function sanitizeForLog(input: string): string {
  return input.replace(/[\r\n\t]/g, ' ').substring(0, 200);
}

export function validateUserId(userId: string | null): string {
  if (!userId) {
    throw new Error('User ID is required');
  }
  return userIdSchema.parse(userId);
}

export function validateLimit(limit: string | null): number {
  return limitSchema.parse(limit);
}

export function validateDateString(dateStr: string): Date {
  const validatedStr = dateStringSchema.parse(dateStr);
  return new Date(validatedStr);
}