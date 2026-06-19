import createMiddleware from 'next-intl/middleware'
import { type NextRequest } from 'next/server'
import { routing } from '@/i18n/routing'
import { updateSession } from '@/lib/supabase/middleware'

const intlMiddleware = createMiddleware(routing)

export async function middleware(request: NextRequest) {
  // Run next-intl middleware first (handles locale detection & URL rewriting)
  const intlResponse = intlMiddleware(request)

  // Run Supabase session middleware on the (possibly rewritten) request
  const supabaseResponse = await updateSession(request)

  // If Supabase middleware wants to redirect, use that response
  if (supabaseResponse.headers.get('location')) {
    // Merge any cookies set by intl middleware
    intlResponse.cookies.getAll().forEach((cookie) => {
      supabaseResponse.cookies.set(cookie.name, cookie.value)
    })
    return supabaseResponse
  }

  // Otherwise use intl response but merge Supabase cookies
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    intlResponse.cookies.set(cookie.name, cookie.value)
  })

  return intlResponse
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
