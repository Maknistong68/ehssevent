'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requirePermission } from '@/lib/auth/guards'
import {
  createCorrectiveActionSchema,
  updateCorrectiveActionStatusSchema,
} from '@/lib/validators/corrective-actions'

export async function createCorrectiveAction(input: unknown) {
  const auth = await requirePermission('ca:create')
  if (!auth.ok) return { error: auth.error }

  const parsed = createCorrectiveActionSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  revalidatePath('/corrective-actions')
  revalidatePath('/dashboard')
  redirect('/corrective-actions')
}

export async function updateCorrectiveActionStatus(input: unknown) {
  const auth = await requirePermission('ca:create')
  if (!auth.ok) return { error: auth.error }

  const parsed = updateCorrectiveActionStatusSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  revalidatePath(`/corrective-actions/${parsed.data.corrective_action_id}`)
  revalidatePath('/corrective-actions')
  revalidatePath('/dashboard')

  return { success: true }
}
