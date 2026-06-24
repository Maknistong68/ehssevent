import { cookies } from 'next/headers'
import { IMPERSONATION_COOKIE, getSessionProfile } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ADMIN_ROLES } from '@/types/enums'
import type { Profile } from '@/types/database'

export interface EffectiveProfileResult {
  profile: Profile | null
  isImpersonating: boolean
  realProfileId: string | null
}

const PROFILE_SELECT = '*, organization:organizations(*)'

/**
 * Resolves the *effective* profile for the current request: the impersonated
 * target when a valid impersonation cookie is set (and the real user is a
 * platform admin), otherwise the real signed-in profile. Guards/server actions
 * still authorize against the real session — the effective profile only drives
 * the (read-only) view while impersonating.
 */
export async function getEffectiveProfile(): Promise<EffectiveProfileResult> {
  const realSession = await getSessionProfile()
  if (!realSession) {
    return { profile: null, isImpersonating: false, realProfileId: null }
  }
  const realProfileId = realSession.id

  const supabase = await createClient()
  const { data: realProfile } = await supabase
    .from('profiles')
    .select(PROFILE_SELECT)
    .eq('id', realProfileId)
    .single()

  const cookieStore = await cookies()
  const targetId = cookieStore.get(IMPERSONATION_COOKIE)?.value

  // Only platform admins may "view as". The target is fetched with the
  // service-role client so a cross-org target is visible; mutations are still
  // blocked server-side by requirePermission while impersonating.
  if (
    targetId &&
    targetId !== realProfileId &&
    ADMIN_ROLES.includes(realSession.role)
  ) {
    const admin = createAdminClient()
    const { data: target } = await admin
      .from('profiles')
      .select(PROFILE_SELECT)
      .eq('id', targetId)
      .single()
    if (target) {
      return {
        profile: target as Profile,
        isImpersonating: true,
        realProfileId,
      }
    }
  }

  return {
    profile: (realProfile as Profile) ?? null,
    isImpersonating: false,
    realProfileId,
  }
}
