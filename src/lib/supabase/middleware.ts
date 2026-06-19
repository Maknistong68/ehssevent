import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Strip locale prefix from pathname for route matching
  const pathname = request.nextUrl.pathname
  const strippedPathname = pathname.replace(/^\/(en|ar)/, '') || '/'

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/signup', '/forgot-password', '/auth/callback', '/privacy-policy', '/terms-of-service']
  const isPublicRoute = publicRoutes.some((route) =>
    strippedPathname.startsWith(route)
  )

  // Extract the locale prefix for redirects
  const localeMatch = pathname.match(/^\/(en|ar)/)
  const localePrefix = localeMatch ? localeMatch[0] : ''

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = `${localePrefix}/login`
    return NextResponse.redirect(url)
  }

  if (user && isPublicRoute && !strippedPathname.startsWith('/auth/callback')) {
    const url = request.nextUrl.clone()
    url.pathname = `${localePrefix}/dashboard`
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
