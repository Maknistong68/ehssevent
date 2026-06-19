'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import {
  createCorrectiveActionSchema,
  updateCorrectiveActionStatusSchema,
} from '@/lib/validators/corrective-actions'

function emptyToNull(value: string | undefined): string | null {
  return value && value.length > 0 ? value : null
}

export async function createCorrectiveAction(input: unknown) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const parsed = createCorrectiveActionSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }
  const d = parsed.data

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) {
    return { error: 'Your account is not associated with an organization' }
  }

  const insertData: Record<string, unknown> = {
    title: d.title,
    description: emptyToNull(d.description),
    created_by: user.id,
    creator_org_id: profile.organization_id,
    priority: d.priority,
    status: 'open',
    due_date: emptyToNull(d.due_date),
    photo_urls: d.photo_urls,
  }

  if (d.event_id) insertData.event_id = d.event_id
  if (d.project_id) insertData.project_id = d.project_id
  if (d.assigned_to) insertData.assigned_to = d.assigned_to
  if (d.approver_id) insertData.approver_id = d.approver_id
  if (d.inspection_id) insertData.inspection_id = d.inspection_id
  if (d.section_id) insertData.section_id = d.section_id
  if (d.item_id) insertData.item_id = d.item_id
  if (d.item_label) insertData.item_label = d.item_label

  const { data, error } = await supabase
    .from('corrective_actions')
    .insert(insertData)
    .select('id, event_id, inspection_id')
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/corrective-actions')
  revalidatePath('/dashboard')
  if (data.event_id) {
    revalidatePath(`/events/${data.event_id}`)
  }
  if (data.inspection_id) {
    revalidatePath(`/inspections/${data.inspection_id}`)
  }
  redirect(`/corrective-actions/${data.id}`)
}

export async function updateCorrectiveActionStatus(input: unknown) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const parsed = updateCorrectiveActionStatusSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }
  const d = parsed.data

  const updateData: Record<string, unknown> = { status: d.status }

  if (d.status === 'pending_approval') {
    updateData.completed_at = new Date().toISOString()
  } else if (d.status === 'approved') {
    updateData.approved_at = new Date().toISOString()
    updateData.rejection_reason = null
  } else if (d.status === 'rejected') {
    if (!d.rejection_reason || d.rejection_reason.trim().length === 0) {
      return { error: 'A rejection reason is required' }
    }
    updateData.rejection_reason = d.rejection_reason
  } else if (d.status === 'in_progress') {
    // Re-work after rejection clears the prior completion timestamp
    updateData.completed_at = null
  }

  const { data: ca, error } = await supabase
    .from('corrective_actions')
    .update(updateData)
    .eq('id', d.corrective_action_id)
    .select('id, event_id')
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/corrective-actions/${d.corrective_action_id}`)
  revalidatePath('/corrective-actions')
  revalidatePath('/dashboard')
  if (ca?.event_id) {
    revalidatePath(`/events/${ca.event_id}`)
  }

  return { success: true }
}
