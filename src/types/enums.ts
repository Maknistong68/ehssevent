export type OrgType = 'client' | 'contractor'

export type UserRole =
  | 'system_admin'
  | 'support'
  | 'client_admin'
  | 'client_manager'
  | 'client_user'
  | 'contractor_user'

export const CLIENT_ROLES: UserRole[] = [
  'client_admin',
  'client_manager',
  'client_user',
]

export const ADMIN_ROLES: UserRole[] = ['system_admin', 'support']

// Inspection enums
export type InspectionFieldType =
  | 'text'
  | 'yes_no'
  | 'pass_fail'
  | 'numeric'
  | 'photo'
  | 'dropdown'
  | 'compliance'

export type InspectionStatus = 'draft' | 'completed'

export const INSPECTION_FIELD_TYPE_LABELS: Record<InspectionFieldType, string> = {
  text: 'Text',
  yes_no: 'Yes / No',
  pass_fail: 'Pass / Fail',
  numeric: 'Numeric',
  photo: 'Photo',
  dropdown: 'Dropdown',
  compliance: 'Compliance Level',
}

// ============================================================
// Compliance scoring (4 fixed levels, auto equal-weighted)
// ============================================================

export type ComplianceValue =
  | 'non_compliant'
  | 'partially_compliant'
  | 'fully_compliant'
  | 'not_applicable'

export const COMPLIANCE_LABELS: Record<ComplianceValue, string> = {
  non_compliant: 'Non-Compliant',
  partially_compliant: 'Partially Compliant',
  fully_compliant: 'Fully Compliant',
  not_applicable: 'Not Applicable',
}

// Fraction of the item's weight attained. `null` = excluded from scoring.
export const COMPLIANCE_SCORE: Record<ComplianceValue, number | null> = {
  non_compliant: 0,
  partially_compliant: 0.5,
  fully_compliant: 1,
  not_applicable: null,
}

export const COMPLIANCE_COLORS: Record<ComplianceValue, string> = {
  non_compliant: 'bg-red-100 text-red-800',
  partially_compliant: 'bg-amber-100 text-amber-800',
  fully_compliant: 'bg-green-100 text-green-800',
  not_applicable: 'bg-slate-100 text-slate-700',
}

export const INSPECTION_STATUS_LABELS: Record<InspectionStatus, string> = {
  draft: 'Draft',
  completed: 'Completed',
}

export const INSPECTION_STATUS_COLORS: Record<InspectionStatus, string> = {
  draft: 'bg-amber-100 text-amber-800',
  completed: 'bg-green-100 text-green-800',
}

// ============================================================
// Event enums
// ============================================================

export type EventApprovalLevel =
  | 'draft'
  | 'contractor_review'
  | 'review'
  | 'contractor_investigation'
  | 'investigation'
  | 'validation'
  | 'approval'
  | 'closed'

export type EventType =
  | 'incident'
  | 'near_miss'
  | 'hazard_identification'
  | 'positive_observation'
  | 'leadership_event'

export type EventClassification =
  | 'safety'
  | 'fire'
  | 'environment'
  | 'welfare'
  | 'unsafe_act'
  | 'unsafe_condition'
  | 'non_conformance'
  | 'positive_observation'
  | 'leadership_site_visit'
  | 'emergency_drill'
  | 'safety_meeting'
  | 'contractor_performance_review'
  | 'to_be_determined'

export type EventSignificantHazard =
  | 'mobile_plant_equipment'
  | 'driving'
  | 'working_near_live_roads'
  | 'breaking_ground_excavations'
  | 'work_at_height'
  | 'lifting'
  | 'confined_spaces'
  | 'fire'
  | 'hot_works'
  | 'energised_systems'
  | 'temporary_works'
  | 'drilling_blasting'
  | 'working_near_water'
  | 'working_in_heat'
  | 'other'

export type EventImpactedParty = 'client' | 'contractor' | 'visitor'

// Labels shown in the app UI
export const EVENT_APPROVAL_LABELS: Record<EventApprovalLevel, string> = {
  draft: 'Draft',
  contractor_review: 'Contractor Review',
  review: 'Review',
  contractor_investigation: 'Contractor Investigation',
  investigation: 'Investigation',
  validation: 'Validation',
  approval: 'Approval',
  closed: 'Closed',
}

