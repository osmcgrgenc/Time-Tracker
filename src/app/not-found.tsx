import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Home, ArrowLeft, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg text-center">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4 rounded-full">
              <Clock className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
          <h2 className="text-3xl font-semibold text-gray-800 mb-2">Sayfa Bulunamadı</h2>
          <p className="text-gray-600 text-lg">
            Ups! Aradığınız sayfa kaybolmuş gibi görünüyor.
          </p>
        </div>

        {/* Error Card */}
        <Card className="shadow-xl border-0 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2 text-xl">
              <Search className="h-5 w-5 text-orange-600" />
              Ne oldu?
            </CardTitle>
            <CardDescription className="text-base">
              İstediğiniz sayfa bulunamadı. Sayfa taşınmış, silinmiş olabilir veya yanlış URL girmiş olabilirsiniz.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <Button asChild className="w-full h-12 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700">
                <Link href="/" className="flex items-center justify-center gap-2">
                  <Home className="h-4 w-4" />
                  Ana Sayfaya Git
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="w-full h-12 border-orange-200 hover:bg-orange-50">
                <Link href="javascript:history.back()" className="flex items-center justify-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Geri Dön
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Additional Help */}
        <div className="text-sm text-gray-500">
          <p className="mb-2">Yardıma mı ihtiyacınız var? İşte bazı öneriler:</p>
          <ul className="space-y-1">
            <li>• URL'de yazım hatası olup olmadığını kontrol edin</li>
            <li>• Aradığınızı bulmak için navigasyon menüsünü kullanın</li>
            <li>• Ana sayfaya dönün ve yeniden başlayın</li>
          </ul>
        </div>
      </div>
    </div>
  );
}