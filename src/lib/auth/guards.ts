import { cookies } from 'next/headers'
import { ADMIN_ROLES, type UserRole } from '@/types/enums'
import { can, isViewPermission, type Permission } from '@/lib/auth/permissions'

export const IMPERSONATION_COOKIE = 'impersonate_uid'

export interface SessionProfile {
  id: string
  role: UserRole
  organization_id: string | null
  is_active: boolean
}

const MOCK_SESSION: SessionProfile = {
  id: '00000000-0000-0000-0000-000000000001',
  role: 'client_admin',
  organization_id: '10000000-0000-0000-0000-000000000001',
  is_active: true,
}

export async function getSessionProfile(): Promise<SessionProfile | null> {
  return MOCK_SESSION
}

type GuardResult =
  | { ok: true; profile: SessionProfile }
  | { ok: false; error: string }

export async function requireUser(): Promise<GuardResult> {
  // Deactivated accounts must not pass authentication, even if a session
  // exists (offboarding / SOC 2 access-revocation requirement).
  if (!MOCK_SESSION.is_active) {
    return { ok: false, error: 'Account is inactive' }
  }
  return { ok: true, profile: MOCK_SESSION }
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
