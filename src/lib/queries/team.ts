import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/types/database'

export async function getOrgMembers(
  organizationId: string
): Promise<Profile[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('organization_id', organizationId)
    .order('full_name', { ascending: true, nullsFirst: false })
  if (error) return []
  return (data ?? []) as unknown as Profile[]
}
