'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requirePermission } from '@/lib/auth/guards'
import { createProjectSchema } from '@/lib/validators/projects'

export async function createProject(input: unknown) {
  const auth = await requirePermission('project:manage')
  if (!auth.ok) return { error: auth.error }

  const parsed = createProjectSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  if (!auth.profile.organization_id) {
    return { error: 'Your account is not associated with an organization' }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('projects')
    .insert({
      name: parsed.data.name,
      description: parsed.data.description || null,
      location: parsed.data.location || null,
      client_org_id: auth.profile.organization_id,
    })
    .select('id')
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/projects')
  redirect(`/projects/${data.id}`)
}

export async function addContractorToProject(projectId: string, contractorOrgId: string) {
  const auth = await requirePermission('project:manage')
  if (!auth.ok) return { error: auth.error }

  const supabase = await createClient()

  const { error } = await supabase
    .from('project_contractors')
    .insert({
      project_id: projectId,
      contractor_org_id: contractorOrgId,
    })

  if (error) {
    if (error.code === '23505') {
      return { error: 'This contractor is already assigned to the project' }
    }
    return { error: error.message }
  }

  revalidatePath(`/projects/${projectId}`)
  return { success: true }
}

export async function removeContractorFromProject(
  projectId: string,
  contractorOrgId: string
) {
  const auth = await requirePermission('project:manage')
  if (!auth.ok) return { error: auth.error }

  const supabase = await createClient()

  const { error } = await supabase
    .from('project_contractors')
    .delete()
    .eq('project_id', projectId)
    .eq('contractor_org_id', contractorOrgId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/projects/${projectId}`)
  return { success: true }
}
