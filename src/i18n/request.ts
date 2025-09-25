import {getRequestConfig} from 'next-intl/server';
import {routing} from './routing';

// This is now simplified since we handle locale directly in the layout
export default getRequestConfig(async ({locale}) => {
  console.log('🌐 Request config - locale:', locale);
  
  // Default to Turkish if no locale provided
  const finalLocale = locale || routing.defaultLocale;
  
  console.log('✅ Request config - using locale:', finalLocale);
  const messages = {
    ...(await import(`../../messages/${finalLocale}/common.json`)).default,
    ...(await import(`../../messages/${finalLocale}/navigation.json`)).default,
    ...(await import(`../../messages/${finalLocale}/home.json`)).default,
    ...(await import(`../../messages/${finalLocale}/auth.json`)).default,
    ...(await import(`../../messages/${finalLocale}/dashboard.json`)).default,
    ...(await import(`../../messages/${finalLocale}/admin.json`)).default,
    ...(await import(`../../messages/${finalLocale}/projects.json`)).default,
    ...(await import(`../../messages/${finalLocale}/tasks.json`)).default,
    ...(await import(`../../messages/${finalLocale}/timer.json`)).default,
    ...(await import(`../../messages/${finalLocale}/timesheet.json`)).default,
    ...(await import(`../../messages/${finalLocale}/gamification.json`)).default,
    ...(await import(`../../messages/${finalLocale}/errors.json`)).default,
    ...(await import(`../../messages/${finalLocale}/validation.json`)).default
  };
  return {
    locale: finalLocale,
    messages
  };
});