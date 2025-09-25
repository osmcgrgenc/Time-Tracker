'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const languages = [
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
] as const;

interface LanguageSwitcherProps {
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg';
  showText?: boolean;
  className?: string;
  locale: string;
}

export function LanguageSwitcher({ 
  variant = 'ghost', 
  size = 'default', 
  showText = true,
  className,
  locale 
}: LanguageSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('common');

  const currentLanguage = languages.find(lang => lang.code === locale) || languages[0];

  const switchLanguage = (newLocale: string) => {
    if (newLocale === locale) return;

    // Remove current locale from pathname (always 3 characters: /xx)
    let newPathname = pathname.slice(3) || '/';
    
    // Ensure newPathname starts with /
    if (!newPathname.startsWith('/')) {
      newPathname = '/' + newPathname;
    }

    // Add new locale to pathname (always prefix since localePrefix: 'always')
    newPathname = `/${newLocale}${newPathname}`;

    router.push(newPathname);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={variant} 
          size={size}
          className={cn(
            "flex items-center gap-2 h-9 px-3",
            className
          )}
        >
          <Globe className="h-4 w-4" />
          <span className="text-sm font-medium">
            {currentLanguage.flag}
          </span>
          {showText && (
            <span className="hidden sm:inline-block text-sm">
              {currentLanguage.name}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => switchLanguage(language.code)}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{language.flag}</span>
              <span className="text-sm font-medium">{language.name}</span>
            </div>
            {locale === language.code && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Compact version for mobile or tight spaces
export function CompactLanguageSwitcher({ className, locale }: { className?: string, locale: string }) {
  return (
    <LanguageSwitcher 
      variant="ghost" 
      size="sm" 
      showText={false}
      className={className}
      locale={locale}
    />
  );
}

// Text-only version
export function TextLanguageSwitcher({ className }: { className?: string }) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLanguage = (newLocale: string) => {
    if (newLocale === locale) return;

    // Remove current locale from pathname (always 3 characters: /xx)
    let newPathname = pathname.slice(3) || '/';
    
    // Ensure newPathname starts with /
    if (!newPathname.startsWith('/')) {
      newPathname = '/' + newPathname;
    }

    // Always add locale prefix since localePrefix: 'always'
    newPathname = `/${newLocale}${newPathname}`;

    router.push(newPathname);
  };

  return (
    <div className={cn("flex items-center gap-2 text-sm", className)}>
      {languages.map((language, index) => (
        <span key={language.code}>
          <button
            onClick={() => switchLanguage(language.code)}
            className={cn(
              "hover:text-primary transition-colors",
              locale === language.code 
                ? "text-primary font-medium" 
                : "text-muted-foreground"
            )}
          >
            {language.name}
          </button>
          {index < languages.length - 1 && (
            <span className="mx-2 text-muted-foreground">|</span>
          )}
        </span>
      ))}
    </div>
  );
}