'use client';

import { useAuth } from '@/contexts/AuthContext';
import GamifiedDashboard from '@/components/dashboard/GamifiedDashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Clock, Target, Trophy, Zap, Users, BarChart3 } from 'lucide-react';

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user) {
    return <GamifiedDashboard />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <main id="main-content">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-purple-600/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl animate-pulse">
                <Clock className="h-10 w-10 text-white" />
              </div>
            </div>
            <h1 className="text-6xl md:text-7xl font-bold text-white mb-6 bg-gradient-to-r from-orange-400 to-purple-400 bg-clip-text text-transparent">
              TimeTracker
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Zamanınızı takip edin, hedeflerinize ulaşın ve oyunlaştırma ile motivasyonunuzu artırın. 
              Profesyonel zaman yönetimi artık daha eğlenceli!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/signup">
                <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
                  Ücretsiz Başla
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" className="border-2 border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
                  Giriş Yap
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-gradient-to-b from-transparent to-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Neden TimeTracker?
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Zaman yönetimini oyuna çeviren özelliklerle verimliliğinizi artırın
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 hover:border-orange-500/50 transition-all duration-300 transform hover:scale-105">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center mb-4">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-white text-xl">Hedef Takibi</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">
                  Günlük, haftalık ve aylık hedeflerinizi belirleyin ve ilerlemenizi takip edin.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 hover:border-purple-500/50 transition-all duration-300 transform hover:scale-105">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                  <Trophy className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-white text-xl">Oyunlaştırma</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">
                  XP kazanın, seviye atlayın ve başarılarınızı rozetlerle ödüllendirin.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 hover:border-blue-500/50 transition-all duration-300 transform hover:scale-105">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-white text-xl">Detaylı Analiz</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">
                  Zaman kullanımınızı analiz edin ve verimliliğinizi artıracak içgörüler elde edin.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 hover:border-green-500/50 transition-all duration-300 transform hover:scale-105">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-white text-xl">Hızlı Başlangıç</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">
                  Tek tıkla zaman takibine başlayın, projelerinizi organize edin.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 hover:border-pink-500/50 transition-all duration-300 transform hover:scale-105">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-pink-600 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-white text-xl">Takım Çalışması</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">
                  Takım üyeleriyle birlikte çalışın ve ortak projeleri yönetin.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 hover:border-yellow-500/50 transition-all duration-300 transform hover:scale-105">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center mb-4">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-white text-xl">Pomodoro Timer</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">
                  Pomodoro tekniği ile odaklanın ve düzenli molalar alın.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-r from-orange-500/10 to-purple-600/10">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Hemen Başlayın!
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Zaman yönetiminde yeni bir deneyim yaşayın. Ücretsiz hesap oluşturun ve 
            verimliliğinizi artırmaya başlayın.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/signup">
              <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-10 py-4 text-xl font-bold rounded-xl shadow-2xl hover:shadow-3xl transform hover:scale-110 transition-all duration-300">
                Ücretsiz Hesap Oluştur
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="ghost" className="text-purple-400 hover:text-white hover:bg-purple-500/20 px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-200">
                Zaten hesabım var →
              </Button>
            </Link>
          </div>
        </div>
      </div>
      </main>
    </div>
  );
}
