import { cookies } from 'next/headers'
import { IMPERSONATION_COOKIE, getSessionProfile } from '@/lib/auth/guards'
import { MOCK_CURRENT_USER, MOCK_PROFILES } from '@/lib/mock-data'
import type { Profile } from '@/types/database'

export interface EffectiveProfileResult {
  profile: Profile | null
  isImpersonating: boolean
  realProfileId: string | null
}

/**
 * Resolves the *effective* profile for the current request: the impersonated
 * target when a valid impersonation cookie is set, otherwise the real signed-in
 * profile. Guards/server actions still authorize against the real session — the
 * effective profile only drives the (read-only) view while impersonating.
 */
export async function getEffectiveProfile(): Promise<EffectiveProfileResult> {
  const realSession = await getSessionProfile()
  const realProfileId = realSession?.id ?? MOCK_CURRENT_USER.id

  const cookieStore = await cookies()
  const targetId = cookieStore.get(IMPERSONATION_COOKIE)?.value

  if (targetId && targetId !== realProfileId) {
    const target = MOCK_PROFILES.find((p) => p.id === targetId)
    if (target) {
      return { profile: target, isImpersonating: true, realProfileId }
    }
  }

  // Not impersonating: the effective profile is the real signed-in role (chosen
  // in the login launcher), so the client nav + <Can> gating reflect it.
  const realProfile =
    MOCK_PROFILES.find((p) => p.id === realProfileId) ?? MOCK_CURRENT_USER
  return {
    profile: realProfile,
    isImpersonating: false,
    realProfileId,
  }
}
