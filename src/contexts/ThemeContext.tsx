'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useTheme as useNextTheme } from 'next-themes';
import { useLocalStorage } from '@/hooks/useLocalStorage';

type ColorScheme = 'blue' | 'green' | 'purple' | 'orange';

interface ThemeContextType {
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, resolvedTheme } = useNextTheme();
  const [colorScheme, setColorScheme] = useLocalStorage<ColorScheme>('colorScheme', 'orange');
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only calculating isDark after mount
  const isDark = mounted ? resolvedTheme === 'dark' : false;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      // Apply color scheme
      const root = window.document.documentElement;
      root.setAttribute('data-color-scheme', colorScheme);
    }
  }, [colorScheme, mounted]);

  return (
    <ThemeContext.Provider value={{ colorScheme, setColorScheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}