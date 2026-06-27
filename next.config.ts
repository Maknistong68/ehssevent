import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

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

// ── Content-Security-Policy ──────────────────────────────────────────────────
// The CSP is now minted *per request* with a fresh nonce in `proxy.ts` (C1), so
// it is no longer set as a static header here — a static header cannot carry a
// per-request nonce. `proxy.ts` drops `'unsafe-inline'` for scripts in favor of
// `'nonce-…' 'strict-dynamic'`. The remaining headers below are static and
// safe to set at the framework layer.

const securityHeaders = [
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
