'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Clock, BarChart3, Users, Zap, CheckCircle, ArrowRight, Star, Shield, Smartphone, Target, Trophy, Timer, CheckSquare } from 'lucide-react';
import GamifiedDashboard from '@/components/dashboard/GamifiedDashboard';
import { Header } from '@/components/Header';

export default function Home() {
  const { user, loading } = useAuth();
  const t = useTranslations('home');
  const tCommon = useTranslations('common');

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

  const features = [
    {
      icon: Timer,
      title: t('features.pomodoro.title'),
      description: t('features.pomodoro.description')
    },
    {
      icon: Trophy,
      title: t('features.gamification.title'),
      description: t('features.gamification.description')
    },
    {
      icon: CheckSquare,
      title: t('features.taskManagement.title'),
      description: t('features.taskManagement.description')
    },
    {
      icon: BarChart3,
      title: t('features.analytics.title'),
      description: t('features.analytics.description')
    }
  ];

  const testimonials = [
    {
      name: t('socialProof.testimonials.0.name'),
      role: t('socialProof.testimonials.0.role'),
      content: t('socialProof.testimonials.0.content'),
      rating: t('socialProof.testimonials.0.rating')
    },
    {
      name: t('socialProof.testimonials.1.name'),
      role: t('socialProof.testimonials.1.role'),
      content: t('socialProof.testimonials.1.content'),
      rating: t('socialProof.testimonials.1.rating')
    },
    {
      name: t('socialProof.testimonials.2.name'),
      role: t('socialProof.testimonials.2.role'),
      content: t('socialProof.testimonials.2.content'),
      rating: t('socialProof.testimonials.2.rating')
    }
  ];

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <main id="main-content">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Badge variant="secondary" className="mb-4 px-4 py-2 text-sm font-medium bg-emerald-100 text-emerald-800 border-emerald-200">
              ✨ {t('hero.badge')}
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-600 bg-clip-text text-transparent">
                {t('hero.title')}
              </span>
            </h1>
            <p className="mt-6 text-xl leading-8 text-gray-700 max-w-3xl mx-auto">
              {t('hero.subtitle')}
            </p>
            <p className="mt-3 text-lg text-gray-600 max-w-2xl mx-auto">
              {t('hero.description')}
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-10 flex items-center justify-center gap-x-6"
          >
            <Link href="/signup">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
                {t('hero.getStarted')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/signup?team=true">
              <Button variant="outline" size="lg" className="border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 px-8 py-4 text-lg font-semibold transition-all duration-300">
                {t('hero.getStartedTeam')}
                <Users className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mx-auto max-w-2xl text-center"
          >
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              {t('features.title')}
            </h2>
          </motion.div>
          
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-12 lg:max-w-none lg:grid-cols-2 xl:grid-cols-4">
              {features.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <Card className="h-full border-0 bg-white/60 backdrop-blur-sm hover:bg-white/90 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 group">
                      <CardHeader>
                        <div className="flex flex-col items-center text-center">
                          <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 p-4 mb-4 group-hover:scale-110 transition-transform duration-300">
                            <Icon className="h-8 w-8 text-white" />
                          </div>
                          <CardTitle className="text-xl font-bold text-gray-900">{feature.title}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="text-center">
                        <p className="text-base text-gray-600 leading-relaxed">
                          {feature.description}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </dl>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-24 sm:py-32 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mx-auto max-w-2xl text-center"
          >
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              {t('socialProof.title')}
            </h2>
          </motion.div>
          
          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 lg:mx-0 lg:max-w-none lg:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full bg-gradient-to-br from-blue-50 to-purple-50 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-center gap-1 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <CardDescription className="text-base text-gray-700 leading-relaxed italic">
                      "{testimonial.content}"
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {testimonial.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{testimonial.name}</p>
                        <p className="text-sm text-gray-600">{testimonial.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative isolate overflow-hidden bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 px-6 py-24 sm:py-32 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
        <div className="relative mx-auto max-w-2xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              {t('cta.title')}
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-xl leading-8 text-gray-200">
              {t('cta.description')}
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-x-6">
              <Link href="/signup">
                <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100 px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto">
                  {t('cta.signup')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-gray-900 px-8 py-4 text-lg font-semibold transition-all duration-300 w-full sm:w-auto">
                  {t('cta.login')}
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
      </main>
      </div>
    </>
  );
}
