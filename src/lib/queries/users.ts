import { createClient } from '@/lib/supabase/server'
import { getSessionProfile } from '@/lib/auth/guards'

export interface AssignableUser {
  id: string
  full_name: string | null
  email: string
}

/**
 * Returns active users scoped to the caller's organization.
 * Used for assignment dropdowns (e.g. corrective action assignee / approver).
 * Non-admin callers only see members of their own org; admins see all active users.
 */
export async function getAssignableUsers(): Promise<AssignableUser[]> {
  const profile = await getSessionProfile()
  if (!profile) return []

  const supabase = await createClient()

  let query = supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('is_active', true)
    .order('full_name')

  // Non-admins only see users in their organization
  if (profile.role !== 'system_admin' && profile.role !== 'support') {
    if (!profile.organization_id) return []
    query = query.eq('organization_id', profile.organization_id)
  }

  const { data, error } = await query
  if (error) return []
  return data || []
}
