'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Shield } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Şifre sıfırlama isteği gönderilirken bir hata oluştu');
      }

      setIsSubmitted(true);
      toast.success('Şifre sıfırlama talimatları e-posta adresinize gönderildi.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Şifre sıfırlama isteği gönderilirken bir hata oluştu';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-3 rounded-full">
              <Shield className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Şifrenizi mi Unuttunuz?</h1>
          <p className="text-gray-600">E-posta adresinizi girin, size sıfırlama bağlantısı gönderelim.</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-semibold text-center">Şifre Sıfırlama</CardTitle>
            <CardDescription className="text-center">
              Kayıtlı e-posta adresinizi kullanarak hesabınızın kontrolünü tekrar kazanın
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isSubmitted ? (
              <Alert className="mb-6">
                <AlertTitle>Talimatlar gönderildi</AlertTitle>
                <AlertDescription>
                  E-postanızı kontrol edin. Gelen kutunuzda göremiyorsanız spam klasörünüzü de kontrol etmeyi unutmayın.
                </AlertDescription>
              </Alert>
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-posta Adresi</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="ornek@eposta.com"
                    className="h-11 pl-10"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium"
                disabled={isLoading}
              >
                {isLoading ? 'Gönderiliyor...' : 'Sıfırlama Bağlantısı Gönder'}
              </Button>
            </form>

            <div className="mt-6 text-center space-y-2">
              <p className="text-sm text-gray-600">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="font-medium text-orange-600 hover:text-orange-500 transition-colors"
                >
                  Geri dön
                </button>
              </p>
              <p className="text-sm text-gray-600">
                Şifrenizi hatırladınız mı?{' '}
                <Link href="/login" className="font-medium text-orange-600 hover:text-orange-500 transition-colors">
                  Giriş ekranına gidin
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
