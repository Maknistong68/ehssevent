'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requirePermission, getSessionProfile } from '@/lib/auth/guards'
import {
  createCorrectiveActionSchema,
  updateCorrectiveActionStatusSchema,
  updateCorrectiveActionSchema,
} from '@/lib/validators/corrective-actions'
import {
  MOCK_CORRECTIVE_ACTIONS,
  MOCK_PROFILES,
  MOCK_EVENTS,
  MOCK_INSPECTIONS,
} from '@/lib/mock-data'
import { logAudit } from '@/lib/actions/audit'
import { createNotification } from '@/lib/actions/notifications'
import { resolveDefaultApprover } from '@/lib/queries/users'
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

  const creator = MOCK_PROFILES.find((p) => p.id === profile.id)
  const assignee = MOCK_PROFILES.find((p) => p.id === data.assigned_to)

  // Segregation of duties: the approver must not be the creator. Default to
  // another approver-capable member of the org, falling back to the creator
  // only when no separate approver exists.
  const approver =
    resolveDefaultApprover(profile.id, profile.organization_id ?? null) ??
    creator

  // Derive the project authoritatively from the linked source (server-side),
  // so CAs raised from an Event/Inspection stay project-scoped.
  const linkedEvent = data.event_id
    ? MOCK_EVENTS.find((e) => e.id === data.event_id)
    : undefined
  const linkedInsp = data.inspection_id
    ? MOCK_INSPECTIONS.find((i) => i.id === data.inspection_id)
    : undefined
  const projectId = linkedEvent?.project_id ?? linkedInsp?.project_id ?? null
  const project = linkedEvent?.project ?? linkedInsp?.project ?? undefined

  const newCa: CorrectiveAction = {
    id: crypto.randomUUID(),
    reference_number: `CA-${new Date().getFullYear()}-${String(seq).padStart(3, '0')}`,
    event_id: data.event_id || null,
    inspection_id: data.inspection_id || null,
    section_id: data.section_id || null,
    item_id: data.item_id || null,
    item_label: data.item_label || null,
    project_id: projectId,
    created_by: profile.id,
    creator_org_id: profile.organization_id ?? '',
    assigned_to: data.assigned_to,
    approver_id: approver?.id ?? profile.id,
    title: data.title,
    description: data.description || null,
    priority: data.priority ?? 'medium',
    status: 'open',
    due_date: data.due_date?.trim() ? data.due_date : null,
    photo_urls: [],
    completed_at: null,
    approved_at: null,
    rejection_reason: null,
    created_at: now,
    updated_at: now,
    creator,
    assignee,
    approver,
    project,
  }

  MOCK_CORRECTIVE_ACTIONS.unshift(newCa)

  await logAudit({
    action: 'corrective_action.create',
    target_table: 'corrective_actions',
    target_id: newCa.id,
    target_label: newCa.reference_number,
    metadata: { priority: newCa.priority, assigned_to: newCa.assigned_to },
  })

  // Notify the responsible person they've been assigned a corrective action.
  if (newCa.assigned_to && newCa.assigned_to !== profile.id) {
    await createNotification({
      user_id: newCa.assigned_to,
      type: 'ca_assigned',
      title: `Corrective action assigned: ${newCa.reference_number}`,
      body: newCa.title,
      link: `/corrective-actions/${newCa.id}`,
    })
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

  const data = parsed.data
  const ca = MOCK_CORRECTIVE_ACTIONS.find(
    (c) => c.id === data.corrective_action_id
  )
  if (!ca) return { error: 'Corrective action not found' }

  // Enforce the closure state machine. The assignee may submit straight to
  // pending_approval (evidence is required below) or first mark work in
  // progress; verification (approval) can never be skipped. A rejected action
  // can be reworked or resubmitted directly.
  const allowedTransitions: Record<
    CorrectiveAction['status'],
    CorrectiveAction['status'][]
  > = {
    open: ['in_progress', 'pending_approval'],
    in_progress: ['pending_approval'],
    pending_approval: ['approved', 'rejected'],
    rejected: ['in_progress', 'pending_approval'],
    approved: [],
  }
  if (!allowedTransitions[ca.status].includes(data.status)) {
    return { error: 'Invalid status transition' }
  }

  // Require proof-of-completion before an action can be submitted for approval,
  // so closure is always backed by verifiable evidence.
  if (data.status === 'pending_approval') {
    const evidence = data.photo_urls ?? ca.photo_urls
    if (!evidence || evidence.length === 0) {
      return {
        error:
          'At least one photo is required as evidence before submitting for approval',
      }
    }
  }

  const now = new Date().toISOString()
  const previousStatus = ca.status
  ca.status = data.status
  ca.updated_at = now

  if (data.status === 'in_progress') {
    ca.rejection_reason = null
  } else if (data.status === 'pending_approval') {
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

  // Notify the relevant party about the status change.
  const actor = await getSessionProfile()
  const link = `/corrective-actions/${ca.id}`
  if (
    data.status === 'pending_approval' &&
    ca.approver_id &&
    ca.approver_id !== actor?.id
  ) {
    await createNotification({
      user_id: ca.approver_id,
      type: 'ca_submitted',
      title: `Corrective action submitted for approval: ${ca.reference_number}`,
      body: ca.title,
      link,
    })
  } else if (
    (data.status === 'approved' || data.status === 'rejected') &&
    ca.assigned_to &&
    ca.assigned_to !== actor?.id
  ) {
    await createNotification({
      user_id: ca.assigned_to,
      type: data.status === 'approved' ? 'ca_approved' : 'ca_rejected',
      title: `Corrective action ${data.status}: ${ca.reference_number}`,
      body:
        data.status === 'rejected'
          ? (ca.rejection_reason ?? ca.title)
          : ca.title,
      link,
    })
  }

  revalidatePath(`/corrective-actions/${data.corrective_action_id}`)
  revalidatePath('/corrective-actions')
  revalidatePath('/dashboard')

  return { success: true }
}

export async function updateCorrectiveAction(input: unknown) {
  const auth = await requirePermission('ca:create')
  if (!auth.ok) return { error: auth.error }

  const parsed = updateCorrectiveActionSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const data = parsed.data
  const ca = MOCK_CORRECTIVE_ACTIONS.find(
    (c) => c.id === data.corrective_action_id
  )
  if (!ca) return { error: 'Corrective action not found' }

  if (ca.status === 'approved') {
    return { error: 'Approved corrective actions cannot be edited' }
  }

  const changes: Record<string, { from: unknown; to: unknown }> = {}
  const nextDescription = data.description?.trim() ? data.description : null
  const nextDueDate = data.due_date?.trim() ? data.due_date : null

  if (ca.title !== data.title)
    changes.title = { from: ca.title, to: data.title }
  if (ca.description !== nextDescription)
    changes.description = { from: ca.description, to: nextDescription }
  if (ca.assigned_to !== data.assigned_to)
    changes.assigned_to = { from: ca.assigned_to, to: data.assigned_to }
  if (ca.priority !== data.priority)
    changes.priority = { from: ca.priority, to: data.priority }
  if (ca.due_date !== nextDueDate)
    changes.due_date = { from: ca.due_date, to: nextDueDate }

  ca.title = data.title
  ca.description = nextDescription
  ca.assigned_to = data.assigned_to
  ca.assignee = MOCK_PROFILES.find((p) => p.id === data.assigned_to)
  ca.priority = data.priority
  ca.due_date = nextDueDate
  ca.updated_at = new Date().toISOString()

  await logAudit({
    action: 'corrective_action.update',
    target_table: 'corrective_actions',
    target_id: ca.id,
    target_label: ca.reference_number,
    metadata: { changes },
  })

  // Notify a newly assigned responsible person about the reassignment.
  if (changes.assigned_to && ca.assigned_to !== auth.profile.id) {
    await createNotification({
      user_id: ca.assigned_to,
      type: 'ca_assigned',
      title: `Corrective action assigned: ${ca.reference_number}`,
      body: ca.title,
      link: `/corrective-actions/${ca.id}`,
    })
  }

  revalidatePath(`/corrective-actions/${data.corrective_action_id}`)
  revalidatePath('/corrective-actions')
  revalidatePath('/dashboard')

  return { success: true }
}
