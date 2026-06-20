import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { ADMIN_ROLES, type UserRole } from '@/types/enums'
import { can, type Permission } from '@/lib/auth/permissions'

export const IMPERSONATION_COOKIE = 'impersonate_uid'

export interface SessionProfile {
  id: string
  role: UserRole
  organization_id: string | null
  is_active: boolean
}

/**
 * Returns the authenticated user's profile, or null if not signed in.
 * Use this in server actions / server components for authorization checks.
 */
export async function getSessionProfile(): Promise<SessionProfile | null> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('profiles')
    .select('id, role, organization_id, is_active')
    .eq('id', user.id)
    .single()

  return (data as SessionProfile) ?? null
}

type GuardResult =
  | { ok: true; profile: SessionProfile }
  | { ok: false; error: string }

/**
 * Requires an authenticated, active user. Returns the profile or an error.
 *
 * Defense-in-depth: mutations are disabled while an admin is viewing-as another
 * user (impersonation cookie present), so this rejects to keep the simulated
 * session strictly read-only.
 */
export async function requireUser(): Promise<GuardResult> {
  const cookieStore = await cookies()
  if (cookieStore.get(IMPERSONATION_COOKIE)) {
    return { ok: false, error: 'Action disabled while viewing as another user' }
  }

  const profile = await getSessionProfile()
  if (!profile) return { ok: false, error: 'Not authenticated' }
  if (!profile.is_active) return { ok: false, error: 'Your account is inactive' }
  return { ok: true, profile }
}

/**
 * Requires a platform administrator (system_admin or support).
 * Defense-in-depth on top of database RLS.
 */
export async function requireAdmin(): Promise<GuardResult> {
  const result = await requireUser()
  if (!result.ok) return result
  if (!ADMIN_ROLES.includes(result.profile.role)) {
    return { ok: false, error: 'Not authorized' }
  }
  return result
}

/**
 * Requires an authenticated, active user that holds the given permission.
 * Reuses requireUser (auth + active + impersonation checks) and the matrix.
 */
export async function requirePermission(p: Permission): Promise<GuardResult> {
  const result = await requireUser()
  if (!result.ok) return result
  if (!can(result.profile.role, p)) {
    return { ok: false, error: 'Not authorized' }
  }
  return result
}
