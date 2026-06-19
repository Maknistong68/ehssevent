'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import {
  createEventSchema,
  updateApprovalLevelSchema,
  closeoutEventSchema,
  createEventResponseSchema,
} from '@/lib/validators/events'

function emptyToNull(value: string | undefined): string | null {
  return value && value.length > 0 ? value : null
}

function numOrNull(value: number | string | undefined): number | null {
  if (value === undefined || value === '') return null
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : null
}

export async function createEvent(input: unknown) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const parsed = createEventSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }
  const d = parsed.data

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, full_name')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) {
    return { error: 'Your account is not associated with an organization' }
  }

  // Derive classification for fixed types; otherwise honour the dropdown
  // value, falling back to 'to_be_determined'.
  let classification = d.classification
  if (d.type === 'positive_observation') {
    classification = 'positive_observation'
  } else if (d.type === 'leadership_event') {
    classification = 'leadership_site_visit'
  }
  if (!classification) {
    classification = 'to_be_determined'
  }

  const insertData: Record<string, unknown> = {
    created_by: user.id,
    creator_org_id: profile.organization_id,
    approval_level: d.approval_level ?? 'draft',
    type: d.type,
    classification,
    was_fire: d.was_fire,
    was_injury: d.was_injury,
    was_environment_impacted: d.was_environment_impacted,
    was_security: d.was_security,
    work_related: d.work_related,
    notify_attendees_by_email: d.notify_attendees_by_email,
    repeat_incident: d.repeat_incident,
    stop_work: d.stop_work,
    further_action_required: d.further_action_required,
    site: emptyToNull(d.site),
    contractor: emptyToNull(d.contractor),
    specific_area: emptyToNull(d.specific_area),
    latitude: numOrNull(d.latitude as number | string | undefined),
    longitude: numOrNull(d.longitude as number | string | undefined),
    event_date: emptyToNull(d.event_date),
    reported_date: new Date().toISOString(),
    reporting_deadline_24h: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    reporting_deadline_3day: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    significant_hazard: d.significant_hazard ?? null,
    impacted_party: d.impacted_party ?? null,
    impact_other: emptyToNull(d.impact_other),
    leadership_member_name: emptyToNull(d.leadership_member_name),
    attendees: emptyToNull(d.attendees),
    event_description: emptyToNull(d.event_description),
    conditions: emptyToNull(d.conditions),
    immediate_corrective_actions: emptyToNull(d.immediate_corrective_actions),
    stop_work_details: emptyToNull(d.stop_work_details),
    contractor_reviewer: emptyToNull(d.contractor_reviewer),
    reviewer: emptyToNull(d.reviewer),
    contractor_investigator: emptyToNull(d.contractor_investigator),
    lead_investigator: emptyToNull(d.lead_investigator),
    validator: emptyToNull(d.validator),
    approver: emptyToNull(d.approver),
    created_by_name: emptyToNull(d.created_by_name) ?? profile.full_name ?? null,
    photo_urls: d.photo_urls,
  }

  if (d.project_id) {
    insertData.project_id = d.project_id
  }

  const { data, error } = await supabase
    .from('events')
    .insert(insertData)
    .select('id')
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/events')
  revalidatePath('/dashboard')
  redirect(`/events/${data.id}`)
}

export async function updateEventApprovalLevel(input: unknown) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const parsed = updateApprovalLevelSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const updateData: Record<string, unknown> = {
    approval_level: parsed.data.approval_level,
  }

  // When advancing past draft, mark unmet deadlines as met
  if (parsed.data.approval_level !== 'draft') {
    const now = new Date().toISOString()

    // Fetch current event to check deadline status
    const { data: currentEvent } = await supabase
      .from('events')
      .select('deadline_24h_met, deadline_3day_met')
      .eq('id', parsed.data.event_id)
      .single()

    if (currentEvent && !currentEvent.deadline_24h_met) {
      updateData.deadline_24h_met = true
      updateData.deadline_24h_met_at = now
    }
    if (currentEvent && !currentEvent.deadline_3day_met) {
      updateData.deadline_3day_met = true
      updateData.deadline_3day_met_at = now
    }
  }

  const { error } = await supabase
    .from('events')
    .update(updateData)
    .eq('id', parsed.data.event_id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/events/${parsed.data.event_id}`)
  revalidatePath('/events')
  revalidatePath('/dashboard')

  return { success: true }
}

export async function addEventResponse(input: unknown) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const parsed = createEventResponseSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) {
    return { error: 'Your account is not associated with an organization' }
  }

  const { error: responseError } = await supabase
    .from('event_responses')
    .insert({
      event_id: parsed.data.event_id,
      responded_by: user.id,
      responder_org_id: profile.organization_id,
      response_text: parsed.data.response_text,
      photo_urls: parsed.data.photo_urls,
      is_closing: parsed.data.is_closing,
    })

  if (responseError) {
    return { error: responseError.message }
  }

  if (parsed.data.is_closing) {
    await supabase
      .from('events')
      .update({ approval_level: 'closed' })
      .eq('id', parsed.data.event_id)
  }

  revalidatePath(`/events/${parsed.data.event_id}`)
  revalidatePath('/events')
  revalidatePath('/dashboard')

  return { success: true }
}

export async function closeoutEvent(input: unknown) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const parsed = closeoutEventSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { error } = await supabase
    .from('events')
    .update({
      closeout_photo_urls: parsed.data.closeout_photo_urls,
      date_closure: parsed.data.date_closure || new Date().toISOString(),
      approval_level: 'closed',
    })
    .eq('id', parsed.data.event_id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/events/${parsed.data.event_id}`)
  revalidatePath('/events')
  revalidatePath('/dashboard')

  return { success: true }
}
