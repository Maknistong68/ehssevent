'use server'

import { revalidatePath } from 'next/cache'
import {
  requirePermission,
  requireUser,
  getSessionProfile,
} from '@/lib/auth/guards'
import { allowedEventTransitions } from '@/lib/auth/permissions'
import {
  MOCK_EVENTS,
  MOCK_EVENT_RESPONSES,
  MOCK_PROFILES,
  MOCK_ORGANIZATIONS,
} from '@/lib/mock-data'
import {
  createEventSchema,
  updateEventSchema,
  updateApprovalLevelSchema,
  closeoutEventSchema,
  approveCloseoutSchema,
  createEventResponseSchema,
} from '@/lib/validators/events'
import { reduceGeoPrecision } from '@/lib/utils/geo'
import { logAudit } from '@/lib/actions/audit'
import { createNotification } from '@/lib/actions/notifications'
import { EVENT_APPROVAL_LABELS } from '@/types/enums'
import type { Event, EventResponse } from '@/types/database'

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
    // GPS is precision-reduced to ~100 m to avoid pinpointing individuals.
    latitude:
      typeof data.latitude === 'number'
        ? reduceGeoPrecision(data.latitude)
        : null,
    longitude:
      typeof data.longitude === 'number'
        ? reduceGeoPrecision(data.longitude)
        : null,
    event_date: data.event_date ?? null,
    reported_date: now,
    work_related: data.work_related,
    impacted_party: data.impacted_party ?? null,
    leadership_member_id: data.leadership_member_id || null,
    attendee_ids: data.attendee_ids ?? [],
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
    contractor_reviewer_id: data.contractor_reviewer_id || null,
    reviewer_id: data.reviewer_id || null,
    contractor_investigator_id: data.contractor_investigator_id || null,
    lead_investigator_id: data.lead_investigator_id || null,
    validator_id: data.validator_id || null,
    approver_id: data.approver_id || null,
    closeout_photo_urls: [],
    date_closure: null,
    client_closeout_approved_at: null,
    client_closeout_approved_by: null,
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

  await logAudit({
    action: 'event.create',
    target_table: 'events',
    target_id: newEvent.id,
    target_label: newEvent.reference_number,
    metadata: { type: newEvent.type, approval_level: newEvent.approval_level },
  })

  revalidatePath('/events')
  revalidatePath('/dashboard')

  return { success: true, event_id: newEvent.id }
}

// Fields a user may edit on an existing event, paired with how they map from
// the validated input onto the stored Event. Type and approval_level are
// intentionally excluded (type is immutable; level has its own workflow action).
const EDITABLE_EVENT_FIELDS = [
  'classification',
  'significant_hazard',
  'impacted_party',
  'was_fire',
  'was_injury',
  'was_environment_impacted',
  'was_security',
  'impact_other',
  'work_related',
  'repeat_incident',
  'stop_work',
  'stop_work_details',
  'immediate_corrective_actions',
  'leadership_member_id',
  'attendee_ids',
  'project_id',
  'site',
  'contractor',
  'specific_area',
  'event_date',
  'event_description',
  'conditions',
  'notify_attendees_by_email',
  'further_action_required',
  'photo_urls',
] as const

