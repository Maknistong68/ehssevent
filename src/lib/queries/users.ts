import { MOCK_PROFILES } from '@/lib/mock-data'
import { can } from '@/lib/auth/permissions'
import type { Profile } from '@/types/database'

export interface AssignableUser {
  id: string
  full_name: string | null
  email: string | null
  username: string | null
}

export async function getAssignableUsers(): Promise<AssignableUser[]> {
  return MOCK_PROFILES.filter((p) => p.status === 'active').map((p) => ({
    id: p.id,
    full_name: p.full_name,
    email: p.email,
    username: p.username,
  }))
}

/**
 * Resolve a default approver for a corrective action, enforcing segregation of
 * duties: returns an active member of the same organization who holds the
 * `ca:approve` permission and is NOT the creator. Returns undefined if no such
 * approver exists (callers fall back to the creator).
 */
export function resolveDefaultApprover(
  creatorId: string,
  organizationId: string | null
): Profile | undefined {
  return MOCK_PROFILES.find(
    (p) =>
      p.id !== creatorId &&
      p.status === 'active' &&
      p.organization_id === organizationId &&
      can(p.role, 'ca:approve')
  )
}
