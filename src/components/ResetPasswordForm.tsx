'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get('token') || '', [searchParams]);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccessful, setIsSuccessful] = useState(false);

  useEffect(() => {
    if (!token) {
      toast.error('Geçersiz veya eksik şifre sıfırlama bağlantısı.');
    }
  }, [token]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token) {
      toast.error('Bu şifre sıfırlama bağlantısı geçersiz görünüyor.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Şifreler eşleşmiyor. Lütfen aynı şifreyi girin.');
      return;
    }

    if (password.length < 6) {
      toast.error('Şifreniz en az 6 karakter olmalıdır.');
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
        throw new Error(data.error || 'Şifreniz güncellenemedi.');
      }

      setIsSuccessful(true);
      toast.success(data.message || 'Şifreniz başarıyla güncellendi.');

      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Şifre sıfırlanırken bir sorun oluştu.';
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Yeni Şifrenizi Oluşturun</h1>
          <p className="text-gray-600">Güvenliğiniz için güçlü bir şifre seçmenizi öneririz.</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-semibold text-center">Şifreyi Sıfırla</CardTitle>
            <CardDescription className="text-center">
              Şifre sıfırlama bağlantınızı kullanarak hesabınıza güvenle dönüş yapın
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isTokenMissing ? (
              <Alert variant="destructive" className="mb-6">
                <AlertTitle>Bağlantı geçersiz</AlertTitle>
                <AlertDescription>
                  Şifre sıfırlama bağlantınız eksik veya süresi dolmuş olabilir. Lütfen tekrar talep edin.
                </AlertDescription>
              </Alert>
            ) : null}

            {isSuccessful ? (
              <Alert className="mb-6">
                <AlertTitle>Şifreniz güncellendi</AlertTitle>
                <AlertDescription>
                  Birkaç saniye içinde giriş sayfasına yönlendirileceksiniz. Yeni şifrenizle giriş yapabilirsiniz.
                </AlertDescription>
              </Alert>
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Yeni Şifre</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Yeni şifrenizi girin"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={6}
                  disabled={isLoading || isTokenMissing || isSuccessful}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Yeni Şifre (Tekrar)</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Yeni şifrenizi tekrar girin"
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
                {isLoading ? 'Şifre güncelleniyor...' : 'Şifremi Güncelle'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link href="/login" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Giriş ekranına dön
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}