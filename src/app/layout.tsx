import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/components/theme-provider'
import { ServiceWorkerProvider } from '@/components/service-worker-provider'
import { SessionProviderWrapper } from '@/components/session-provider-wrapper'
import { TooltipProvider } from '@/components/ui/tooltip'


const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  authors: [{ name: 'TimeTracker Team' }],
  creator: 'TimeTracker Team',
  publisher: 'TimeTracker',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://timetracker.codifya.com'),
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {


  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <body className={inter.className}>
        <SessionProviderWrapper>
          <AuthProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <TooltipProvider>
                <ServiceWorkerProvider />
                {children}
                <Toaster />
              </TooltipProvider>
            </ThemeProvider>
          </AuthProvider>
        </SessionProviderWrapper>
      </body>
    </html>
  )
}
