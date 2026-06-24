import { createClient } from '@/lib/supabase/server'
import type {
  Project,
  Organization,
  Profile,
  ProjectContractor,
} from '@/types/database'

export async function getProjects(): Promise<Project[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('projects')
    .select('*, client_organization:organizations(*)')
    .eq('is_active', true)
    .order('name', { ascending: true })
  if (error) return []
  return (data ?? []) as unknown as Project[]
}

export async function getProjectById(id: string): Promise<Project | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('projects')
    .select('*, client_organization:organizations(*)')
    .eq('id', id)
    .maybeSingle()
  if (error) return null
  return (data as unknown as Project) ?? null
}

export async function getProjectContractors(
  projectId: string
): Promise<ProjectContractor[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('project_contractors')
    .select('*, contractor_organization:organizations(*)')
    .eq('project_id', projectId)
  if (error) return []
  return (data ?? []) as unknown as ProjectContractor[]
}

export async function getContractorOrganizations(): Promise<Organization[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('org_type', 'contractor')
    .eq('is_active', true)
    .order('name', { ascending: true })
  if (error) return []
  return (data ?? []) as unknown as Organization[]
}

export async function getOrganizationUsers(orgId: string): Promise<Profile[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('organization_id', orgId)
    .eq('status', 'active')
    .order('full_name', { ascending: true, nullsFirst: false })
  if (error) return []
  return (data ?? []) as unknown as Profile[]
}
