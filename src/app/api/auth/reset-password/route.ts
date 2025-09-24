import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { z } from 'zod';

import { db } from '@/lib/db';

const resetSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır'),
});

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { token, password } = resetSchema.parse(body);

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const passwordResetToken = await db.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!passwordResetToken || passwordResetToken.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Bu şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş.' }, { status: 400 });
    }

    if (!passwordResetToken.user) {
      return NextResponse.json({ error: 'Bu şifre sıfırlama isteğiyle eşleşen kullanıcı bulunamadı.' }, { status: 404 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await db.$transaction([
      db.user.update({
        where: { id: passwordResetToken.userId },
        data: { hashedPassword },
      }),
      db.passwordResetToken.deleteMany({ where: { userId: passwordResetToken.userId } }),
    ]);

    return NextResponse.json({ message: 'Şifreniz başarıyla güncellendi. Lütfen yeni şifrenizle giriş yapın.' });
  } catch (error) {
    console.error('Reset password error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? 'Geçersiz talep' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Şifre sıfırlanırken bir hata oluştu' }, { status: 500 });
  }
}
