import { NextResponse, type NextRequest } from 'next/server'
import { getEffectiveProfile } from '@/lib/auth/impersonation'
import { enforceRateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

/**
 * Returns the effective profile (real, or the impersonated target when an admin
 * is viewing-as) plus the impersonation flag, so the client auth provider can
 * drive UI gating without reading the httpOnly impersonation cookie directly.
 */
export async function GET(request: NextRequest) {
  const limited = enforceRateLimit(request, {
    name: 'effective-profile',
    limit: 120,
    windowMs: 60_000,
  })
  if (limited) return limited

  const { profile, isImpersonating } = await getEffectiveProfile()
  return NextResponse.json({ profile, isImpersonating })
}
