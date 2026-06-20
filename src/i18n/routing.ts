import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['en', 'ar'],
  defaultLocale: 'en',
  // No `[locale]` URL segment exists — locale is persisted via the
  // NEXT_LOCALE cookie, so the middleware must never prefix the path.
  localePrefix: 'never',
})
