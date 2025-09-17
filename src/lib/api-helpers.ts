import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_ERROR: 500,
} as const;

export const ERROR_MESSAGES = {
  INVALID_INPUT: 'Invalid input',
  USER_NOT_FOUND: 'User not found',
  UNAUTHORIZED: 'Unauthorized',
  FORBIDDEN: 'Access denied',
  INTERNAL_ERROR: 'Internal server error',
  RESOURCE_NOT_FOUND: 'Resource not found',
} as const;

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  details?: any;
}

export function createResponse<T>(
  data?: T,
  status: number = HTTP_STATUS.OK
): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ data }, { status });
}

export function createErrorResponse(
  error: string,
  status: number = HTTP_STATUS.INTERNAL_ERROR,
  details?: any
): NextResponse<ApiResponse> {
  return NextResponse.json({ error, details }, { status });
}

export async function validateUser(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true }
  });
  
  if (!user) {
    throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
  }
  
  return user;
}

export function handleApiError(error: unknown) {
  if (error instanceof z.ZodError) {
    return createErrorResponse(
      ERROR_MESSAGES.INVALID_INPUT,
      HTTP_STATUS.BAD_REQUEST,
      error.errors
    );
  }

  if (error instanceof Error) {
    if (error.message === ERROR_MESSAGES.USER_NOT_FOUND) {
      return createErrorResponse(error.message, HTTP_STATUS.NOT_FOUND);
    }
    if (error.message === ERROR_MESSAGES.UNAUTHORIZED) {
      return createErrorResponse(error.message, HTTP_STATUS.UNAUTHORIZED);
    }
    if (error.message === ERROR_MESSAGES.FORBIDDEN) {
      return createErrorResponse(error.message, HTTP_STATUS.FORBIDDEN);
    }
  }

  console.error('API Error:', error);
  return createErrorResponse(ERROR_MESSAGES.INTERNAL_ERROR, HTTP_STATUS.INTERNAL_ERROR);
}

export async function withErrorHandling<T>(
  handler: () => Promise<NextResponse<T>>
): Promise<NextResponse<T | ApiResponse>> {
  try {
    return await handler();
  } catch (error) {
    return handleApiError(error);
  }
}

export function getUserIdFromRequest(request: NextRequest): string | null {
  const { searchParams } = new URL(request.url);
  return searchParams.get('userId');
}

export async function parseRequestBody<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): Promise<T> {
  const body = await request.json();
  return schema.parse(body);
}

export function withRateLimit<T>(
  rateLimiter: { check: (req: NextRequest) => NextResponse | null },
  handler: (req: NextRequest, ...args: any[]) => Promise<NextResponse<T>>
) {
  return async (request: NextRequest, ...args: any[]): Promise<NextResponse<T | ApiResponse>> => {
    const rateLimitResponse = rateLimiter.check(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
    return handler(request, ...args);
  };
}