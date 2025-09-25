import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';

// Can be imported from a shared config
const locales = ['tr', 'en'] as const;
export type Locale = (typeof locales)[number];

// Function to load all message files for a locale
async function loadMessages(locale: string) {
  const [common, navigation, auth, home, dashboard, timer, projects, tasks, timesheet, gamification, admin, errors, validation] = await Promise.all([
    import(`../../messages/${locale}/common.json`),
    import(`../../messages/${locale}/navigation.json`),
    import(`../../messages/${locale}/auth.json`),
    import(`../../messages/${locale}/home.json`),
    import(`../../messages/${locale}/dashboard.json`),
    import(`../../messages/${locale}/timer.json`),
    import(`../../messages/${locale}/projects.json`),
    import(`../../messages/${locale}/tasks.json`),
    import(`../../messages/${locale}/timesheet.json`),
    import(`../../messages/${locale}/gamification.json`),
    import(`../../messages/${locale}/admin.json`),
    import(`../../messages/${locale}/errors.json`),
    import(`../../messages/${locale}/validation.json`)
  ]);

  return {
    common: common.default,
    navigation: navigation.default,
    auth: auth.default,
    home: home.default,
    dashboard: dashboard.default,
    timer: timer.default,
    projects: projects.default,
    tasks: tasks.default,
    timesheet: timesheet.default,
    gamification: gamification.default,
    admin: admin.default,
    errors: errors.default,
    validation: validation.default
  };
}

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locale || !locales.includes(locale as any)) notFound();

  return {
    locale: locale as string,
    messages: await loadMessages(locale as string)
  };
});

export { locales };