export async function updateEvent(input: unknown) {
  const auth = await requirePermission('event:manage')
  if (!auth.ok) return { error: auth.error }

  const parsed = updateEventSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const data = parsed.data
  const event = MOCK_EVENTS.find((e) => e.id === data.event_id)
  if (!event) return { error: 'Event not found' }

  // Closed events are immutable.
  if (event.approval_level === 'closed') {
    return { error: 'Closed events cannot be edited' }
  }

  // Optimistic-concurrency check: reject the save if the event changed since
  // the form was loaded so one user can't silently overwrite another's edit.
  if (
    data.expected_updated_at &&
    data.expected_updated_at !== event.updated_at
  ) {
    return {
      error:
        'This event was changed by someone else since you opened it. Reload and try again.',
    }
  }

  // Build the changed-field diff and apply edits.
  const diff: Record<string, { from: unknown; to: unknown }> = {}
  const normalize = (key: string, value: unknown): unknown => {
    if (key === 'latitude' || key === 'longitude') {
      return typeof value === 'number' ? reduceGeoPrecision(value) : null
    }
    // Empty strings from optional inputs are stored as null to match seed data.
    if (value === '' || value === undefined) return null
    return value
  }

  for (const key of EDITABLE_EVENT_FIELDS) {
    if (!(key in data)) continue
    const next = normalize(key, (data as Record<string, unknown>)[key])
    const prev = (event as unknown as Record<string, unknown>)[key]
    const changed = Array.isArray(next)
      ? JSON.stringify(next) !== JSON.stringify(prev)
      : next !== prev
    if (changed) {
      diff[key] = { from: prev, to: next }
      ;(event as unknown as Record<string, unknown>)[key] = next
    }
  }

  // Latitude / longitude are normalized but not in EDITABLE_EVENT_FIELDS list.
  for (const key of ['latitude', 'longitude'] as const) {
    const next = normalize(key, (data as Record<string, unknown>)[key])
    if (next !== event[key]) {
      diff[key] = { from: event[key], to: next }
      event[key] = next as number | null
    }
  }

  if (Object.keys(diff).length === 0) {
    return { success: true, event_id: event.id }
  }

  event.updated_at = new Date().toISOString()

  await logAudit({
    action: 'event.update',
    target_table: 'events',
    target_id: event.id,
    target_label: event.reference_number,
    metadata: { changes: diff, reason: data.reason || null },
  })

  revalidatePath(`/events/${event.id}`)
  revalidatePath('/events')
  revalidatePath('/dashboard')

  return { success: true, event_id: event.id }
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
    event.approval_level
  )
  if (!allowed.includes(parsed.data.approval_level)) {
    return { error: 'You are not authorized to set this approval level' }
  }

  const previousLevel = event.approval_level
  event.approval_level = parsed.data.approval_level
  event.updated_at = new Date().toISOString()

  await logAudit({
    action:
      parsed.data.approval_level === 'closed' ? 'event.close' : 'event.advance',
    target_table: 'events',
    target_id: event.id,
    target_label: event.reference_number,
    metadata: {
      approval_level: { from: previousLevel, to: parsed.data.approval_level },
    },
  })

  // Keep the event's reporter informed as it moves through the workflow.
  if (event.created_by && event.created_by !== auth.profile.id) {
    await createNotification({
      user_id: event.created_by,
      type: 'event_stage_changed',
      title: `Event ${event.reference_number} moved to ${
        EVENT_APPROVAL_LABELS[parsed.data.approval_level]
      }`,
      body: event.event_description ?? null,
      link: `/events/${event.id}`,
    })
  }

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

  const event = MOCK_EVENTS.find((e) => e.id === parsed.data.event_id)
  if (!event) return { error: 'Event not found' }

  const profile = await getSessionProfile()
  if (!profile) return { error: 'Not authenticated' }

  const responder = MOCK_PROFILES.find((p) => p.id === profile.id)
  const responderOrgId = profile.organization_id ?? ''
  const responderOrg = MOCK_ORGANIZATIONS.find((o) => o.id === responderOrgId)
  const now = new Date().toISOString()

  const response: EventResponse = {
    id: crypto.randomUUID(),
    event_id: parsed.data.event_id,
    responded_by: profile.id,
    responder_org_id: responderOrgId,
    response_text: parsed.data.response_text,
    photo_urls: parsed.data.photo_urls,
    is_closing: parsed.data.is_closing,
    created_at: now,
    responder: responder ?? undefined,
    responder_organization: responderOrg,
  }
  MOCK_EVENT_RESPONSES.push(response)
  event.updated_at = now

  await logAudit({
    action: 'event.respond',
    target_table: 'events',
    target_id: event.id,
    target_label: event.reference_number,
    metadata: { is_closing: parsed.data.is_closing },
  })

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

  const event = MOCK_EVENTS.find((e) => e.id === parsed.data.event_id)
  if (!event) return { error: 'Event not found' }

  const now = new Date().toISOString()
  event.closeout_photo_urls = parsed.data.closeout_photo_urls
  event.date_closure = parsed.data.date_closure || now
  event.updated_at = now

  await logAudit({
    action: 'event.closeout',
    target_table: 'events',
    target_id: event.id,
    target_label: event.reference_number,
    metadata: { photos: parsed.data.closeout_photo_urls.length },
  })

  revalidatePath(`/events/${parsed.data.event_id}`)
  revalidatePath('/events')
  revalidatePath('/dashboard')

  return { success: true }
}

// Client sign-off on a contractor's closeout. Recorded against the event and
// audited so the approval is accountable. Requires the event to be closed out
// first.
export async function approveCloseout(input: unknown) {
  const auth = await requirePermission('event:manage')
  if (!auth.ok) return { error: auth.error }

  const parsed = approveCloseoutSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const event = MOCK_EVENTS.find((e) => e.id === parsed.data.event_id)
  if (!event) return { error: 'Event not found' }
  if (!event.date_closure) {
    return { error: 'Event must be closed out before it can be approved' }
  }
  if (event.client_closeout_approved_at) {
    return { error: 'Closeout has already been approved' }
  }

  const now = new Date().toISOString()
  event.client_closeout_approved_at = now
  event.client_closeout_approved_by = auth.profile.id
  event.updated_at = now

  await logAudit({
    action: 'event.closeout_approved',
    target_table: 'events',
    target_id: event.id,
    target_label: event.reference_number,
  })

  revalidatePath(`/events/${parsed.data.event_id}`)
  revalidatePath('/events')
  revalidatePath('/dashboard')

  return { success: true }
}
