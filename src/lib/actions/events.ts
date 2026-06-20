'use server'

import { revalidatePath } from 'next/cache'
import { requirePermission, requireUser } from '@/lib/auth/guards'
import { allowedEventTransitions } from '@/lib/auth/permissions'
import { MOCK_EVENTS } from '@/lib/mock-data'
import {
  createEventSchema,
  updateApprovalLevelSchema,
  closeoutEventSchema,
  createEventResponseSchema,
} from '@/lib/validators/events'
import type { Event } from '@/types/database'

export async function createEvent(input: unknown) {
  const auth = await requirePermission('event:create')
  if (!auth.ok) return { error: auth.error }

  const parsed = createEventSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const now = new Date().toISOString()
  const data = parsed.data

  const newEvent: Event = {
    id: crypto.randomUUID(),
    reference_number: `EVT-${new Date().getFullYear()}-${String(
      MOCK_EVENTS.length + 1
    ).padStart(3, '0')}`,
    project_id: data.project_id || null,
    created_by: auth.profile.id,
    creator_org_id: auth.profile.organization_id ?? '',
    approval_level: data.approval_level ?? 'draft',
    type: data.type,
    was_fire: data.was_fire,
    was_injury: data.was_injury,
    was_environment_impacted: data.was_environment_impacted,
    was_security: data.was_security,
    impact_other: data.impact_other ?? null,
    classification: data.classification ?? 'to_be_determined',
    site: data.site ?? null,
    contractor: data.contractor ?? null,
    specific_area: data.specific_area ?? null,
    latitude: typeof data.latitude === 'number' ? data.latitude : null,
    longitude: typeof data.longitude === 'number' ? data.longitude : null,
    event_date: data.event_date ?? null,
    reported_date: now,
    work_related: data.work_related,
    impacted_party: data.impacted_party ?? null,
    leadership_member_name: data.leadership_member_name ?? null,
    attendees: data.attendees ?? null,
    notify_attendees_by_email: data.notify_attendees_by_email,
    event_description: data.event_description ?? null,
    conditions: data.conditions ?? null,
    significant_hazard: data.significant_hazard ?? null,
    repeat_incident: data.repeat_incident,
    immediate_corrective_actions: data.immediate_corrective_actions ?? null,
    stop_work: data.stop_work,
    stop_work_details: data.stop_work_details ?? null,
    further_action_required: data.further_action_required,
    photo_urls: data.photo_urls,
    contractor_reviewer: data.contractor_reviewer ?? null,
    reviewer: data.reviewer ?? null,
    contractor_investigator: data.contractor_investigator ?? null,
    lead_investigator: data.lead_investigator ?? null,
    validator: data.validator ?? null,
    approver: data.approver ?? null,
    created_by_name: data.created_by_name ?? null,
    closeout_photo_urls: [],
    date_closure: null,
    reporting_deadline_24h: null,
    reporting_deadline_3day: null,
    deadline_24h_met: false,
    deadline_3day_met: false,
    deadline_24h_met_at: null,
    deadline_3day_met_at: null,
    created_at: now,
    updated_at: now,
  }

  MOCK_EVENTS.push(newEvent)

  revalidatePath('/events')
  revalidatePath('/dashboard')

  return { success: true, event_id: newEvent.id }
}

export async function updateEventApprovalLevel(input: unknown) {
  const auth = await requireUser()
  if (!auth.ok) return { error: auth.error }

  const parsed = updateApprovalLevelSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const event = MOCK_EVENTS.find((e) => e.id === parsed.data.event_id)
  if (!event) return { error: 'Event not found' }

  // Closed events are immutable for everyone (see PLAN, closed-event lock).
  if (event.approval_level === 'closed') {
    return { error: 'Closed events cannot be edited' }
  }

  // Authority over each stage transition is derived from the data model:
  // contractor-owned stages require event:review, client-owned stages require
  // event:manage. Anything outside the role's allowed set is rejected here as
  // well as hidden in the UI.
  const allowed = allowedEventTransitions(
    auth.profile.role,
    event.approval_level,
  )
  if (!allowed.includes(parsed.data.approval_level)) {
    return { error: 'You are not authorized to set this approval level' }
  }

  event.approval_level = parsed.data.approval_level
  event.updated_at = new Date().toISOString()

  revalidatePath(`/events/${parsed.data.event_id}`)
  revalidatePath('/events')
  revalidatePath('/dashboard')

  return { success: true }
}

export async function addEventResponse(input: unknown) {
  const auth = await requirePermission('event:respond')
  if (!auth.ok) return { error: auth.error }

  const parsed = createEventResponseSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  revalidatePath(`/events/${parsed.data.event_id}`)
  revalidatePath('/events')
  revalidatePath('/dashboard')

  return { success: true }
}

export async function closeoutEvent(input: unknown) {
  const auth = await requirePermission('event:manage')
  if (!auth.ok) return { error: auth.error }

  const parsed = closeoutEventSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  revalidatePath(`/events/${parsed.data.event_id}`)
  revalidatePath('/events')
  revalidatePath('/dashboard')

  return { success: true }
}
