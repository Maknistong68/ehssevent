import { NextResponse } from 'next/server'

/**
 * Lightweight fixed-window rate limiter for API route handlers (M-4).
 *
 * Keyed by client IP, kept in process memory. This is a sane default that
 * throttles obvious abuse (e.g. hammering the expensive XLSX export), but note
 * the limitation:
 *
 * TODO(prod): the in-memory store is PER-INSTANCE and resets on redeploy, so it
 * does not coordinate across serverless/edge instances. Move to a shared store
 * (e.g. Upstash Redis / `@upstash/ratelimit`) before relying on it as a real
 * abuse control.
 */

interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

export interface RateLimitOptions {
  /** Max requests allowed per window. */
  limit: number
  /** Window length in milliseconds. */
  windowMs: number
  /** Namespace so different routes don't share a budget. */
  name: string
}

export interface RateLimitResult {
  ok: boolean
  limit: number
  remaining: number
  retryAfterSec: number
  resetAt: number
}

/** Best-effort client identity from proxy headers. */
export function clientKey(request: Request): string {
  const xff = request.headers.get('x-forwarded-for')
  const ip =
    xff?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown'
  return ip
}

function prune(now: number): void {
  // Opportunistically drop expired buckets so the map can't grow unbounded.
  if (buckets.size < 5000) return
  for (const [key, bucket] of buckets) {
    if (now >= bucket.resetAt) buckets.delete(key)
  }
}

export function checkRateLimit(
  identity: string,
  { limit, windowMs, name }: RateLimitOptions
): RateLimitResult {
  const now = Date.now()
  prune(now)
  const key = `${name}:${identity}`
  const bucket = buckets.get(key)

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return {
      ok: true,
      limit,
      remaining: limit - 1,
      retryAfterSec: 0,
      resetAt: now + windowMs,
    }
  }

  if (bucket.count >= limit) {
    return {
      ok: false,
      limit,
      remaining: 0,
      retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
      resetAt: bucket.resetAt,
    }
  }

  bucket.count += 1
  return {
    ok: true,
    limit,
    remaining: limit - bucket.count,
    retryAfterSec: 0,
    resetAt: bucket.resetAt,
  }
}

function headers(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
  }
}

/**
 * Enforces the limit for a request. Returns a 429 `NextResponse` when the
 * caller is over budget, or `null` to let the handler proceed.
 */
export function enforceRateLimit(
  request: Request,
  options: RateLimitOptions
): NextResponse | null {
  const result = checkRateLimit(clientKey(request), options)
  if (result.ok) return null
  return NextResponse.json(
    { error: 'Too many requests' },
    {
      status: 429,
      headers: {
        ...headers(result),
        'Retry-After': String(result.retryAfterSec),
      },
    }
  )
}
