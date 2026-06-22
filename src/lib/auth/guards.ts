import { cookies } from 'next/headers'
import { ADMIN_ROLES, type UserRole, type UserStatus } from '@/types/enums'
import { can, isViewPermission, type Permission } from '@/lib/auth/permissions'

export const IMPERSONATION_COOKIE = 'impersonate_uid'

export interface SessionProfile {
  id: string
  role: UserRole
  organization_id: string | null
  status: UserStatus
}

const MOCK_SESSION: SessionProfile = {
  id: '00000000-0000-0000-0000-000000000001',
  role: 'client_admin',
  organization_id: '10000000-0000-0000-0000-000000000001',
  status: 'active',
}

export async function getSessionProfile(): Promise<SessionProfile | null> {
  return MOCK_SESSION
}

type GuardResult =
  | { ok: true; profile: SessionProfile }
  | { ok: false; error: string }

export async function requireUser(): Promise<GuardResult> {
  // Only fully `active` accounts may pass authentication. Each non-active
  // status is reported distinctly so the lifecycle is observable:
  //   pending     — self-signup awaiting administrator approval.
  //   invited     — invite not yet accepted.
  //   deactivated — offboarded; access revoked (SOC 2 access-revocation).
  switch (MOCK_SESSION.status) {
    case 'active':
      return { ok: true, profile: MOCK_SESSION }
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
