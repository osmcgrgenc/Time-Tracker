'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Eye, EyeOff, Clock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const showRegistrationSuccess = useMemo(() => {
    const registeredParam = searchParams.get('registered');
    return registeredParam === 'success';
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
        callbackUrl: '/'
      });
      
      if (result?.error) {
        let errorMessage = 'Giriş yapılırken bir hata oluştu.';

        switch (result.error) {
          case 'CredentialsSignin':
            errorMessage = 'E-posta veya şifre hatalı. Lütfen bilgilerinizi kontrol edin.';
            break;
          case 'EmailSignin':
            errorMessage = 'E-posta adresinize gönderilen bağlantıyı kullanarak giriş yapın.';
            break;
          case 'OAuthSignin':
            errorMessage = 'Sosyal medya girişi sırasında bir hata oluştu.';
            break;
          case 'SessionRequired':
            errorMessage = 'Bu işlem için giriş yapmanız gerekiyor.';
            break;
          default:
            errorMessage = 'Giriş yapılırken beklenmedik bir hata oluştu. Lütfen tekrar deneyin.';
        }

        toast.error(errorMessage);
      } else if (result?.ok) {
        toast.success('Giriş başarılı!');
        router.push('/');
        router.refresh(); // Session'ı yenile
      }
    } catch (error) {
      toast.error('Giriş sırasında bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-3 rounded-full">
              <Clock className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tekrar Hoş Geldiniz</h1>
          <p className="text-gray-600">Time Tracker hesabınıza giriş yapın</p>
        </div>

        {/* Login Form */}
        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-semibold text-center">Giriş Yap</CardTitle>
            <CardDescription className="text-center">
              Hesabınıza erişmek için bilgilerinizi girin
            </CardDescription>
          </CardHeader>
          <CardContent>
            {showRegistrationSuccess ? (
              <Alert className="mb-4 border-green-200 bg-green-50">
                <AlertTitle className="text-green-800 flex items-center gap-2">
                  🎉 Hoş geldiniz! Hesabınız başarıyla oluşturuldu
                </AlertTitle>
                <AlertDescription className="text-green-700">
                  Artık Time Tracker'ı kullanmaya başlayabilirsiniz. Aşağıdaki formu kullanarak giriş yapın ve zamanınızı yönetmeye başlayın!
                </AlertDescription>
              </Alert>
            ) : null}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  E-posta Adresi
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="E-posta adresinizi girin"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                  className="h-11"
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Şifre
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Şifrenizi girin"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    required
                    className="h-11 pr-10"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="text-right">
                <Link
                  href="/forgot-password"
                  className="text-sm font-medium text-orange-600 hover:text-orange-500 transition-colors"
                >
                  Şifremi unuttum
                </Link>
              </div>

              <Button 
                type="submit" 
                className="w-full h-11 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium"
                disabled={isLoading}
              >
                {isLoading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
              </Button>
            </form>

            {/* Divider */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Hesabınız yok mu?{' '}
                <Link 
                  href="/signup" 
                  className="font-medium text-orange-600 hover:text-orange-500 transition-colors"
                >
                  Buradan kayıt olun
                </Link>
              </p>
            </div>

            {/* Back to Home */}
            <div className="mt-4 text-center">
              <Link 
                href="/" 
                className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Ana Sayfaya Dön
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}