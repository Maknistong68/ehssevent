import { z } from 'zod'

const optionalText = z.string().optional().or(z.literal(''))

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

  // Narrative
  leadership_member_name: optionalText,
  attendees: optionalText,
  event_description: optionalText,
  conditions: optionalText,
  immediate_corrective_actions: optionalText,
  stop_work_details: optionalText,

  // Workflow people
  contractor_reviewer: optionalText,
  reviewer: optionalText,
  contractor_investigator: optionalText,
  lead_investigator: optionalText,
  validator: optionalText,
  approver: optionalText,
  created_by_name: optionalText,

  photo_urls: z.array(z.string()).default([]),
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
export type UpdateApprovalLevelInput = z.infer<typeof updateApprovalLevelSchema>
export type CloseoutEventInput = z.infer<typeof closeoutEventSchema>
