'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requirePermission } from '@/lib/auth/guards'
import { createProjectSchema, updateProjectSchema } from '@/lib/validators/projects'
import {
  MOCK_PROJECTS,
  MOCK_PROJECT_CONTRACTORS,
  MOCK_ORGANIZATIONS,
} from '@/lib/mock-data'
import { logAudit } from '@/lib/actions/audit'
import type { Project } from '@/types/database'

export async function createProject(input: unknown) {
  const auth = await requirePermission('project:manage')
  if (!auth.ok) return { error: auth.error }

  const parsed = createProjectSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const data = parsed.data
  const now = new Date().toISOString()
  const clientOrgId = auth.profile.organization_id ?? ''
  const clientOrg = MOCK_ORGANIZATIONS.find((o) => o.id === clientOrgId)

  const project: Project = {
    id: crypto.randomUUID(),
    name: data.name,
    description: data.description || null,
    client_org_id: clientOrgId,
    location: data.location || null,
    is_active: true,
    created_at: now,
    updated_at: now,
    client_organization: clientOrg,
  }
  MOCK_PROJECTS.push(project)

  await logAudit({
    action: 'project.create',
    target_table: 'projects',
    target_id: project.id,
    target_label: project.name,
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
  const project = MOCK_PROJECTS.find((p) => p.id === data.id)
  if (!project) return { error: 'Project not found' }

  project.name = data.name
  project.description = data.description || null
  project.location = data.location || null
  if (data.is_active !== undefined) project.is_active = data.is_active
  project.updated_at = new Date().toISOString()

  await logAudit({
    action: 'project.update',
    target_table: 'projects',
    target_id: project.id,
    target_label: project.name,
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

  const project = MOCK_PROJECTS.find((p) => p.id === projectId)
  if (!project) return { error: 'Project not found' }

  const org = MOCK_ORGANIZATIONS.find((o) => o.id === contractorOrgId)
  if (!org) return { error: 'Contractor not found' }

  const exists = MOCK_PROJECT_CONTRACTORS.some(
    (pc) => pc.project_id === projectId && pc.contractor_org_id === contractorOrgId
  )
  if (!exists) {
    MOCK_PROJECT_CONTRACTORS.push({
      project_id: projectId,
      contractor_org_id: contractorOrgId,
      created_at: new Date().toISOString(),
      contractor_organization: org,
    })

    await logAudit({
      action: 'project.contractor_add',
      target_table: 'projects',
      target_id: projectId,
      target_label: project.name,
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

  const idx = MOCK_PROJECT_CONTRACTORS.findIndex(
    (pc) => pc.project_id === projectId && pc.contractor_org_id === contractorOrgId
  )
  if (idx >= 0) {
    const [removed] = MOCK_PROJECT_CONTRACTORS.splice(idx, 1)
    const project = MOCK_PROJECTS.find((p) => p.id === projectId)
    await logAudit({
      action: 'project.contractor_remove',
      target_table: 'projects',
      target_id: projectId,
      target_label: project?.name ?? null,
      metadata: { contractor: removed.contractor_organization?.name ?? contractorOrgId },
    })
  }

  revalidatePath(`/projects/${projectId}`)
  revalidatePath('/projects')
  return { success: true }
}