export const EVENT_APPROVAL_COLORS: Record<EventApprovalLevel, string> = {
  draft: 'bg-slate-100 text-slate-700',
  contractor_review: 'bg-blue-100 text-blue-800',
  review: 'bg-indigo-100 text-indigo-800',
  contractor_investigation: 'bg-amber-100 text-amber-800',
  investigation: 'bg-orange-100 text-orange-800',
  validation: 'bg-purple-100 text-purple-800',
  approval: 'bg-teal-100 text-teal-800',
  closed: 'bg-green-100 text-green-800',
}

// Canonical ordered lifecycle of an event. The sequence alternates between
// contractor-owned and client-owned stages — this ordering is the single
// source of truth for "what comes next" in the approval workflow.
export const EVENT_APPROVAL_SEQUENCE: EventApprovalLevel[] = [
  'draft',
  'contractor_review',
  'review',
  'contractor_investigation',
  'investigation',
  'validation',
  'approval',
  'closed',
]

// Which organization type is responsible for acting at each stage. This is the
// data-structure fact that authorization is derived from: contractor stages can
// only be advanced by contractor-side actors, client stages by client-side
// actors. `null` marks boundary stages (draft = the reporter submits; closed =
// terminal/immutable) that no single org "owns".
export const EVENT_STAGE_OWNER: Record<EventApprovalLevel, OrgType | null> = {
  draft: null,
  contractor_review: 'contractor',
  review: 'client',
  contractor_investigation: 'contractor',
  investigation: 'client',
  validation: 'client',
  approval: 'client',
  closed: null,
}

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  incident: 'Incident',
  near_miss: 'Near Miss',
  hazard_identification: 'Hazard Identification',
  positive_observation: 'Positive Observation',
  leadership_event: 'Leadership Event',
}

export const EVENT_CLASSIFICATION_LABELS: Record<EventClassification, string> = {
  safety: 'Safety',
  fire: 'Fire',
  environment: 'Environment',
  welfare: 'Welfare',
  unsafe_act: 'Unsafe Act',
  unsafe_condition: 'Unsafe Condition',
  non_conformance: 'Non-Conformance',
  positive_observation: 'Positive Observation',
  leadership_site_visit: 'Leadership Site Visit',
  emergency_drill: 'Emergency Drill',
  safety_meeting: 'Safety Meeting (led by Exec Leader)',
  contractor_performance_review: 'Contractor Performance Review',
  to_be_determined: 'To Be Determined',
}

export const EVENT_HAZARD_LABELS: Record<EventSignificantHazard, string> = {
  mobile_plant_equipment: 'Mobile Plant & Equipment',
  driving: 'Driving',
  working_near_live_roads: 'Working on or Near Live Roads',
  breaking_ground_excavations: 'Breaking Ground & Excavations',
  work_at_height: 'Work at Height',
  lifting: 'Lifting',
  confined_spaces: 'Confined Spaces',
  fire: 'Fire',
  hot_works: 'Hot Works',
  energised_systems: 'Energised Systems',
  temporary_works: 'Temporary Works',
  drilling_blasting: 'Drilling and Blasting',
  working_near_water: 'Working on or Near Water',
  working_in_heat: 'Working in the Heat',
  other: 'Other',
}

export const EVENT_IMPACTED_PARTY_LABELS: Record<EventImpactedParty, string> = {
  client: 'Client',
  contractor: 'Contractor',
  visitor: 'Visitor',
}

// ============================================================
// Corrective Action enums
// ============================================================

export type CorrectiveActionStatus =
  | 'open'
  | 'in_progress'
  | 'pending_approval'
  | 'approved'
  | 'rejected'

export type CorrectiveActionPriority = 'low' | 'medium' | 'high' | 'critical'

export const CA_STATUS_LABELS: Record<CorrectiveActionStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  pending_approval: 'Pending Approval',
  approved: 'Approved',
  rejected: 'Rejected',
}

export const CA_STATUS_COLORS: Record<CorrectiveActionStatus, string> = {
  open: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-amber-100 text-amber-800',
  pending_approval: 'bg-purple-100 text-purple-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
}

export const CA_PRIORITY_LABELS: Record<CorrectiveActionPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
}

export const CA_PRIORITY_COLORS: Record<CorrectiveActionPriority, string> = {
  low: 'bg-slate-100 text-slate-700',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
}
