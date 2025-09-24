import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ServiceWorkerProvider } from "@/components/ServiceWorkerProvider";
import { RoutePreloadManager } from "@/components/RouteBasedSplitting";
import { SessionProviderWrapper } from "@/components/providers/SessionProviderWrapper";
import { SkipLinks } from "@/components/SkipLink";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Time Tracker Pro - Gamified Time Management",
  description: "Advanced gamified time tracking with XP system, achievements, challenges, and comprehensive analytics.",
  keywords: ["time tracking", "gamification", "productivity", "XP system", "achievements", "timer"],
  authors: [{ name: "Time Tracker Pro Team" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Time Tracker Pro",
  },
  openGraph: {
    title: "Time Tracker Pro",
    description: "Gamified time management with XP, levels, and achievements",
    type: "website",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 text-gray-900`}
      >
        <SkipLinks />
        <ServiceWorkerProvider>
          <RoutePreloadManager>
            <SessionProviderWrapper>
              <ThemeProvider>
                <AuthProvider>
                  {children}
                  <Toaster />
                </AuthProvider>
              </ThemeProvider>
            </SessionProviderWrapper>
          </RoutePreloadManager>
        </ServiceWorkerProvider>
      </body>
    </html>
  );
}
