import createMiddleware from 'next-intl/middleware'
import { type NextRequest } from 'next/server'
import { routing } from '@/i18n/routing'
import { updateSession } from '@/lib/supabase/middleware'

const intlMiddleware = createMiddleware(routing)

// Next.js 16 renamed `middleware.ts` to `proxy.ts`. This runs on every matched
// request: first next-intl resolves the locale (producing the response), then
// we refresh the Supabase session and attach any rotated auth cookies to that
// same response so the user stays logged in while navigating.
export async function proxy(request: NextRequest) {
  const response = intlMiddleware(request)
  return updateSession(request, response)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (icons, manifest, etc.)
     * - api routes
     */
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json|webmanifest)$).*)',
  ],
}
