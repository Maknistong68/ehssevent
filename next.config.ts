import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const isProd = process.env.NODE_ENV === 'production'

// ── Image optimizer allowlist (H-1) ─────────────────────────────────────────
// Previously `hostname: "**"` allowed the Next image optimizer to fetch from
// ANY https host (SSRF / open-proxy surface). We now allow only an explicit
// env-driven allowlist plus the configured Supabase host. Empty = no remote
// images (the default for mock mode, which serves local /placeholder.svg).
//
// TODO(prod): set NEXT_PUBLIC_IMAGE_DOMAINS (and/or NEXT_PUBLIC_SUPABASE_URL)
// to your storage/CDN hostnames before serving remote images.
function imageHostnames(): string[] {
  const hosts = new Set<string>()
  const list = process.env.NEXT_PUBLIC_IMAGE_DOMAINS ?? ''
  for (const raw of list.split(',')) {
    const host = raw.trim()
    if (host) hosts.add(host)
  }
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (supabaseUrl) {
    try {
      hosts.add(new URL(supabaseUrl).hostname)
    } catch {
      // Malformed URL is reported by src/lib/env.ts; ignore here.
    }
  }
  return [...hosts]
}

const remotePatterns = imageHostnames().map((hostname) => ({
  protocol: 'https' as const,
  hostname,
}))

// ── Content-Security-Policy (H-2) ────────────────────────────────────────────
// Pragmatic, protective baseline. `'unsafe-inline'` is retained for scripts and
// styles because the app does not yet use per-request nonces (Next's inline
// bootstrap, next-themes, and Tailwind/shadcn inject inline styles/scripts).
// `'unsafe-eval'` is dev-only (React Refresh / HMR).
//
// TODO(prod): harden to a nonce-based CSP (drop 'unsafe-inline') via proxy.ts —
// see Next.js "Content Security Policy" guide.
function contentSecurityPolicy(): string {
  const connect = ["'self'"]
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (supabaseUrl) {
    connect.push(supabaseUrl)
    connect.push(supabaseUrl.replace(/^http/, 'ws')) // realtime websockets
  }
  if (!isProd) connect.push('ws:', 'wss:') // HMR

  const scriptSrc = [
    "'self'",
    "'unsafe-inline'",
    ...(isProd ? [] : ["'unsafe-eval'"]),
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

const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy() },
  // 2-year HSTS with preload; only meaningful over HTTPS (ignored on http://localhost).
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
  },
]

const nextConfig: NextConfig = {
  // Don't advertise the framework.
  poweredByHeader: false,
  images: {
    remotePatterns,
  },
  async headers() {
    return [
      {
        // Apply security headers to every route, including server-action POSTs.
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
}

export default withNextIntl(nextConfig)
