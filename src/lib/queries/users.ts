import { createClient } from '@/lib/supabase/server'
import { can } from '@/lib/auth/permissions'
import type { Profile } from '@/types/database'

export interface AssignableUser {
  id: string
  full_name: string | null
  email: string | null
  username: string | null
}

export async function getAssignableUsers(): Promise<AssignableUser[]> {
  const supabase = await createClient()
  // RLS scopes profiles to the caller's organization (platform admins see all).
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, username')
    .eq('status', 'active')
    .order('full_name', { ascending: true, nullsFirst: false })
  if (error) return []
  return (data ?? []) as AssignableUser[]
}

/**
 * Resolve a default approver for a corrective action, enforcing segregation of
 * duties: returns an active member of the same organization who holds the
 * `ca:approve` permission and is NOT the creator. Returns undefined if no such
 * approver exists (callers fall back to the creator).
 */
export async function resolveDefaultApprover(
  creatorId: string,
  organizationId: string | null
): Promise<Profile | undefined> {
  if (!organizationId) return undefined
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('status', 'active')
    .neq('id', creatorId)
  const candidates = (data ?? []) as unknown as Profile[]
  return candidates.find((p) => can(p.role, 'ca:approve'))
}
