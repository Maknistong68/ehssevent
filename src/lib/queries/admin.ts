import { createAdminClient } from '@/lib/supabase/admin'
import type { Organization, Profile } from '@/types/database'

// The admin console shows every organization and user across the platform, so
// these reads use the service-role client (RLS would otherwise scope them to
// the caller's own org). The pages that call these are admin-guarded.

export async function getAllOrganizations(): Promise<Organization[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('organizations')
    .select('*')
    .order('name', { ascending: true })
  if (error) return []
  return (data ?? []) as unknown as Organization[]
}

export async function getAllProfiles(): Promise<Profile[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('profiles')
    .select('*, organization:organizations(*)')
    .order('created_at', { ascending: false })
  if (error) return []
  return (data ?? []) as unknown as Profile[]
}
