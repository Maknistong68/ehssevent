'use server'

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

  revalidatePath('/projects')
  redirect('/projects')
}

export async function addContractorToProject(_projectId: string, _contractorOrgId: string) {
  const auth = await requirePermission('project:manage')
  if (!auth.ok) return { error: auth.error }

  return { success: true }
}

export async function removeContractorFromProject(
  _projectId: string,
  _contractorOrgId: string
) {
  const auth = await requirePermission('project:manage')
  if (!auth.ok) return { error: auth.error }

  return { success: true }
}
