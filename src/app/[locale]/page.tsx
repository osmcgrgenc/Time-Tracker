'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Clock, BarChart3, Users, Zap, CheckCircle, ArrowRight, Star, Shield, Smartphone, Target, Trophy, Timer, CheckSquare, Quote, Moon, Play } from 'lucide-react';
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
      <section className="relative overflow-hidden px-6 py-24 sm:py-32 lg:px-8 min-h-[90vh] flex items-center">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-32 w-80 h-80 bg-gradient-to-r from-blue-400/30 to-purple-400/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-gradient-to-r from-emerald-400/30 to-blue-400/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-purple-400/20 to-emerald-400/20 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>
        
        {/* Floating Particles */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-20"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [-20, 20, -20],
                x: [-10, 10, -10],
                opacity: [0.2, 0.8, 0.2],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
        
        <div className="relative mx-auto max-w-4xl text-center z-10">
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <Badge variant="secondary" className="mb-6 px-6 py-3 text-base font-medium bg-gradient-to-r from-emerald-100 to-blue-100 text-emerald-800 border-emerald-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                ✨ {t('hero.badge')}
              </Badge>
            </motion.div>
            
            <motion.h1 
              className="text-5xl font-bold tracking-tight text-gray-900 sm:text-7xl lg:text-8xl mb-8"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.3 }}
            >
              <motion.span 
                className="bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-600 bg-clip-text text-transparent bg-300% animate-gradient"
                animate={{
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "linear",
                }}
              >
                {t('hero.title')}
              </motion.span>
            </motion.h1>
            
            <motion.p 
              className="mt-8 text-2xl leading-9 text-gray-700 max-w-4xl mx-auto font-medium"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              {t('hero.subtitle')}
            </motion.p>
            
            <motion.p 
              className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              {t('hero.description')}
            </motion.p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6"
          >
            <motion.div
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Link href="/signup">
                <Button size="lg" className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-12 py-6 text-xl font-bold shadow-2xl hover:shadow-3xl transition-all duration-500 group animate-glow">
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 shimmer-bg animate-shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  {/* Inner glow */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
                  
                  <span className="relative z-10 flex items-center">
                    {t('hero.getStarted')}
                    <motion.div
                      className="ml-3"
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <ArrowRight className="h-6 w-6" />
                    </motion.div>
                  </span>
                  
                  {/* Pulse effect */}
                  <div className="absolute inset-0 rounded-lg bg-white/20 opacity-0 group-hover:animate-pulse transition-opacity duration-300"></div>
                </Button>
              </Link>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Link href="/signup?team=true">
                <Button variant="outline" size="lg" className="relative overflow-hidden border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-600 hover:text-emerald-700 px-12 py-6 text-xl font-bold transition-all duration-500 group">
                  {/* Background effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/50 to-emerald-100/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
                  
                  {/* Border glow */}
                  <div className="absolute inset-0 rounded-lg border-2 border-emerald-400/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <span className="relative z-10 flex items-center">
                    {t('hero.getStartedTeam')}
                    <motion.div
                      className="ml-3"
                      animate={{ rotate: [0, 15, -15, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Users className="h-6 w-6" />
                    </motion.div>
                  </span>
                </Button>
              </Link>
            </motion.div>
          </motion.div>
          
          {/* Stats Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-2xl mx-auto"
          >
            {[
              { number: "10K+", label: "Aktif Kullanıcı" },
              { number: "50M+", label: "Tamamlanan Pomodoro" },
              { number: "98%", label: "Memnuniyet Oranı" }
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.2 + index * 0.1 }}
                whileHover={{ scale: 1.05 }}
              >
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {stat.number}
                </div>
                <div className="text-sm text-gray-600 mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 sm:py-32 bg-gradient-to-b from-gray-50 to-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mx-auto max-w-3xl text-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm font-medium bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 border-blue-200">
                🚀 Güçlü Özellikler
              </Badge>
            </motion.div>
            <h2 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              <span className="bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                {t('features.title')}
              </span>
            </h2>
            <p className="mt-6 text-xl leading-8 text-gray-600 max-w-2xl mx-auto">
              {t('features.subtitle')}
            </p>
          </motion.div>
          
          <div className="mx-auto mt-20 max-w-2xl sm:mt-24 lg:mt-28 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-8 lg:max-w-none lg:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  name: t('features.pomodoro.title'),
                  description: t('features.pomodoro.description'),
                  icon: Timer,
                  color: 'text-blue-600',
                  bgColor: 'bg-gradient-to-br from-blue-500 to-blue-600',
                  cardBg: 'bg-gradient-to-br from-blue-50 to-blue-100',
                  borderColor: 'border-blue-200',
                  hoverShadow: 'hover:shadow-blue-200/50'
                },
                {
                  name: t('features.gamification.title'),
                  description: t('features.gamification.description'),
                  icon: Trophy,
                  color: 'text-emerald-600',
                  bgColor: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
                  cardBg: 'bg-gradient-to-br from-emerald-50 to-emerald-100',
                  borderColor: 'border-emerald-200',
                  hoverShadow: 'hover:shadow-emerald-200/50'
                },
                {
                  name: t('features.taskManagement.title'),
                  description: t('features.taskManagement.description'),
                  icon: CheckSquare,
                  color: 'text-purple-600',
                  bgColor: 'bg-gradient-to-br from-purple-500 to-purple-600',
                  cardBg: 'bg-gradient-to-br from-purple-50 to-purple-100',
                  borderColor: 'border-purple-200',
                  hoverShadow: 'hover:shadow-purple-200/50'
                },
                {
                  name: t('features.analytics.title'),
                  description: t('features.analytics.description'),
                  icon: BarChart3,
                  color: 'text-orange-600',
                  bgColor: 'bg-gradient-to-br from-orange-500 to-orange-600',
                  cardBg: 'bg-gradient-to-br from-orange-50 to-orange-100',
                  borderColor: 'border-orange-200',
                  hoverShadow: 'hover:shadow-orange-200/50'
                }
              ].map((feature, index) => (
                <motion.div
                  key={feature.name}
                  initial={{ opacity: 0, y: 30, scale: 0.9 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ 
                    duration: 0.6, 
                    delay: index * 0.1,
                    type: "spring",
                    stiffness: 100
                  }}
                  viewport={{ once: true }}
                  whileHover={{ 
                    y: -8, 
                    scale: 1.02,
                    transition: { duration: 0.2 }
                  }}
                  className={`relative group cursor-pointer`}
                >
                  <div className={`relative overflow-hidden rounded-2xl ${feature.cardBg} border-2 ${feature.borderColor} p-8 shadow-lg ${feature.hoverShadow} hover:shadow-2xl transition-all duration-300 h-full`}>
                    {/* Background Pattern */}
                    <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
                      <div className="absolute inset-0 bg-gradient-to-br from-white to-transparent rounded-full transform rotate-45 scale-150"></div>
                    </div>
                    
                    {/* Icon */}
                    <motion.div
                      className={`relative flex h-16 w-16 items-center justify-center rounded-xl ${feature.bgColor} shadow-lg mb-6 group-hover:scale-110 transition-transform duration-300`}
                      whileHover={{ rotate: [0, -10, 10, 0] }}
                      transition={{ duration: 0.5 }}
                    >
                      <feature.icon className="h-8 w-8 text-white" aria-hidden="true" />
                      
                      {/* Glow effect */}
                      <div className={`absolute inset-0 rounded-xl ${feature.bgColor} opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-300`}></div>
                    </motion.div>
                    
                    {/* Content */}
                    <div className="relative z-10">
                      <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-gray-800 transition-colors duration-300">
                        {feature.name}
                      </h3>
                      <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
                        {feature.description}
                      </p>
                    </div>
                    
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
                  </div>
                </motion.div>
              ))}
            </dl>
          </div>
          
          {/* Additional Features Grid */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
            className="mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto"
          >
            {[
              { icon: "⚡", title: "Hızlı Başlangıç", desc: "Sadece 2 dakikada kurulum" },
              { icon: "🔒", title: "Güvenli Veri", desc: "End-to-end şifreleme" },
              { icon: "📱", title: "Mobil Uyumlu", desc: "Her cihazda mükemmel deneyim" },
              { icon: "🌙", title: "Karanlık Mod", desc: "Gözlerinizi koruyun" },
              { icon: "📊", title: "Detaylı Analiz", desc: "Verimliliğinizi ölçün" },
              { icon: "🎯", title: "Hedef Takibi", desc: "Amaçlarınıza ulaşın" }
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05 }}
                className="flex items-center space-x-4 p-4 rounded-xl bg-white/80 backdrop-blur-sm border border-gray-200 hover:border-gray-300 transition-all duration-300 hover:shadow-lg"
              >
                <div className="text-2xl">{item.icon}</div>
                <div>
                  <h4 className="font-semibold text-gray-900">{item.title}</h4>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="relative py-24 sm:py-32 bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-blue-200/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-purple-200/30 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mx-auto max-w-3xl text-center"
          >
            <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm font-medium bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800 border-purple-200">
              💬 Kullanıcı Deneyimleri
            </Badge>
            <h2 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              <span className="bg-gradient-to-r from-gray-900 via-purple-800 to-blue-800 bg-clip-text text-transparent">
                {t('socialProof.title')}
              </span>
            </h2>
            <p className="mt-6 text-xl leading-8 text-gray-600 max-w-2xl mx-auto">
              Verimly ile verimliliğini artıran kullanıcılarımızın deneyimlerini keşfedin
            </p>
          </motion.div>
          
          <div className="mx-auto mt-20 grid max-w-2xl grid-cols-1 gap-8 lg:mx-0 lg:max-w-none lg:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ 
                  duration: 0.6, 
                  delay: index * 0.2,
                  type: "spring",
                  stiffness: 100
                }}
                viewport={{ once: true }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="relative group"
              >
                <div className="relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-sm p-8 shadow-xl border border-gray-200/50 hover:shadow-2xl transition-all duration-300 h-full">
                  {/* Quote Icon */}
                  <div className="absolute top-6 right-6 opacity-10">
                    <Quote className="h-12 w-12 text-gray-400" />
                  </div>
                  
                  {/* Rating */}
                  <div className="flex gap-x-1 text-yellow-400 mb-6">
                    {[...Array(5)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.2 + i * 0.1 }}
                        viewport={{ once: true }}
                      >
                        <Star className="h-5 w-5 fill-current" />
                      </motion.div>
                    ))}
                  </div>
                  
                  {/* Content */}
                  <blockquote className="text-gray-700 leading-relaxed mb-8 text-lg">
                    "{testimonial.content}"
                  </blockquote>
                  
                  {/* Author */}
                  <div className="flex items-center gap-x-4">
                    <div className="h-14 w-14 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      {testimonial.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 text-lg">{testimonial.name}</div>
                      <div className="text-gray-600">{testimonial.role}</div>
                    </div>
                  </div>
                  
                  {/* Hover Glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl"></div>
                </div>
              </motion.div>
            ))}
          </div>
          
          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            viewport={{ once: true }}
            className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto"
          >
            {[
              { number: "15K+", label: "Aktif Kullanıcı", icon: Users },
              { number: "2M+", label: "Tamamlanan Pomodoro", icon: Timer },
              { number: "98%", label: "Memnuniyet Oranı", icon: Star },
              { number: "50+", label: "Ülke", icon: Target }
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                className="text-center group"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 + index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05 }}
              >
                <div className="flex justify-center mb-2">
                  <div className="p-3 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 group-hover:from-blue-200 group-hover:to-purple-200 transition-colors duration-300">
                    <stat.icon className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {stat.number}
                </div>
                <div className="text-sm text-gray-600 mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing Preview Section */}
      <section id="pricing" className="relative py-24 sm:py-32 bg-white overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.05),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(147,51,234,0.05),transparent_50%)]"></div>
        
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mx-auto max-w-3xl text-center"
          >
            <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm font-medium bg-gradient-to-r from-green-100 to-blue-100 text-green-800 border-green-200">
              💰 Fiyatlandırma
            </Badge>
            <h2 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              <span className="bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                Herkes İçin Uygun Fiyat
              </span>
            </h2>
            <p className="mt-6 text-xl leading-8 text-gray-600 max-w-2xl mx-auto">
              İhtiyacınıza göre seçin, istediğiniz zaman değiştirin
            </p>
          </motion.div>
          
          <div className="mx-auto mt-20 grid max-w-lg grid-cols-1 gap-8 lg:max-w-4xl lg:grid-cols-3">
            {[
              {
                name: "Başlangıç",
                price: "Ücretsiz",
                period: "Sonsuza kadar",
                description: "Bireysel kullanım için mükemmel",
                features: [
                  "5 proje",
                  "Temel pomodoro timer",
                  "Basit raporlar",
                  "Mobil uygulama",
                  "Email desteği"
                ],
                popular: false,
                color: "from-gray-500 to-gray-600",
                bgColor: "from-gray-50 to-white",
                textColor: "text-gray-900"
              },
              {
                name: "Pro",
                price: "₺29",
                period: "/ay",
                description: "Profesyoneller için gelişmiş özellikler",
                features: [
                  "Sınırsız proje",
                  "Gelişmiş analytics",
                  "Takım işbirliği",
                  "Özel raporlar",
                  "Öncelikli destek",
                  "API erişimi"
                ],
                popular: true,
                color: "from-blue-500 to-purple-600",
                bgColor: "from-blue-50 to-purple-50",
                textColor: "text-white"
              },
              {
                name: "Kurumsal",
                price: "₺99",
                period: "/ay",
                description: "Büyük takımlar için özel çözümler",
                features: [
                  "Sınırsız kullanıcı",
                  "Özel entegrasyonlar",
                  "Gelişmiş güvenlik",
                  "Özel eğitim",
                  "24/7 destek",
                  "SLA garantisi"
                ],
                popular: false,
                color: "from-purple-500 to-pink-600",
                bgColor: "from-purple-50 to-pink-50",
                textColor: "text-gray-900"
              }
            ].map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ 
                  duration: 0.6, 
                  delay: index * 0.2,
                  type: "spring",
                  stiffness: 100
                }}
                viewport={{ once: true }}
                whileHover={{ y: -10, scale: plan.popular ? 1.05 : 1.02 }}
                className={`relative group ${plan.popular ? 'lg:scale-110 lg:z-10' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-1 text-sm font-medium">
                      ⭐ En Popüler
                    </Badge>
                  </div>
                )}
                
                <div className={`relative overflow-hidden rounded-3xl ${plan.popular ? 'bg-gradient-to-br from-blue-500 to-purple-600 p-1' : 'bg-gradient-to-br from-gray-200 to-gray-300 p-1'} shadow-xl hover:shadow-2xl transition-all duration-300`}>
                  <div className={`relative h-full rounded-3xl bg-gradient-to-br ${plan.bgColor} p-8 ${plan.popular ? 'text-white' : 'text-gray-900'}`}>
                    {/* Plan Header */}
                    <div className="text-center mb-8">
                      <h3 className={`text-2xl font-bold ${plan.popular ? 'text-white' : 'text-gray-900'} mb-2`}>
                        {plan.name}
                      </h3>
                      <p className={`text-sm ${plan.popular ? 'text-blue-100' : 'text-gray-600'} mb-6`}>
                        {plan.description}
                      </p>
                      <div className="flex items-baseline justify-center gap-x-2">
                        <span className={`text-5xl font-bold tracking-tight ${plan.popular ? 'text-white' : 'text-gray-900'}`}>
                          {plan.price}
                        </span>
                        <span className={`text-sm font-semibold leading-6 tracking-wide ${plan.popular ? 'text-blue-100' : 'text-gray-600'}`}>
                          {plan.period}
                        </span>
                      </div>
                    </div>
                    
                    {/* Features */}
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, featureIndex) => (
                        <motion.li
                          key={feature}
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.2 + featureIndex * 0.1 }}
                          viewport={{ once: true }}
                          className="flex items-center gap-x-3"
                        >
                          <div className={`flex-shrink-0 w-5 h-5 rounded-full ${plan.popular ? 'bg-white/20' : 'bg-green-100'} flex items-center justify-center`}>
                            <CheckCircle className={`h-3 w-3 ${plan.popular ? 'text-white' : 'text-green-600'}`} />
                          </div>
                          <span className={`text-sm ${plan.popular ? 'text-blue-50' : 'text-gray-600'}`}>
                            {feature}
                          </span>
                        </motion.li>
                      ))}
                    </ul>
                    
                    {/* CTA Button */}
                    <Button 
                      className={`w-full py-3 text-base font-semibold transition-all duration-300 ${
                        plan.popular 
                          ? 'bg-white text-blue-600 hover:bg-gray-100 shadow-lg hover:shadow-xl' 
                          : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl'
                      }`}
                      size="lg"
                    >
                      {plan.name === 'Başlangıç' ? 'Ücretsiz Başla' : 'Şimdi Başla'}
                    </Button>
                    
                    {/* Hover Glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl"></div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          
          {/* Additional Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            viewport={{ once: true }}
            className="mt-16 text-center"
          >
            <p className="text-gray-600 mb-6">
              Tüm planlar 14 gün ücretsiz deneme ile gelir. İstediğiniz zaman iptal edebilirsiniz.
            </p>
            <div className="flex items-center justify-center gap-8 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>SSL Güvenliği</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                <span>Anında Aktivasyon</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>24/7 Destek</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
       <section id="faq" className="py-24 sm:py-32 bg-gray-50">
         <div className="mx-auto max-w-7xl px-6 lg:px-8">
           <motion.div
             initial={{ opacity: 0, y: 30 }}
             whileInView={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.8 }}
             viewport={{ once: true }}
             className="mx-auto max-w-3xl text-center mb-20"
           >
             <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm font-medium bg-gradient-to-r from-orange-100 to-red-100 text-orange-800 border-orange-200">
               ❓ Sık Sorulan Sorular
             </Badge>
             <h2 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
               <span className="bg-gradient-to-r from-gray-900 via-orange-800 to-red-800 bg-clip-text text-transparent">
                 Merak Ettikleriniz
               </span>
             </h2>
             <p className="mt-6 text-xl leading-8 text-gray-600 max-w-2xl mx-auto">
               Verimly hakkında en çok sorulan soruların yanıtlarını bulun
             </p>
           </motion.div>
           
           <div className="mx-auto max-w-4xl">
             <div className="grid gap-8 lg:grid-cols-2">
               {[
                 {
                   question: "Verimly nasıl çalışır?",
                   answer: "Verimly, Pomodoro tekniğini temel alarak çalışır. 25 dakikalık odaklanma seansları ve 5 dakikalık molalar ile verimliliğinizi artırır. Ayrıca gamification özelliği ile motivasyonunuzu yüksek tutar."
                 },
                 {
                   question: "Ücretsiz plan yeterli mi?",
                   answer: "Ücretsiz plan bireysel kullanım için oldukça yeterlidir. 5 proje, temel pomodoro timer ve basit raporlar içerir. Daha gelişmiş özellikler için Pro planı tercih edebilirsiniz."
                 },
                 {
                   question: "Takım olarak kullanabilir miyiz?",
                   answer: "Evet! Pro ve Kurumsal planlarımız takım işbirliği özelliklerini içerir. Takım üyelerinin ilerlemesini takip edebilir, ortak projeler oluşturabilir ve detaylı raporlar alabilirsiniz."
                 },
                 {
                   question: "Mobil uygulaması var mı?",
                   answer: "Evet, iOS ve Android için mobil uygulamalarımız mevcuttur. Web uygulaması ile tam senkronizasyon sağlar, böylece her yerden çalışmalarınızı takip edebilirsiniz."
                 },
                 {
                   question: "Verilerim güvende mi?",
                   answer: "Kesinlikle! Tüm verileriniz SSL şifreleme ile korunur. GDPR uyumlu veri işleme politikalarımız vardır ve verilerinizi asla üçüncü taraflarla paylaşmayız."
                 },
                 {
                   question: "İptal etmek istediğimde ne olur?",
                   answer: "İstediğiniz zaman aboneliğinizi iptal edebilirsiniz. İptal sonrası mevcut dönem sonuna kadar premium özelliklerinizi kullanmaya devam edebilirsiniz. Verileriniz korunur."
                 }
               ].map((faq, index) => (
                 <motion.div
                   key={index}
                   initial={{ opacity: 0, y: 20 }}
                   whileInView={{ opacity: 1, y: 0 }}
                   transition={{ duration: 0.6, delay: index * 0.1 }}
                   viewport={{ once: true }}
                   className="group"
                 >
                   <div className="relative overflow-hidden rounded-2xl bg-white p-8 shadow-lg border border-gray-200 hover:shadow-xl hover:border-blue-200 transition-all duration-300">
                     <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                     
                     <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors duration-300">
                       {faq.question}
                     </h3>
                     <p className="text-gray-600 leading-relaxed">
                       {faq.answer}
                     </p>
                     
                     {/* Hover Glow */}
                     <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
                   </div>
                 </motion.div>
               ))}
             </div>
             
             {/* Contact CTA */}
             <motion.div
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.8, delay: 0.6 }}
               viewport={{ once: true }}
               className="mt-16 text-center"
             >
               <div className="rounded-2xl bg-gradient-to-r from-blue-50 to-purple-50 p-8 border border-blue-100">
                 <h3 className="text-2xl font-bold text-gray-900 mb-4">
                   Başka sorularınız mı var?
                 </h3>
                 <p className="text-gray-600 mb-6">
                   Destek ekibimiz size yardımcı olmaktan mutluluk duyar
                 </p>
                 <Button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
                   İletişime Geç
                 </Button>
               </div>
             </motion.div>
           </div>
         </div>
       </section>

       {/* CTA Section */}
       <section className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 py-24 sm:py-32 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.05),transparent_50%)]"></div>
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-white/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        </div>
        
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mx-auto max-w-3xl text-center"
          >
            <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm font-medium bg-white/20 text-white border-white/30">
              🚀 Hemen Başla
            </Badge>
            <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl mb-6">
              {t('cta.title')}
            </h2>
            <p className="mx-auto max-w-2xl text-xl leading-8 text-blue-100 mb-10">
              {t('cta.description')}
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link href="/signup">
                  <Button 
                    size="lg" 
                    className="relative bg-white text-blue-600 hover:bg-gray-50 font-bold px-12 py-6 text-xl shadow-2xl hover:shadow-3xl transition-all duration-500 rounded-full group overflow-hidden border-2 border-transparent hover:border-blue-200 animate-pulse-slow"
                  >
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 shimmer-bg animate-shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full"></div>
                    
                    {/* Glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full"></div>
                    
                    <Zap className="mr-3 h-6 w-6 group-hover:animate-bounce relative z-10" />
                    <span className="relative z-10">{t('cta.signup')}</span>
                    
                    {/* Pulse ring */}
                    <div className="absolute inset-0 rounded-full bg-blue-400 opacity-20 animate-ping group-hover:animate-pulse"></div>
                  </Button>
                </Link>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link href="/login">
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="relative border-2 border-white/50 text-white hover:bg-white/10 hover:border-white font-bold px-12 py-6 text-xl backdrop-blur-sm rounded-full transition-all duration-500 group overflow-hidden"
                  >
                    {/* Background glow */}
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full"></div>
                    
                    {/* Border glow */}
                    <div className="absolute inset-0 rounded-full border-2 border-white/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-glow"></div>
                    
                    <Play className="mr-3 h-6 w-6 group-hover:scale-125 group-hover:rotate-12 transition-all duration-300 relative z-10" />
                    <span className="relative z-10">{t('cta.login')}</span>
                  </Button>
                </Link>
              </motion.div>
            </div>
            
            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true }}
              className="mt-16 flex items-center justify-center gap-8 text-white/80"
            >
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4" />
                <span>14 gün ücretsiz</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4" />
                <span>Kredi kartı gerekmez</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4" />
                <span>Anında kurulum</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>
      </main>
      </div>
    </>
  );
}
