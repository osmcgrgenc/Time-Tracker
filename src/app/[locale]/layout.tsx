import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '../../i18n/routing';
import type { Metadata } from 'next';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  
  const isEnglish = locale === 'en';
  
  const metadata = {
    title: {
      default: isEnglish ? 'Verimly - Time Tracking Application' : 'Verimly - Zaman Takip Uygulaması',
    template: '%s | Verimly'
    },
    description: isEnglish 
      ? 'Track your time, achieve your goals with our advanced gamified time tracking system'
      : 'Gelişmiş gamifikasyon sistemi ile zaman takibi yapın, hedeflerinizi belirleyin ve verimliliğinizi artırın.',
    keywords: isEnglish 
      ? ['time tracking', 'pomodoro', 'productivity', 'project management', 'gamification']
      : ['zaman takibi', 'pomodoro', 'verimlilik', 'proje yönetimi', 'gamifikasyon'],
    openGraph: {
      type: 'website',
      locale: isEnglish ? 'en_US' : 'tr_TR',
      url: 'https://verimly.codifya.com',
    title: isEnglish ? 'Verimly - Time Tracking Application' : 'Verimly - Zaman Takip Uygulaması',
      description: isEnglish 
        ? 'Track your time, achieve your goals with our advanced gamified time tracking system'
        : 'Gelişmiş gamifikasyon sistemi ile zaman takibi yapın, hedeflerinizi belirleyin ve verimliliğinizi artırın.',
      siteName: 'Verimly',
    },
    twitter: {
      card: 'summary_large_image',
      title: isEnglish ? 'Verimly - Time Tracking Application' : 'Verimly - Zaman Takip Uygulaması',
      description: isEnglish 
        ? 'Track your time, achieve your goals with our advanced gamified time tracking system'
        : 'Gelişmiş gamifikasyon sistemi ile zaman takibi yapın, hedeflerinizi belirleyin ve verimliliğinizi artırın.',
    },
  };
  
  return metadata;
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages({ locale });

  return (
    <NextIntlClientProvider messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}