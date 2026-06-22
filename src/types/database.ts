import type {
  OrgType,
  UserRole,
  InspectionFieldType,
  InspectionStatus,
  EventApprovalLevel,
  EventType,
  EventClassification,
  EventSignificantHazard,
  EventImpactedParty,
  CorrectiveActionStatus,
  CorrectiveActionPriority,
  UserStatus,
} from './enums'

export interface Organization {
  id: string
  name: string
  org_type: OrgType
  logo_url: string | null
  contact_email: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  organization_id: string | null
  status: UserStatus
  terms_accepted_at: string | null
  privacy_accepted_at: string | null
  terms_version: string | null
  privacy_version: string | null
  created_at: string
  updated_at: string
  organization?: Organization
}

// Data Subject Request (PDPL Article 4). Records a user's request to exercise
// an actionable right: access, obtain a copy, correction, or destruction.
// Status moves forward as the DPO processes the request.
export interface DsrRequest {
  id: string
  requester_id: string
  requester_email: string
  type: 'access' | 'copy' | 'correction' | 'destruction'
  note: string | null
  status: 'received' | 'in_progress' | 'completed' | 'rejected'
  created_at: string
  due_at: string // statutory response deadline (created_at + DSR_RESPONSE_DAYS)
  resolved_at: string | null
}

export type NotificationType =
  | 'ca_assigned'
  | 'ca_approved'
  | 'ca_rejected'
  | 'ca_submitted'
  | 'event_stage_changed'
  | 'deadline_approaching'

export interface Notification {
  id: string
  user_id: string // recipient
  type: NotificationType
  title: string
  body: string | null
  link: string | null
  read: boolean
  created_at: string
}

// Per-user notification delivery preferences (Settings → Notifications).
export interface NotificationPreferences {
  user_id: string
  email_enabled: boolean
  ca_assigned: boolean
  ca_status: boolean
  event_stage: boolean
  deadlines: boolean
}

export interface Project {
  id: string
  name: string
  description: string | null
  client_org_id: string
  location: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  client_organization?: Organization
}

export interface ProjectContractor {
  project_id: string
  contractor_org_id: string
  created_at: string
  contractor_organization?: Organization
}

export interface Event {
  id: string
  reference_number: string
  project_id: string | null
  created_by: string
  creator_org_id: string
  approval_level: EventApprovalLevel
  type: EventType
  was_fire: boolean
  was_injury: boolean
  was_environment_impacted: boolean
  was_security: boolean
  impact_other: string | null
  classification: EventClassification
  site: string | null
  contractor: string | null
  specific_area: string | null
  latitude: number | null
  longitude: number | null
  event_date: string | null
  reported_date: string | null
  work_related: boolean
  impacted_party: EventImpactedParty | null
  leadership_member_id: string | null
  attendee_ids: string[]
  notify_attendees_by_email: boolean
  event_description: string | null
  conditions: string | null
  significant_hazard: EventSignificantHazard | null
  repeat_incident: boolean
  immediate_corrective_actions: string | null
  stop_work: boolean
  stop_work_details: string | null
  further_action_required: boolean
  photo_urls: string[]
  contractor_reviewer_id: string | null
  reviewer_id: string | null
  contractor_investigator_id: string | null
  lead_investigator_id: string | null
  validator_id: string | null
  approver_id: string | null
  closeout_photo_urls: string[]
  date_closure: string | null
  client_closeout_approved_at: string | null
  client_closeout_approved_by: string | null
  reporting_deadline_24h: string | null
  reporting_deadline_3day: string | null
  deadline_24h_met: boolean
  deadline_3day_met: boolean
  deadline_24h_met_at: string | null
  deadline_3day_met_at: string | null
  created_at: string
  updated_at: string
  project?: Project
  creator?: Profile
  creator_organization?: Organization
  responses?: EventResponse[]
}

export interface EventResponse {
  id: string
  event_id: string
  responded_by: string
  responder_org_id: string
  response_text: string
  photo_urls: string[]
  is_closing: boolean
  created_at: string
  responder?: Profile
  responder_organization?: Organization
}

export interface CorrectiveAction {
  id: string
  reference_number: string
  event_id: string | null
  inspection_id: string | null
  section_id: string | null
  item_id: string | null
  item_label: string | null
  project_id: string | null
  created_by: string
  creator_org_id: string
  assigned_to: string | null
  approver_id: string | null
  title: string
  description: string | null
  priority: CorrectiveActionPriority
  status: CorrectiveActionStatus
  due_date: string | null
  photo_urls: string[]
  completed_at: string | null
  approved_at: string | null
  rejection_reason: string | null
  created_at: string
  updated_at: string
  event?: Event
  inspection?: Pick<Inspection, 'id' | 'reference_number'>
  project?: Project
  creator?: Profile
  assignee?: Profile
  approver?: Profile
}

export interface DashboardStats {
  draft: number
  in_progress: number
  closed: number
  total: number
  open_actions: number
  overdue_actions: number
  deadline_24h_overdue: number
  deadline_3day_overdue: number
  deadline_24h_approaching: number
}

// Inspection types

export interface TemplateItem {
  id: string
  label: string
  field_type: InspectionFieldType
  required: boolean
  options: string[] | null
  order: number
}

export interface TemplateSection {
  id: string
  title: string
  order: number
  items: TemplateItem[]
}

export interface InspectionTemplate {
  id: string
  organization_id: string
  name: string
  description: string | null
  sections: TemplateSection[]
  is_active: boolean
  created_by: string
  created_at: string
  updated_at: string
  creator?: Profile
}

export interface Inspection {
  id: string
  reference_number: string
  template_id: string
  project_id: string
  organization_id: string
  conducted_by: string
  status: InspectionStatus
  score: number | null
  total_items: number
  scorable_items: number
  compliant_items: number
  notes: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
  template?: InspectionTemplate
  project?: Project
  conductor?: Profile
  responses?: InspectionResponse[]
}

export interface InspectionResponse {
  id: string
  inspection_id: string
  section_id: string
  item_id: string
  field_type: InspectionFieldType
  value: string | null
  comment?: string | null
  observation?: string | null
  action_plan?: string | null
  photo_urls: string[]
  created_at: string
}

export interface InspectionStats {
  total: number
  completed_this_month: number
  average_score: number | null
}
