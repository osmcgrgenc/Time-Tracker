import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { getLocaleFromHeaders, createI18nErrorResponse, createI18nResponse } from '@/lib/i18n-server';

const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  password: z.string().min(6),
});

export async function POST(request: NextRequest) {
  try {
    const locale = await getLocaleFromHeaders();
    const body = await request.json();
    const { email, name, password } = registerSchema.parse(body);
    
    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return createI18nErrorResponse(
        'auth.errors.userExists',
        { status: 400, locale }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await db.user.create({
      data: {
        email,
        name,
        hashedPassword: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    return createI18nResponse(
      { user },
      { 
        status: 201, 
        locale,
        messageKey: 'auth.success.registered'
      }
    );
  } catch (error) {
    const locale = await getLocaleFromHeaders();
    
    if (error instanceof z.ZodError) {
      return createI18nErrorResponse(
        'errors.validation',
        { 
          status: 400, 
          locale,
          details: error.issues 
        }
      );
    }

    console.error('Registration error:', error);
    return createI18nErrorResponse(
      'errors.server',
      { status: 500, locale }
    );
  }
}