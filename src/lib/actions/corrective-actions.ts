'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requirePermission, getSessionProfile } from '@/lib/auth/guards'
import {
  createCorrectiveActionSchema,
  updateCorrectiveActionStatusSchema,
  updateCorrectiveActionSchema,
} from '@/lib/validators/corrective-actions'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logAudit } from '@/lib/actions/audit'
import { createNotification } from '@/lib/actions/notifications'
import { resolveDefaultApprover } from '@/lib/queries/users'
import type { CorrectiveAction } from '@/types/database'

type CaStatus = CorrectiveAction['status']

async function nextCaReferenceNumber(): Promise<string> {
  const admin = createAdminClient()
  const { count } = await admin
    .from('corrective_actions')
    .select('id', { count: 'exact', head: true })
  const year = new Date().getFullYear()
  return `CA-${year}-${String((count ?? 0) + 1).padStart(3, '0')}`
}

export async function createCorrectiveAction(input: unknown) {
  const auth = await requirePermission('ca:create')
  if (!auth.ok) return { error: auth.error }

  const parsed = createCorrectiveActionSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const profile = await getSessionProfile()
  if (!profile) return { error: 'Not authenticated' }
  if (!profile.organization_id) {
    return { error: 'Your account is not assigned to an organization' }
  }

  const data = parsed.data
  const supabase = await createClient()

  // Segregation of duties: the approver must not be the creator. Default to
  // another approver-capable member of the org, falling back to the creator
  // only when no separate approver exists.
  const approver = await resolveDefaultApprover(
    profile.id,
    profile.organization_id
  )

  // Derive the project authoritatively from the linked source (server-side),
  // so CAs raised from an Event/Inspection stay project-scoped.
  let projectId: string | null = null
  if (data.event_id) {
    const { data: ev } = await supabase
      .from('events')
      .select('project_id')
      .eq('id', data.event_id)
      .maybeSingle()
    projectId = (ev?.project_id as string | null) ?? null
  } else if (data.inspection_id) {
    const { data: insp } = await supabase
      .from('inspections')
      .select('project_id')
      .eq('id', data.inspection_id)
      .maybeSingle()
    projectId = (insp?.project_id as string | null) ?? null
  }

  const payload = {
    reference_number: await nextCaReferenceNumber(),
    event_id: data.event_id || null,
    inspection_id: data.inspection_id || null,
    section_id: data.section_id || null,
    item_id: data.item_id || null,
    item_label: data.item_label || null,
    project_id: projectId,
    created_by: profile.id,
    creator_org_id: profile.organization_id,
    assigned_to: data.assigned_to,
    approver_id: approver?.id ?? profile.id,
    title: data.title,
    description: data.description || null,
    priority: data.priority ?? 'medium',
    status: 'open' as const,
    due_date: data.due_date?.trim() ? data.due_date : null,
  }

  const { data: created, error } = await supabase
    .from('corrective_actions')
    .insert(payload)
    .select('id, reference_number')
    .single()
  if (error || !created) {
    return { error: error?.message ?? 'Failed to create corrective action' }
  }

  await logAudit({
    action: 'corrective_action.create',
    target_table: 'corrective_actions',
    target_id: created.id as string,
    target_label: created.reference_number as string,
    metadata: { priority: payload.priority, assigned_to: payload.assigned_to },
  })

  // Notify the responsible person they've been assigned a corrective action.
  if (payload.assigned_to && payload.assigned_to !== profile.id) {
    await createNotification({
      user_id: payload.assigned_to,
      type: 'ca_assigned',
      title: `Corrective action assigned: ${created.reference_number}`,
      body: payload.title,
      link: `/corrective-actions/${created.id}`,
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
  const supabase = await createClient()
  const { data: ca } = await supabase
    .from('corrective_actions')
    .select('*')
    .eq('id', data.corrective_action_id)
    .maybeSingle()
  if (!ca) return { error: 'Corrective action not found' }

  // Enforce the closure state machine. The assignee may submit straight to
  // pending_approval (evidence is required below) or first mark work in
  // progress; verification (approval) can never be skipped. A rejected action
  // can be reworked or resubmitted directly.
  const allowedTransitions: Record<CaStatus, CaStatus[]> = {
    open: ['in_progress', 'pending_approval'],
    in_progress: ['pending_approval'],
    pending_approval: ['approved', 'rejected'],
    rejected: ['in_progress', 'pending_approval'],
    approved: [],
  }
  if (!allowedTransitions[ca.status as CaStatus].includes(data.status)) {
    return { error: 'Invalid status transition' }
  }

  // Require proof-of-completion before an action can be submitted for approval,
  // so closure is always backed by verifiable evidence.
  if (data.status === 'pending_approval') {
    const evidence = data.photo_urls ?? (ca.photo_urls as string[])
    if (!evidence || evidence.length === 0) {
      return {
        error:
          'At least one photo is required as evidence before submitting for approval',
      }
    }
  }

  const now = new Date().toISOString()
  const previousStatus = ca.status as CaStatus
  const patch: Record<string, unknown> = { status: data.status }

  if (data.status === 'in_progress') {
    patch.rejection_reason = null
  } else if (data.status === 'pending_approval') {
    if (data.photo_urls) patch.photo_urls = data.photo_urls
    patch.completed_at = now
    patch.rejection_reason = null
  } else if (data.status === 'approved') {
    patch.approved_at = now
  } else if (data.status === 'rejected') {
    patch.rejection_reason = data.rejection_reason ?? null
  }

  const { error } = await supabase
    .from('corrective_actions')
    .update(patch)
    .eq('id', ca.id)
  if (error) return { error: error.message }

  await logAudit({
    action: `corrective_action.${data.status}`,
    target_table: 'corrective_actions',
    target_id: ca.id as string,
    target_label: ca.reference_number as string,
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
      user_id: ca.approver_id as string,
      type: 'ca_submitted',
      title: `Corrective action submitted for approval: ${ca.reference_number}`,
      body: ca.title as string,
      link,
    })
  } else if (
    (data.status === 'approved' || data.status === 'rejected') &&
    ca.assigned_to &&
    ca.assigned_to !== actor?.id
  ) {
    await createNotification({
      user_id: ca.assigned_to as string,
      type: data.status === 'approved' ? 'ca_approved' : 'ca_rejected',
      title: `Corrective action ${data.status}: ${ca.reference_number}`,
      body:
        data.status === 'rejected'
          ? ((patch.rejection_reason as string | null) ?? (ca.title as string))
          : (ca.title as string),
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
  const supabase = await createClient()
  const { data: ca } = await supabase
    .from('corrective_actions')
    .select('*')
    .eq('id', data.corrective_action_id)
    .maybeSingle()
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

  const { error } = await supabase
    .from('corrective_actions')
    .update({
      title: data.title,
      description: nextDescription,
      assigned_to: data.assigned_to,
      priority: data.priority,
      due_date: nextDueDate,
    })
    .eq('id', ca.id)
  if (error) return { error: error.message }

  await logAudit({
    action: 'corrective_action.update',
    target_table: 'corrective_actions',
    target_id: ca.id as string,
    target_label: ca.reference_number as string,
    metadata: { changes },
  })

  // Notify a newly assigned responsible person about the reassignment.
  if (changes.assigned_to && data.assigned_to !== auth.profile.id) {
    await createNotification({
      user_id: data.assigned_to,
      type: 'ca_assigned',
      title: `Corrective action assigned: ${ca.reference_number}`,
      body: data.title,
      link: `/corrective-actions/${ca.id}`,
    })
  }

  revalidatePath(`/corrective-actions/${data.corrective_action_id}`)
  revalidatePath('/corrective-actions')
  revalidatePath('/dashboard')

  return { success: true }
}
