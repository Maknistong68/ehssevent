'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requirePermission } from '@/lib/auth/guards'
import {
  createProjectSchema,
  updateProjectSchema,
} from '@/lib/validators/projects'
import { createClient } from '@/lib/supabase/server'
import { logAudit } from '@/lib/actions/audit'

export async function createProject(input: unknown) {
  const auth = await requirePermission('project:manage')
  if (!auth.ok) return { error: auth.error }

  const parsed = createProjectSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  if (!auth.profile.organization_id) {
    return { error: 'Your account is not assigned to an organization' }
  }

  const data = parsed.data
  const supabase = await createClient()
  const { data: project, error } = await supabase
    .from('projects')
    .insert({
      name: data.name,
      description: data.description || null,
      client_org_id: auth.profile.organization_id,
      location: data.location || null,
      is_active: true,
    })
    .select('id, name, location')
    .single()
  if (error || !project) {
    return { error: error?.message ?? 'Failed to create project' }
  }

  await logAudit({
    action: 'project.create',
    target_table: 'projects',
    target_id: project.id as string,
    target_label: project.name as string,
    metadata: { location: project.location },
  })

  revalidatePath('/projects')
  redirect('/projects')
}

export async function updateProject(input: unknown) {
  const auth = await requirePermission('project:manage')
  if (!auth.ok) return { error: auth.error }

  const parsed = updateProjectSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const data = parsed.data
  const supabase = await createClient()
  const patch: Record<string, unknown> = {
    name: data.name,
    description: data.description || null,
    location: data.location || null,
  }
  if (data.is_active !== undefined) patch.is_active = data.is_active

  const { data: project, error } = await supabase
    .from('projects')
    .update(patch)
    .eq('id', data.id)
    .select('id, name')
    .maybeSingle()
  if (error) return { error: error.message }
  if (!project) return { error: 'Project not found' }

  await logAudit({
    action: 'project.update',
    target_table: 'projects',
    target_id: project.id as string,
    target_label: project.name as string,
  })

  revalidatePath(`/projects/${project.id}`)
  revalidatePath('/projects')
  redirect(`/projects/${project.id}`)
}

export async function addContractorToProject(
  projectId: string,
  contractorOrgId: string
) {
  const auth = await requirePermission('project:manage')
  if (!auth.ok) return { error: auth.error }

  const supabase = await createClient()
  const { data: project } = await supabase
    .from('projects')
    .select('id, name')
    .eq('id', projectId)
    .maybeSingle()
  if (!project) return { error: 'Project not found' }

  const { data: org } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('id', contractorOrgId)
    .maybeSingle()
  if (!org) return { error: 'Contractor not found' }

  const { data: existing } = await supabase
    .from('project_contractors')
    .select('project_id')
    .eq('project_id', projectId)
    .eq('contractor_org_id', contractorOrgId)
    .maybeSingle()

  if (!existing) {
    const { error } = await supabase.from('project_contractors').insert({
      project_id: projectId,
      contractor_org_id: contractorOrgId,
    })
    if (error) return { error: error.message }

    await logAudit({
      action: 'project.contractor_add',
      target_table: 'projects',
      target_id: projectId,
      target_label: project.name as string,
      metadata: { contractor: org.name },
    })
  }

  revalidatePath(`/projects/${projectId}`)
  revalidatePath('/projects')
  return { success: true }
}

export async function removeContractorFromProject(
  projectId: string,
  contractorOrgId: string
) {
  const auth = await requirePermission('project:manage')
  if (!auth.ok) return { error: auth.error }

  const supabase = await createClient()
  const { data: org } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', contractorOrgId)
    .maybeSingle()

  const { error } = await supabase
    .from('project_contractors')
    .delete()
    .eq('project_id', projectId)
    .eq('contractor_org_id', contractorOrgId)
  if (error) return { error: error.message }

  const { data: project } = await supabase
    .from('projects')
    .select('name')
    .eq('id', projectId)
    .maybeSingle()

  await logAudit({
    action: 'project.contractor_remove',
    target_table: 'projects',
    target_id: projectId,
    target_label: (project?.name as string | null) ?? null,
    metadata: {
      contractor: (org?.name as string | null) ?? contractorOrgId,
    },
  })

  revalidatePath(`/projects/${projectId}`)
  revalidatePath('/projects')
  return { success: true }
}
