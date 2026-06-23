import { cookies } from 'next/headers'
import { ADMIN_ROLES, type UserRole, type UserStatus } from '@/types/enums'
import { can, isViewPermission, type Permission } from '@/lib/auth/permissions'
import { MOCK_PROFILES } from '@/lib/mock-data'

export const IMPERSONATION_COOKIE = 'impersonate_uid'
// The chosen mock identity from the login role launcher. Both the server guards
// (here) and the client effective-profile resolver read it, so a selected role
// flows through the whole stack — mirroring IMPERSONATION_COOKIE.
export const MOCK_SESSION_COOKIE = 'mock_session_uid'

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
  const cookieStore = await cookies()
  const uid = cookieStore.get(MOCK_SESSION_COOKIE)?.value
  if (uid) {
    const profile = MOCK_PROFILES.find((p) => p.id === uid)
    if (profile) {
      return {
        id: profile.id,
        role: profile.role,
        organization_id: profile.organization_id,
        status: profile.status,
      }
    }
  }
  return MOCK_SESSION
}

type GuardResult =
  | { ok: true; profile: SessionProfile }
  | { ok: false; error: string }

export async function requireUser(): Promise<GuardResult> {
  // Resolve the live session (reflects the role chosen in the login launcher)
  // rather than the hardcoded default, so requireAdmin/requirePermission
  // authorize against the selected role.
  const profile = (await getSessionProfile()) ?? MOCK_SESSION
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
