'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requirePermission, getSessionProfile } from '@/lib/auth/guards'
import {
  createCorrectiveActionSchema,
  updateCorrectiveActionStatusSchema,
} from '@/lib/validators/corrective-actions'
import { MOCK_CORRECTIVE_ACTIONS, MOCK_PROFILES } from '@/lib/mock-data'
import { logAudit } from '@/lib/actions/audit'
import type { CorrectiveAction } from '@/types/database'

export async function createCorrectiveAction(input: unknown) {
  const auth = await requirePermission('ca:create')
  if (!auth.ok) return { error: auth.error }

  const parsed = createCorrectiveActionSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const profile = await getSessionProfile()
  if (!profile) return { error: 'Not authenticated' }

  const data = parsed.data
  const now = new Date().toISOString()
  const seq = MOCK_CORRECTIVE_ACTIONS.length + 1

  // Approver is automatically the creator.
  const creator = MOCK_PROFILES.find((p) => p.id === profile.id)
  const assignee = MOCK_PROFILES.find((p) => p.id === data.assigned_to)

  const newCa: CorrectiveAction = {
    id: crypto.randomUUID(),
    reference_number: `CA-${new Date().getFullYear()}-${String(seq).padStart(3, '0')}`,
    event_id: data.event_id || null,
    inspection_id: data.inspection_id || null,
    section_id: data.section_id || null,
    item_id: data.item_id || null,
    item_label: data.item_label || null,
    project_id: null,
    created_by: profile.id,
    creator_org_id: profile.organization_id ?? '',
    assigned_to: data.assigned_to,
    approver_id: profile.id,
    title: data.title,
    description: data.description || null,
    priority: 'medium',
    status: 'open',
    due_date: null,
    photo_urls: [],
    completed_at: null,
    approved_at: null,
    rejection_reason: null,
    created_at: now,
    updated_at: now,
    creator,
    assignee,
    approver: creator,
  }

  MOCK_CORRECTIVE_ACTIONS.unshift(newCa)

  await logAudit({
    action: 'corrective_action.create',
    target_table: 'corrective_actions',
    target_id: newCa.id,
    target_label: newCa.reference_number,
    metadata: { priority: newCa.priority, assigned_to: newCa.assigned_to },
  })

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

  const data = parsed.data
  const ca = MOCK_CORRECTIVE_ACTIONS.find(
    (c) => c.id === data.corrective_action_id
  )
  if (!ca) return { error: 'Corrective action not found' }

  const now = new Date().toISOString()
  const previousStatus = ca.status
  ca.status = data.status
  ca.updated_at = now

  if (data.status === 'pending_approval') {
    if (data.photo_urls) ca.photo_urls = data.photo_urls
    ca.completed_at = now
    ca.rejection_reason = null
  } else if (data.status === 'approved') {
    ca.approved_at = now
  } else if (data.status === 'rejected') {
    ca.rejection_reason = data.rejection_reason ?? null
  }

  await logAudit({
    action: `corrective_action.${data.status}`,
    target_table: 'corrective_actions',
    target_id: ca.id,
    target_label: ca.reference_number,
    metadata: { status: { from: previousStatus, to: data.status } },
  })

  revalidatePath(`/corrective-actions/${data.corrective_action_id}`)
  revalidatePath('/corrective-actions')
  revalidatePath('/dashboard')

  return { success: true }
}
