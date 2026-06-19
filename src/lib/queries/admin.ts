import { createClient } from '@/lib/supabase/server'
import type { Organization, Profile } from '@/types/database'

export async function getAllOrganizations(): Promise<Organization[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .order('name')

  if (error) return []
  return data || []
}

export async function getAllProfiles(): Promise<Profile[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('*, organization:organizations(id, name, org_type)')
    .order('full_name')

  if (error) return []
  return (data as unknown as Profile[]) || []
}
