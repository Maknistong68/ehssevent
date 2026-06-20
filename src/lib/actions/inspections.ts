'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requirePermission } from '@/lib/auth/guards'
import {
  createTemplateSchema,
  updateTemplateSchema,
  submitInspectionSchema,
} from '@/lib/validators/inspections'

export async function createTemplate(input: unknown) {
  const auth = await requirePermission('inspection:templates')
  if (!auth.ok) return { error: auth.error }

  const parsed = createTemplateSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  revalidatePath('/inspections/templates')
  redirect('/inspections/templates')
}

export async function updateTemplate(input: unknown) {
  const auth = await requirePermission('inspection:templates')
  if (!auth.ok) return { error: auth.error }

  const parsed = updateTemplateSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  revalidatePath('/inspections/templates')
  revalidatePath(`/inspections/templates/${parsed.data.id}`)

  return { success: true }
}

export async function toggleTemplateActive(_templateId: string) {
  const auth = await requirePermission('inspection:templates')
  if (!auth.ok) return { error: auth.error }

  revalidatePath('/inspections/templates')

  return { success: true }
}

export async function submitInspection(input: unknown) {
  const auth = await requirePermission('inspection:conduct')
  if (!auth.ok) return { error: auth.error }

  const parsed = submitInspectionSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  revalidatePath('/inspections')
  revalidatePath('/dashboard')
  redirect('/inspections')
}
