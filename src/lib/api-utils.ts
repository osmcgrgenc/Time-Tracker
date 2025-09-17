import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error);

  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: 'Invalid input', details: error.errors },
      { status: 400 }
    );
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return NextResponse.json(
          { error: 'Resource already exists' },
          { status: 409 }
        );
      case 'P2025':
        return NextResponse.json(
          { error: 'Resource not found' },
          { status: 404 }
        );
      case 'P2003':
        return NextResponse.json(
          { error: 'Invalid reference' },
          { status: 400 }
        );
      default:
        return NextResponse.json(
          { error: 'Database error' },
          { status: 500 }
        );
    }
  }

  if (error instanceof Error) {
    if (error.message.includes('User ID is required')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    if (error.message.includes('Invalid date')) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }
  }

  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}