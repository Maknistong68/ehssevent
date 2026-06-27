import createMiddleware from 'next-intl/middleware'
import { NextResponse, type NextRequest } from 'next/server'
import { routing } from '@/i18n/routing'
import { updateSession } from '@/lib/supabase/middleware'

const intlMiddleware = createMiddleware(routing)

// ── Content-Security-Policy (C1) ─────────────────────────────────────────────
// Per-request nonce-based CSP for scripts (drops `'unsafe-inline'`, the primary
// XSS vector) with `'strict-dynamic'` so only the nonce'd bootstrap — and the
// bundles it loads — may execute. Next.js extracts the nonce from the request's
// CSP header during SSR and applies it to every framework/page script.
//
// `style-src` keeps `'unsafe-inline'`: CSP nonces do not apply to inline
// `style="..."` attributes, which `next/image` (`fill`) and the UI primitives
// (dialogs, popovers) set pervasively — a nonce-only style policy would break
// them. Scripts are the meaningful injection risk and are now nonce-locked.
function contentSecurityPolicy(nonce: string): string {
  const isProd = process.env.NODE_ENV === 'production'

  const connect = ["'self'"]
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (supabaseUrl) {
    connect.push(supabaseUrl)
    connect.push(supabaseUrl.replace(/^http/, 'ws')) // realtime websockets
  }
  if (!isProd) connect.push('ws:', 'wss:') // HMR

  const scriptSrc = [
    "'self'",
    `'nonce-${nonce}'`,
    "'strict-dynamic'",
    ...(isProd ? [] : ["'unsafe-eval'"]), // React Refresh / HMR (dev only)
  ]

  return [
    "default-src 'self'",
    `script-src ${scriptSrc.join(' ')}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src ${connect.join(' ')}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "frame-src 'none'",
    ...(isProd ? ['upgrade-insecure-requests'] : []),
  ].join('; ')
}

// Next.js 16 renamed `middleware.ts` to `proxy.ts`. This runs on every matched
// request: it mints a per-request nonce, lets next-intl resolve the locale
// (which usually rewrites to add the locale prefix), forwards the nonce to the
// renderer via request headers so Next can nonce its scripts, then refreshes
// the Supabase session and attaches the CSP to the outgoing response.
export async function proxy(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID())
  const csp = contentSecurityPolicy(nonce)

  // Forwarded to the renderer: Next reads the nonce from the request CSP header.
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('content-security-policy', csp)

  const intl = intlMiddleware(request)

  // A redirect (e.g. locale normalization) is returned verbatim, with the CSP
  // attached so the browser still enforces it on the redirect response.
  if (intl.headers.get('location')) {
    intl.headers.set('content-security-policy', csp)
    return updateSession(request, intl)
  }

  // Rebuild next-intl's outcome while forwarding the nonce-bearing request
  // headers, so the rewrite/continue reaches the renderer with the nonce.
  const rewriteTarget = intl.headers.get('x-middleware-rewrite')
  const response = rewriteTarget
    ? NextResponse.rewrite(new URL(rewriteTarget, request.url), {
        request: { headers: requestHeaders },
      })
    : NextResponse.next({ request: { headers: requestHeaders } })

  // Carry over cookies (e.g. NEXT_LOCALE) and non-internal headers next-intl set.
  intl.cookies.getAll().forEach((cookie) => {
    response.cookies.set(cookie.name, cookie.value, cookie)
  })
  intl.headers.forEach((value, key) => {
    if (
      key === 'x-middleware-rewrite' ||
      key === 'x-middleware-next' ||
      key.startsWith('x-middleware-request-')
    ) {
      return
    }
    response.headers.set(key, value)
  })

  response.headers.set('content-security-policy', csp)
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
