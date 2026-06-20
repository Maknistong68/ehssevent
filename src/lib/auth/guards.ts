import { ADMIN_ROLES, type UserRole } from '@/types/enums'
import { can, type Permission } from '@/lib/auth/permissions'

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
  return result
}
