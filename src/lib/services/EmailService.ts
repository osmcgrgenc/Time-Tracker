import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_SECURE = process.env.SMTP_SECURE === 'true';
const EMAIL_FROM = process.env.EMAIL_FROM;

export function isEmailConfigured(): boolean {
  return Boolean(SMTP_HOST && SMTP_PORT && EMAIL_FROM);
}

export async function sendPasswordResetEmail(options: {
  to: string;
  resetUrl: string;
}): Promise<void> {
  if (!isEmailConfigured()) {
    console.warn('SMTP configuration missing. Skipping password reset email.', {
      to: options.to,
      resetUrl: options.resetUrl,
    });
    return;
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  });

  await transporter.sendMail({
    from: EMAIL_FROM,
    to: options.to,
    subject: 'Şifre Sıfırlama Talebi',
    text: [
      'Time Tracker hesabınız için bir şifre sıfırlama talebi aldık.',
      'Eğer bu işlemi siz başlatmadıysanız, lütfen bu e-postayı yok sayın.',
      '',
      `Şifrenizi sıfırlamak için aşağıdaki bağlantıya tıklayın: ${options.resetUrl}`,
      '',
      'Bu bağlantı 1 saat boyunca geçerlidir.',
    ].join('\n'),
    html: [
      '<p>Time Tracker hesabınız için bir şifre sıfırlama talebi aldık.</p>',
      '<p>Eğer bu işlemi siz başlatmadıysanız, lütfen bu e-postayı yok sayın.</p>',
      '<p><a href="' + options.resetUrl + '">Şifrenizi sıfırlamak için buraya tıklayın</a>.</p>',
      '<p>Bu bağlantı 1 saat boyunca geçerlidir.</p>',
    ].join(''),
  });
}
