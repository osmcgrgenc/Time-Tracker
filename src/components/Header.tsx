'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Clock, Menu, X } from 'lucide-react';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const t = useTranslations('common');
  const nav = useTranslations('navigation');

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              TimeTracker
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              href="/" 
              className="text-gray-600 hover:text-gray-900 transition-colors font-medium"
            >
              {t('home')}
            </Link>
            <Link 
              href="/#features" 
              className="text-gray-600 hover:text-gray-900 transition-colors font-medium"
            >
              {nav('features')}
            </Link>
            <Link 
              href="/#about" 
              className="text-gray-600 hover:text-gray-900 transition-colors font-medium"
            >
              {nav('about')}
            </Link>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <LanguageSwitcher variant="ghost" />
            <Link href="/login">
              <Button variant="ghost" size="sm">
                {t('login')}
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                {t('signup')}
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMenu}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="h-6 w-6 text-gray-600" />
            ) : (
              <Menu className="h-6 w-6 text-gray-600" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t bg-white/95 backdrop-blur-md"
          >
            <div className="container mx-auto px-4 py-4 space-y-4">
              <Link 
                href="/" 
                className="block py-2 text-gray-600 hover:text-gray-900 transition-colors font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('home')}
              </Link>
              <Link 
                href="/#features" 
                className="block py-2 text-gray-600 hover:text-gray-900 transition-colors font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                {nav('features')}
              </Link>
              <Link 
                href="/#about" 
                className="block py-2 text-gray-600 hover:text-gray-900 transition-colors font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                {nav('about')}
              </Link>
              
              <div className="pt-4 border-t space-y-3">
                <div className="flex justify-center">
                  <LanguageSwitcher variant="ghost" />
                </div>
                <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full">
                    {t('login')}
                  </Button>
                </Link>
                <Link href="/signup" onClick={() => setIsMenuOpen(false)}>
                  <Button size="sm" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    {t('signup')}
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}