import { cookies } from 'next/headers'
import { ADMIN_ROLES, type UserRole, type UserStatus } from '@/types/enums'
import { can, isViewPermission, type Permission } from '@/lib/auth/permissions'
import { createClient } from '@/lib/supabase/server'

export const IMPERSONATION_COOKIE = 'impersonate_uid'

export interface SessionProfile {
  id: string
  role: UserRole
  organization_id: string | null
  status: UserStatus
}

/**
 * Resolves the REAL signed-in user from Supabase Auth and looks up their
 * profile (role, organization, lifecycle status). Returns `null` when there is
 * no valid session or no matching profile row. There is no hardcoded fallback:
 * an unauthenticated request resolves to no session, full stop.
 *
 * Authorization always runs against this real session. Impersonation ("view
 * as") only changes the *effective* profile used to render the UI — see
 * getEffectiveProfile — and is forced read-only by requirePermission below.
 */
export async function getSessionProfile(): Promise<SessionProfile | null> {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, organization_id, status')
    .eq('id', user.id)
    .single()

  if (!profile) return null

  return {
    id: profile.id as string,
    role: profile.role as UserRole,
    organization_id: profile.organization_id as string | null,
    status: profile.status as UserStatus,
  }
}

type GuardResult =
  | { ok: true; profile: SessionProfile }
  | { ok: false; error: string }

export async function requireUser(): Promise<GuardResult> {
  const profile = await getSessionProfile()
  if (!profile) {
    return { ok: false, error: 'You must be signed in' }
  }
  // Only fully `active` accounts may pass authentication. Each non-active
  // status is reported distinctly so the lifecycle is observable:
  //   pending     — self-signup awaiting administrator approval.
  //   invited     — invite not yet accepted.
  //   deactivated — offboarded; access revoked (SOC 2 access-revocation).
  switch (profile.status) {
    case 'active':
      return { ok: true, profile }
    case 'pending':
      return {
        ok: false,
        error: 'Your account is awaiting administrator approval',
      }
    case 'invited':
      return {
        ok: false,
        error: 'Please accept your invitation to activate your account',
      }
    case 'deactivated':
      return { ok: false, error: 'Account is deactivated' }
  }
}

export async function requireAdmin(): Promise<GuardResult> {
  const result = await requireUser()
  if (!result.ok) return result
  if (!ADMIN_ROLES.includes(result.profile.role)) {
    return { ok: false, error: 'Not authorized' }
  }
  return result
}

export async function requirePermission(p: Permission): Promise<GuardResult> {
  const result = await requireUser()
  if (!result.ok) return result
  if (!can(result.profile.role, p)) {
    return { ok: false, error: 'Not authorized' }
  }
  // While impersonating ("view as"), the session is strictly read-only.
  // Enforced server-side (not just in the UI) so an admin can never mutate
  // another user's data under their identity — PDPL/SOC 2 accountability.
  if (!isViewPermission(p)) {
    const cookieStore = await cookies()
    if (cookieStore.get(IMPERSONATION_COOKIE)?.value) {
      return { ok: false, error: 'Read-only while impersonating' }
    }
  }
  return result
}
