import { getRequestConfig } from 'next-intl/server';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';

const locales = ['tr', 'en'] as const;
export type Locale = (typeof locales)[number];

// Server-side i18n helper for API routes
export async function getServerTranslations(locale?: string) {
  const validLocale = locale && locales.includes(locale as Locale) ? locale as Locale : 'tr';
  
  try {
    const messages = (await import(`../../messages/${validLocale}.json`)).default;
    return {
      locale: validLocale,
      messages,
      t: (key: string, params?: Record<string, any>) => {
        const keys = key.split('.');
        let value = keys.reduce((obj, k) => obj?.[k], messages);
        
        if (typeof value !== 'string') {
          return key; // Return key if translation not found
        }
        
        // Simple parameter replacement
        if (params) {
          Object.entries(params).forEach(([paramKey, paramValue]) => {
            value = value.replace(`{${paramKey}}`, String(paramValue));
          });
        }
        
        return value;
      }
    };
  } catch (error) {
    console.error(`Failed to load translations for locale: ${validLocale}`, error);
    return {
      locale: validLocale,
      messages: {},
      t: (key: string) => key
    };
  }
}

// Get locale from request headers
export async function getLocaleFromHeaders(): Promise<Locale> {
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || '';
  
  // Extract locale from pathname
  const localeMatch = pathname.match(/^\/(en|tr)/);
  if (localeMatch && locales.includes(localeMatch[1] as Locale)) {
    return localeMatch[1] as Locale;
  }
  
  // Check Accept-Language header as fallback
  const acceptLanguage = headersList.get('accept-language') || '';
  if (acceptLanguage.includes('en')) {
    return 'en';
  }
  
  return 'tr'; // Default to Turkish
}

// API response helper with i18n support
export async function createI18nResponse(
  data: any,
  options: {
    status?: number;
    locale?: string;
    messageKey?: string;
    messageParams?: Record<string, any>;
  } = {}
) {
  const { status = 200, locale, messageKey, messageParams } = options;
  const { t } = await getServerTranslations(locale);
  
  const response: any = { ...data };
  
  if (messageKey) {
    response.message = t(messageKey, messageParams);
  }
  
  return Response.json(response, { status });
}

// Error response helper with i18n support
export async function createI18nErrorResponse(
  errorKey: string,
  options: {
    status?: number;
    locale?: string;
    params?: Record<string, any>;
    details?: any;
  } = {}
) {
  const { status = 400, locale, params, details } = options;
  const { t } = await getServerTranslations(locale);
  
  const response: any = {
    error: t(errorKey, params),
    success: false
  };
  
  if (details) {
    response.details = details;
  }
  
  return Response.json(response, { status });
}

// Validation error helper with i18n support
export async function createI18nValidationErrorResponse(
  errors: Record<string, string[]>,
  locale?: string
) {
  const { t } = await getServerTranslations(locale);
  
  const translatedErrors: Record<string, string[]> = {};
  
  Object.entries(errors).forEach(([field, fieldErrors]) => {
    translatedErrors[field] = fieldErrors.map(error => {
      // Try to translate validation error, fallback to original if not found
      const translatedError = t(`validation.${error}`);
      return translatedError !== `validation.${error}` ? translatedError : error;
    });
  });
  
  return Response.json({
    error: t('errors.validation'),
    errors: translatedErrors,
    success: false
  }, { status: 400 });
}