import {getRequestConfig} from 'next-intl/server';
import {routing} from './routing';

// This is now simplified since we handle locale directly in the layout
export default getRequestConfig(async ({locale}) => {
  console.log('🌐 Request config - locale:', locale);
  
  // Default to Turkish if no locale provided
  const finalLocale = (locale || routing.defaultLocale) in routing.locales ? locale : routing.defaultLocale;
  
  console.log('✅ Request config - using locale:', finalLocale);
  const messages = {
    common: (await import(`../messages/${finalLocale}/common.json`)).default,
    navigation: (await import(`../messages/${finalLocale}/navigation.json`)).default,
    home: (await import(`../messages/${finalLocale}/home.json`)).default,
    auth: (await import(`../messages/${finalLocale}/auth.json`)).default,
    dashboard: (await import(`../messages/${finalLocale}/dashboard.json`)).default,
    admin: (await import(`../messages/${finalLocale}/admin.json`)).default,
    projects: (await import(`../messages/${finalLocale}/projects.json`)).default,
    tasks: (await import(`../messages/${finalLocale}/tasks.json`)).default,
    timer: (await import(`../messages/${finalLocale}/timer.json`)).default,
    timesheet: (await import(`../messages/${finalLocale}/timesheet.json`)).default,
    gamification: (await import(`../messages/${finalLocale}/gamification.json`)).default,
    errors: (await import(`../messages/${finalLocale}/errors.json`)).default,
    validation: (await import(`../messages/${finalLocale}/validation.json`)).default,
    error: (await import(`../messages/${finalLocale}/error.json`)).default
  };
  return {
    locale: finalLocale,
    messages
  };
});