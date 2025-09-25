'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function ResetPasswordForm() {
  const t = useTranslations('auth.resetPassword');
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get('token') || '', [searchParams]);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccessful, setIsSuccessful] = useState(false);

  useEffect(() => {
    if (!token) {
      toast.error(t('toast.invalidToken'));
    }
  }, [token, t]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token) {
      toast.error(t('toast.invalidToken'));
      return;
    }

    if (password !== confirmPassword) {
      toast.error(t('toast.passwordMismatch'));
      return;
    }

    if (password.length < 6) {
      toast.error(t('toast.weakPassword'));
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('errors.resetFailed'));
      }

      setIsSuccessful(true);
      toast.success(data.message || t('toast.passwordUpdated'));

      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (error) {
      const message = error instanceof Error ? error.message : t('toast.resetError');
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const isTokenMissing = !token;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-3 rounded-full">
              <Lock className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('title')}</h1>
          <p className="text-gray-600">{t('description')}</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-semibold text-center">{t('title')}</CardTitle>
            <CardDescription className="text-center">
              {t('description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isTokenMissing ? (
              <Alert variant="destructive" className="mb-6">
                <AlertTitle>{t('errors.invalidToken')}</AlertTitle>
                <AlertDescription>
                  {t('toast.invalidToken')}
                </AlertDescription>
              </Alert>
            ) : null}

            {isSuccessful ? (
              <Alert className="mb-6">
                <AlertTitle>{t('success.title')}</AlertTitle>
                <AlertDescription>
                  {t('success.description')}
                </AlertDescription>
              </Alert>
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">{t('newPassword')}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={t('newPassword')}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={6}
                  disabled={isLoading || isTokenMissing || isSuccessful}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder={t('confirmPassword')}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                  minLength={6}
                  disabled={isLoading || isTokenMissing || isSuccessful}
                />
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium"
                disabled={isLoading || isTokenMissing || isSuccessful}
              >
                {isLoading ? t('toast.passwordUpdated') : t('resetButton')}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link href="/login" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors">
                <ArrowLeft className="h-4 w-4 mr-1" />
                {t('backToLogin')}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}