import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { z } from 'zod';

import { db } from '@/lib/db';
import { isEmailConfigured, sendPasswordResetEmail } from '@/lib/services/EmailService';

const requestSchema = z.object({
  email: z.string().email(),
});

function resolveAppUrl(req: NextRequest): string {
  const origin = req.headers.get('origin');
  if (origin) {
    return origin;
  }

  if (process.env.APP_URL) {
    return process.env.APP_URL;
  }

  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return 'http://localhost:3000';
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const { email } = requestSchema.parse(body);

    const responseBody = {
      message: 'Şifre sıfırlama talimatları, eğer bu e-posta ile kayıtlı bir hesabınız varsa gönderildi.',
    };

    const user = await db.user.findUnique({ where: { email } });

    if (!user) {
      // Always return success to avoid leaking which emails exist
      return NextResponse.json(responseBody);
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry

    await db.passwordResetToken.deleteMany({ where: { userId: user.id } });

    await db.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    const baseUrl = resolveAppUrl(req);
    const resetUrl = new URL('/reset-password', baseUrl);
    resetUrl.searchParams.set('token', rawToken);

    if (isEmailConfigured()) {
      await sendPasswordResetEmail({
        to: user.email,
        resetUrl: resetUrl.toString(),
      });
    } else {
      console.warn('SMTP credentials missing, logging reset URL for debugging only:', resetUrl.toString());
    }

    return NextResponse.json(responseBody);
  } catch (error) {
    console.error('Forgot password error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Geçersiz e-posta adresi' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Şifre sıfırlama isteği sırasında bir hata oluştu' }, { status: 500 });
  }
}
