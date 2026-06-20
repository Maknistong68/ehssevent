import { cookies } from 'next/headers'
import { getSessionProfile, IMPERSONATION_COOKIE } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { can } from '@/lib/auth/permissions'
import type { Profile } from '@/types/database'

export interface EffectiveProfileResult {
  profile: Profile | null
  isImpersonating: boolean
  realProfileId: string | null
}

/**
 * Resolves the profile that should drive UI gating and navigation.
 *
 * Impersonation never changes the database identity — it only swaps the
 * *effective* profile used for display/gating when a real user who holds
 * `impersonate:use` has an active `impersonate_uid` cookie. Otherwise the
 * real authenticated profile is returned.
 */
export async function getEffectiveProfile(): Promise<EffectiveProfileResult> {
  const real = await getSessionProfile()
  if (!real) {
    return { profile: null, isImpersonating: false, realProfileId: null }
  }

  const cookieStore = await cookies()
  const targetId = cookieStore.get(IMPERSONATION_COOKIE)?.value

  // Only honour the cookie if the real user is actually allowed to impersonate.
  if (targetId && targetId !== real.id && can(real.role, 'impersonate:use')) {
    // Use the service-role client so the target (possibly in another org) is
    // readable regardless of RLS.
    const admin = createAdminClient()
    const { data: target } = await admin
      .from('profiles')
      .select('*, organization:organizations(*)')
      .eq('id', targetId)
      .single()

    if (target) {
      return {
        profile: target as unknown as Profile,
        isImpersonating: true,
        realProfileId: real.id,
      }
    }
  }

  // Fall back to the real profile (full row for the client).
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('*, organization:organizations(*)')
    .eq('id', real.id)
    .single()

  return {
    profile: (data as Profile) ?? null,
    isImpersonating: false,
    realProfileId: real.id,
  }
}
