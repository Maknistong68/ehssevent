import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/types/database'

/**
 * Returns all profiles belonging to the given organization.
 * Used by the Team page for client_admin user management.
 */
export async function getOrgMembers(organizationId: string): Promise<Profile[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('*, organization:organizations(id, name, org_type)')
    .eq('organization_id', organizationId)
    .order('full_name')

  if (error) return []
  return (data as unknown as Profile[]) || []
}
