'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Home, RefreshCw, AlertTriangle } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg text-center">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-4 rounded-full">
              <AlertTriangle className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Ups!</h1>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Bir şeyler ters gitti</h2>
          <p className="text-gray-600 text-lg">
            Beklenmeyen bir hatayla karşılaştık. Merak etmeyin, üzerinde çalışıyoruz!
          </p>
        </div>

        {/* Error Card */}
        <Card className="shadow-xl border-0 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2 text-xl text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Hata Detayları
            </CardTitle>
            <CardDescription className="text-base">
              {error.message || 'İsteğinizi işlerken beklenmeyen bir hata oluştu.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <Button 
                onClick={reset}
                className="w-full h-12 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Tekrar Dene
              </Button>
              
              <Button asChild variant="outline" className="w-full h-12 border-red-200 hover:bg-red-50">
                <Link href="/" className="flex items-center justify-center gap-2">
                  <Home className="h-4 w-4" />
                  Ana Sayfaya Git
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <div className="text-sm text-gray-500">
          <p className="mb-2">Yapabilecekleriniz:</p>
          <ul className="space-y-1">
            <li>• Sayfayı yenilemeyi deneyin</li>
            <li>• İnternet bağlantınızı kontrol edin</li>
            <li>• Ana sayfaya dönün ve tekrar deneyin</li>
            <li>• Sorun devam ederse destek ile iletişime geçin</li>
          </ul>
          
          {error.digest && (
            <div className="mt-4 p-3 bg-gray-100 rounded-lg">
              <p className="text-xs text-gray-600">
                Hata ID: <code className="bg-gray-200 px-1 rounded">{error.digest}</code>
              </p>
            </div>
          )}
        </div>

        {/* Time Tracker Branding */}
        <div className="mt-8 flex items-center justify-center gap-2 text-gray-400">
          <Clock className="h-4 w-4" />
          <span className="text-sm">Time Tracker</span>
        </div>
      </div>
    </div>
  );
}