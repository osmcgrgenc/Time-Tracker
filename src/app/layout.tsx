import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Time Tracker - Professional Time Management",
  description: "Advanced time tracking application with concurrent timers, project management, and Excel export capabilities.",
  keywords: ["time tracking", "project management", "timesheet", "productivity", "timer"],
  authors: [{ name: "Time Tracker Team" }],
  openGraph: {
    title: "Time Tracker",
    description: "Professional time management with concurrent timers and export capabilities",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gradient-radial from-gray-100 to-gray-300 dark:from-gray-900 dark:to-black text-foreground`}
      >
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
