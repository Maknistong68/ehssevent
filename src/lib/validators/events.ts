import { z } from 'zod'

const optionalText = z.string().optional().or(z.literal(''))
const optionalUuid = z.string().uuid().optional().or(z.literal(''))

export const createEventResponseSchema = z.object({
  event_id: z.string().uuid(),
  response_text: z.string().min(1, 'Response cannot be empty'),
  photo_urls: z.array(z.string()).default([]),
  is_closing: z.boolean().default(false),
})

export const createEventSchema = z.object({
  // Workflow / classification — approval level defaults to 'draft' server-side,
  // classification is derived/defaulted server-side when not supplied.
  approval_level: z
    .enum([
      'draft',
      'contractor_review',
      'review',
      'contractor_investigation',
      'investigation',
      'validation',
      'approval',
      'closed',
    ])
    .optional(),
  type: z.enum([
    'incident',
    'near_miss',
    'hazard_identification',
    'positive_observation',
    'leadership_event',
  ]),
  classification: z
    .enum([
      'safety',
      'fire',
      'environment',
      'welfare',
      'unsafe_act',
      'unsafe_condition',
      'non_conformance',
      'positive_observation',
      'leadership_site_visit',
      'emergency_drill',
      'safety_meeting',
      'contractor_performance_review',
      'to_be_determined',
    ])
    .optional(),
  significant_hazard: z
    .enum([
      'mobile_plant_equipment',
      'driving',
      'working_near_live_roads',
      'breaking_ground_excavations',
      'work_at_height',
      'lifting',
      'confined_spaces',
      'fire',
      'hot_works',
      'energised_systems',
      'temporary_works',
      'drilling_blasting',
      'working_near_water',
      'working_in_heat',
      'other',
    ])
    .optional(),
  impacted_party: z.enum(['client', 'contractor', 'visitor']).optional(),

  // Boolean flags
  was_fire: z.boolean().default(false),
  was_injury: z.boolean().default(false),
  was_environment_impacted: z.boolean().default(false),
  was_security: z.boolean().default(false),
  work_related: z.boolean().default(true),
  notify_attendees_by_email: z.boolean().default(false),
  repeat_incident: z.boolean().default(false),
  stop_work: z.boolean().default(false),
  further_action_required: z.boolean().default(false),

  // Location / linkage
  project_id: z.string().uuid().optional().or(z.literal('')),
  site: optionalText,
  contractor: optionalText,
  specific_area: optionalText,
  latitude: z.coerce.number().optional().or(z.literal('')),
  longitude: z.coerce.number().optional().or(z.literal('')),

  // Dates (date / datetime-local strings). Reported date is set server-side.
  event_date: optionalText,

  // Impact detail
  impact_other: optionalText,

  // People are referenced by account ID (pseudonymous), not free-text names.
  leadership_member_id: optionalUuid,
  attendee_ids: z.array(z.string().uuid()).default([]),

  // Narrative
  event_description: optionalText,
  conditions: optionalText,
  immediate_corrective_actions: optionalText,
  stop_work_details: optionalText,

  // Workflow people (account ID references)
  contractor_reviewer_id: optionalUuid,
  reviewer_id: optionalUuid,
  contractor_investigator_id: optionalUuid,
  lead_investigator_id: optionalUuid,
  validator_id: optionalUuid,
  approver_id: optionalUuid,

  photo_urls: z.array(z.string()).default([]),
})

// Editing an existing event. The event type is immutable (omitted here) and
// changing it would invalidate the workflow, so only the create fields minus
// `type`/`approval_level` are editable. `expected_updated_at` powers the
// optimistic-concurrency check; `reason` is an optional change justification.
export const updateEventSchema = createEventSchema
  .omit({ type: true, approval_level: true })
  .extend({
    event_id: z.string().uuid(),
    reason: z.string().optional(),
    expected_updated_at: z.string().optional(),
  })

export const updateApprovalLevelSchema = z.object({
  event_id: z.string().uuid(),
  approval_level: z.enum([
    'draft',
    'contractor_review',
    'review',
    'contractor_investigation',
    'investigation',
    'validation',
    'approval',
    'closed',
  ]),
})

export const closeoutEventSchema = z.object({
  event_id: z.string().uuid(),
  closeout_photo_urls: z.array(z.string()).default([]),
  date_closure: z.string().optional().or(z.literal('')),
})

export type CreateEventInput = z.infer<typeof createEventSchema>
export type UpdateEventInput = z.infer<typeof updateEventSchema>
export type UpdateApprovalLevelInput = z.infer<typeof updateApprovalLevelSchema>
export type CloseoutEventInput = z.infer<typeof closeoutEventSchema>
