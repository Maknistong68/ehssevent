import { NextResponse } from 'next/server'
import { getEffectiveProfile } from '@/lib/auth/impersonation'

export const dynamic = 'force-dynamic'

/**
 * Returns the effective profile (real, or the impersonated target when an admin
 * is viewing-as) plus the impersonation flag, so the client auth provider can
 * drive UI gating without reading the httpOnly impersonation cookie directly.
 */
export async function GET() {
  const { profile, isImpersonating } = await getEffectiveProfile()
  return NextResponse.json({ profile, isImpersonating })
}
