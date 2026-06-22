import type {
  Organization,
  Profile,
  Project,
  ProjectContractor,
  Event,
  EventResponse,
  CorrectiveAction,
  DashboardStats,
  InspectionTemplate,
  Inspection,
  InspectionResponse,
  InspectionStats,
  DsrRequest,
} from '@/types/database'
import type { AuditLogEntry } from '@/lib/queries/audit'

// ============================================================
// IDs
// ============================================================

export const MOCK_USER_ID = '00000000-0000-0000-0000-000000000001'
const USER2_ID = '00000000-0000-0000-0000-000000000002'
const USER3_ID = '00000000-0000-0000-0000-000000000003'
const CONTRACTOR_USER1_ID = '00000000-0000-0000-0000-000000000004'
const CONTRACTOR_USER2_ID = '00000000-0000-0000-0000-000000000005'
const CONTRACTOR_USER3_ID = '00000000-0000-0000-0000-000000000006'

const CLIENT_ORG_ID = '10000000-0000-0000-0000-000000000001'
const CONTRACTOR_ORG1_ID = '10000000-0000-0000-0000-000000000002'
const CONTRACTOR_ORG2_ID = '10000000-0000-0000-0000-000000000003'
const CONTRACTOR_ORG3_ID = '10000000-0000-0000-0000-000000000004'

const PROJECT1_ID = '20000000-0000-0000-0000-000000000001'
const PROJECT2_ID = '20000000-0000-0000-0000-000000000002'
const PROJECT3_ID = '20000000-0000-0000-0000-000000000003'

const EVENT1_ID = '30000000-0000-0000-0000-000000000001'
const EVENT2_ID = '30000000-0000-0000-0000-000000000002'
const EVENT3_ID = '30000000-0000-0000-0000-000000000003'
const EVENT4_ID = '30000000-0000-0000-0000-000000000004'
const EVENT5_ID = '30000000-0000-0000-0000-000000000005'

const CA1_ID = '40000000-0000-0000-0000-000000000001'
const CA2_ID = '40000000-0000-0000-0000-000000000002'
const CA3_ID = '40000000-0000-0000-0000-000000000003'
const CA4_ID = '40000000-0000-0000-0000-000000000004'

const TEMPLATE1_ID = '50000000-0000-0000-0000-000000000001'
const INSPECTION1_ID = '60000000-0000-0000-0000-000000000001'
const INSPECTION2_ID = '60000000-0000-0000-0000-000000000002'

// ============================================================
// Organizations
// ============================================================

export const MOCK_ORGANIZATIONS: Organization[] = [
  {
    id: CLIENT_ORG_ID,
    name: 'Demo Client Authority',
    org_type: 'client',
    logo_url: null,
    contact_email: 'admin@example.test',
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: CONTRACTOR_ORG1_ID,
    name: 'Demo Contractor Alpha',
    org_type: 'contractor',
    logo_url: null,
    contact_email: 'info@example.test',
    is_active: true,
    created_at: '2025-01-05T00:00:00Z',
    updated_at: '2025-01-05T00:00:00Z',
  },
  {
    id: CONTRACTOR_ORG2_ID,
    name: 'Demo Contractor Beta',
    org_type: 'contractor',
    logo_url: null,
    contact_email: 'contact@example.test',
    is_active: true,
    created_at: '2025-01-10T00:00:00Z',
    updated_at: '2025-01-10T00:00:00Z',
  },
  {
    id: CONTRACTOR_ORG3_ID,
    name: 'Demo Contractor Gamma',
    org_type: 'contractor',
    logo_url: null,
    contact_email: 'ops@example.test',
    is_active: true,
    created_at: '2025-02-01T00:00:00Z',
    updated_at: '2025-02-01T00:00:00Z',
  },
]

// ============================================================
// Profiles
// ============================================================

const CLIENT_ORG_OBJ = MOCK_ORGANIZATIONS[0]

export const MOCK_CURRENT_USER: Profile = {
  id: MOCK_USER_ID,
  email: 'client.admin@example.test',
  full_name: 'Demo Client Admin',
  role: 'client_admin',
  organization_id: CLIENT_ORG_ID,
  status: 'active',
  terms_accepted_at: '2025-01-01T00:00:00Z',
  privacy_accepted_at: '2025-01-01T00:00:00Z',
  terms_version: '1.0',
  privacy_version: '1.0',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  organization: CLIENT_ORG_OBJ,
}

export const MOCK_PROFILES: Profile[] = [
  MOCK_CURRENT_USER,
  {
    id: USER2_ID,
    email: 'client.manager@example.test',
    full_name: 'Demo Client Manager',
    role: 'client_manager',
    organization_id: CLIENT_ORG_ID,
    status: 'active',
    terms_accepted_at: '2025-01-02T00:00:00Z',
    privacy_accepted_at: '2025-01-02T00:00:00Z',
    terms_version: '1.0',
    privacy_version: '1.0',
    created_at: '2025-01-02T00:00:00Z',
    updated_at: '2025-01-02T00:00:00Z',
    organization: CLIENT_ORG_OBJ,
  },
  {
    id: USER3_ID,
    email: 'client.user@example.test',
    full_name: 'Demo Client User',
    role: 'client_user',
    organization_id: CLIENT_ORG_ID,
    status: 'active',
    terms_accepted_at: '2025-01-03T00:00:00Z',
    privacy_accepted_at: '2025-01-03T00:00:00Z',
    terms_version: '1.0',
    privacy_version: '1.0',
    created_at: '2025-01-03T00:00:00Z',
    updated_at: '2025-01-03T00:00:00Z',
    organization: CLIENT_ORG_OBJ,
  },
  {
    id: CONTRACTOR_USER1_ID,
    email: 'contractor.user1@example.test',
    full_name: 'Demo Contractor User 1',
    role: 'contractor_user',
    organization_id: CONTRACTOR_ORG1_ID,
    status: 'active',
    terms_accepted_at: '2025-01-06T00:00:00Z',
    privacy_accepted_at: '2025-01-06T00:00:00Z',
    terms_version: '1.0',
    privacy_version: '1.0',
    created_at: '2025-01-06T00:00:00Z',
    updated_at: '2025-01-06T00:00:00Z',
    organization: MOCK_ORGANIZATIONS[1],
  },
  {
    id: CONTRACTOR_USER2_ID,
    email: 'contractor.user2@example.test',
    full_name: 'Demo Contractor User 2',
    role: 'contractor_user',
    organization_id: CONTRACTOR_ORG2_ID,
    status: 'active',
    terms_accepted_at: '2025-01-11T00:00:00Z',
    privacy_accepted_at: '2025-01-11T00:00:00Z',
    terms_version: '1.0',
    privacy_version: '1.0',
    created_at: '2025-01-11T00:00:00Z',
    updated_at: '2025-01-11T00:00:00Z',
    organization: MOCK_ORGANIZATIONS[2],
  },
  {
    id: CONTRACTOR_USER3_ID,
    email: 'contractor.user3@example.test',
    full_name: 'Demo Contractor User 3',
    role: 'contractor_user',
    organization_id: CONTRACTOR_ORG3_ID,
    status: 'active',
    terms_accepted_at: '2025-02-02T00:00:00Z',
    privacy_accepted_at: '2025-02-02T00:00:00Z',
    terms_version: '1.0',
    privacy_version: '1.0',
    created_at: '2025-02-02T00:00:00Z',
    updated_at: '2025-02-02T00:00:00Z',
    organization: MOCK_ORGANIZATIONS[3],
  },
]

// ============================================================
// Projects
// ============================================================

export const MOCK_PROJECTS: Project[] = [
  {
    id: PROJECT1_ID,
    name: 'Demo Project Alpha',
    description: 'Main port terminal construction and infrastructure development',
    client_org_id: CLIENT_ORG_ID,
    location: 'Demo Zone 1',
    is_active: true,
    created_at: '2025-02-01T00:00:00Z',
    updated_at: '2025-02-01T00:00:00Z',
    client_organization: CLIENT_ORG_OBJ,
  },
  {
    id: PROJECT2_ID,
    name: 'Demo Project Bravo',
    description: 'Storage and logistics warehouse facility',
    client_org_id: CLIENT_ORG_ID,
    location: 'Demo Zone 2',
    is_active: true,
    created_at: '2025-03-01T00:00:00Z',
    updated_at: '2025-03-01T00:00:00Z',
    client_organization: CLIENT_ORG_OBJ,
  },
  {
    id: PROJECT3_ID,
    name: 'Demo Project Charlie',
    description: 'Underwater pipeline and dock extension',
    client_org_id: CLIENT_ORG_ID,
    location: 'Demo Zone 3',
    is_active: true,
    created_at: '2025-04-01T00:00:00Z',
    updated_at: '2025-04-01T00:00:00Z',
    client_organization: CLIENT_ORG_OBJ,
  },
]

export const MOCK_PROJECT_CONTRACTORS: ProjectContractor[] = [
  {
    project_id: PROJECT1_ID,
    contractor_org_id: CONTRACTOR_ORG1_ID,
    created_at: '2025-02-05T00:00:00Z',
    contractor_organization: MOCK_ORGANIZATIONS[1],
  },
  {
    project_id: PROJECT1_ID,
    contractor_org_id: CONTRACTOR_ORG2_ID,
    created_at: '2025-02-06T00:00:00Z',
    contractor_organization: MOCK_ORGANIZATIONS[2],
  },
  {
    project_id: PROJECT2_ID,
    contractor_org_id: CONTRACTOR_ORG2_ID,
    created_at: '2025-03-05T00:00:00Z',
    contractor_organization: MOCK_ORGANIZATIONS[2],
  },
  {
    project_id: PROJECT3_ID,
    contractor_org_id: CONTRACTOR_ORG3_ID,
    created_at: '2025-04-05T00:00:00Z',
    contractor_organization: MOCK_ORGANIZATIONS[3],
  },
]

// ============================================================
// Events
// ============================================================

export const MOCK_EVENTS: Event[] = [
  {
    id: EVENT1_ID,
    reference_number: 'EVT-2025-001',
    project_id: PROJECT1_ID,
    created_by: MOCK_USER_ID,
    creator_org_id: CLIENT_ORG_ID,
    approval_level: 'draft',
    type: 'incident',
    was_fire: false,
    was_injury: true,
    was_environment_impacted: false,
    was_security: false,
    impact_other: null,
    classification: 'safety',
    site: 'Zone A - Terminal Building',
    contractor: 'Demo Contractor Alpha',
    specific_area: 'Ground floor scaffolding',
    latitude: 26.572,
    longitude: 36.098,
    event_date: '2025-05-10T08:30:00Z',
    reported_date: '2025-05-10T09:00:00Z',
    work_related: true,
    impacted_party: 'contractor',
    leadership_member_id: null,
    attendee_ids: [],
    notify_attendees_by_email: false,
    event_description: 'Worker sustained minor hand injury while handling steel beams during scaffolding assembly.',
    conditions: 'Clear weather, good visibility, morning shift',
    significant_hazard: 'work_at_height',
    repeat_incident: false,
    immediate_corrective_actions: 'First aid administered, worker taken to medical facility for evaluation.',
    stop_work: false,
    stop_work_details: null,
    further_action_required: true,
    photo_urls: [],
    contractor_reviewer_id: null,
    reviewer_id: null,
    contractor_investigator_id: null,
    lead_investigator_id: null,
    validator_id: null,
    approver_id: null,
    closeout_photo_urls: [],
    date_closure: null,
    reporting_deadline_24h: '2025-05-11T09:00:00Z',
    reporting_deadline_3day: '2025-05-13T09:00:00Z',
    deadline_24h_met: false,
    deadline_3day_met: false,
    deadline_24h_met_at: null,
    deadline_3day_met_at: null,
    created_at: '2025-05-10T09:00:00Z',
    updated_at: '2025-05-10T09:00:00Z',
    project: MOCK_PROJECTS[0],
    creator: { id: MOCK_USER_ID, email: 'client.admin@example.test', full_name: 'Demo Client Admin', role: 'client_admin', organization_id: CLIENT_ORG_ID, status: 'active', terms_accepted_at: null, privacy_accepted_at: null, terms_version: null, privacy_version: null, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
    creator_organization: CLIENT_ORG_OBJ,
  },
  {
    id: EVENT2_ID,
    reference_number: 'EVT-2025-002',
    project_id: PROJECT2_ID,
    created_by: USER2_ID,
    creator_org_id: CLIENT_ORG_ID,
    approval_level: 'review',
    type: 'near_miss',
    was_fire: false,
    was_injury: false,
    was_environment_impacted: false,
    was_security: false,
    impact_other: null,
    classification: 'unsafe_condition',
    site: 'Warehouse Zone B',
    contractor: 'Demo Contractor Beta',
    specific_area: 'Loading bay 3',
    latitude: null,
    longitude: null,
    event_date: '2025-05-12T14:00:00Z',
    reported_date: '2025-05-12T14:30:00Z',
    work_related: true,
    impacted_party: 'contractor',
    leadership_member_id: null,
    attendee_ids: [],
    notify_attendees_by_email: false,
    event_description: 'Unsecured load nearly fell from forklift during transfer operations. No injuries.',
    conditions: 'Afternoon shift, warehouse interior',
    significant_hazard: 'lifting',
    repeat_incident: false,
    immediate_corrective_actions: 'Area cordoned off, forklift operations paused for review.',
    stop_work: true,
    stop_work_details: 'All forklift operations halted pending equipment inspection',
    further_action_required: true,
    photo_urls: [],
    contractor_reviewer_id: null,
    reviewer_id: USER2_ID,
    contractor_investigator_id: null,
    lead_investigator_id: null,
    validator_id: null,
    approver_id: null,
    closeout_photo_urls: [],
    date_closure: null,
    reporting_deadline_24h: '2025-05-13T14:30:00Z',
    reporting_deadline_3day: '2025-05-15T14:30:00Z',
    deadline_24h_met: true,
    deadline_3day_met: false,
    deadline_24h_met_at: '2025-05-12T15:00:00Z',
    deadline_3day_met_at: null,
    created_at: '2025-05-12T14:30:00Z',
    updated_at: '2025-05-12T15:00:00Z',
    project: MOCK_PROJECTS[1],
    creator: { id: USER2_ID, email: 'client.manager@example.test', full_name: 'Demo Client Manager', role: 'client_manager', organization_id: CLIENT_ORG_ID, status: 'active', terms_accepted_at: null, privacy_accepted_at: null, terms_version: null, privacy_version: null, created_at: '2025-01-02T00:00:00Z', updated_at: '2025-01-02T00:00:00Z' },
    creator_organization: CLIENT_ORG_OBJ,
  },
  {
    id: EVENT3_ID,
    reference_number: 'EVT-2025-003',
    project_id: PROJECT1_ID,
    created_by: CONTRACTOR_USER1_ID,
    creator_org_id: CONTRACTOR_ORG1_ID,
    approval_level: 'investigation',
    type: 'hazard_identification',
    was_fire: false,
    was_injury: false,
    was_environment_impacted: true,
    was_security: false,
    impact_other: null,
    classification: 'environment',
    site: 'Zone C - Coastal Area',
    contractor: 'Demo Contractor Alpha',
    specific_area: 'Drainage channel near pier',
    latitude: 26.575,
    longitude: 36.102,
    event_date: '2025-05-15T10:00:00Z',
    reported_date: '2025-05-15T10:30:00Z',
    work_related: true,
    impacted_party: 'client',
    leadership_member_id: null,
    attendee_ids: [],
    notify_attendees_by_email: false,
    event_description: 'Potential contamination risk identified near drainage channel from excavation work.',
    conditions: 'Post-rain conditions, muddy terrain',
    significant_hazard: 'breaking_ground_excavations',
    repeat_incident: false,
    immediate_corrective_actions: 'Silt fencing installed around excavation perimeter.',
    stop_work: false,
    stop_work_details: null,
    further_action_required: true,
    photo_urls: [],
    contractor_reviewer_id: CONTRACTOR_USER1_ID,
    reviewer_id: null,
    contractor_investigator_id: CONTRACTOR_USER1_ID,
    lead_investigator_id: MOCK_USER_ID,
    validator_id: null,
    approver_id: null,
    closeout_photo_urls: [],
    date_closure: null,
    reporting_deadline_24h: '2025-05-16T10:30:00Z',
    reporting_deadline_3day: '2025-05-18T10:30:00Z',
    deadline_24h_met: true,
    deadline_3day_met: true,
    deadline_24h_met_at: '2025-05-15T11:00:00Z',
    deadline_3day_met_at: '2025-05-15T11:00:00Z',
    created_at: '2025-05-15T10:30:00Z',
    updated_at: '2025-05-16T08:00:00Z',
    project: MOCK_PROJECTS[0],
    creator: { id: CONTRACTOR_USER1_ID, email: 'contractor.user1@example.test', full_name: 'Demo Contractor User 1', role: 'contractor_user', organization_id: CONTRACTOR_ORG1_ID, status: 'active', terms_accepted_at: null, privacy_accepted_at: null, terms_version: null, privacy_version: null, created_at: '2025-01-06T00:00:00Z', updated_at: '2025-01-06T00:00:00Z' },
    creator_organization: MOCK_ORGANIZATIONS[1],
  },
  {
    id: EVENT4_ID,
    reference_number: 'EVT-2025-004',
    project_id: PROJECT3_ID,
    created_by: MOCK_USER_ID,
    creator_org_id: CLIENT_ORG_ID,
    approval_level: 'closed',
    type: 'positive_observation',
    was_fire: false,
    was_injury: false,
    was_environment_impacted: false,
    was_security: false,
    impact_other: null,
    classification: 'positive_observation',
    site: 'Marine Dock Area',
    contractor: 'Demo Contractor Gamma',
    specific_area: 'Dock extension zone',
    latitude: null,
    longitude: null,
    event_date: '2025-04-20T09:00:00Z',
    reported_date: '2025-04-20T09:30:00Z',
    work_related: true,
    impacted_party: null,
    leadership_member_id: null,
    attendee_ids: [],
    notify_attendees_by_email: false,
    event_description: 'Excellent housekeeping and PPE compliance observed during marine works.',
    conditions: 'Good weather, calm sea conditions',
    significant_hazard: null,
    repeat_incident: false,
    immediate_corrective_actions: null,
    stop_work: false,
    stop_work_details: null,
    further_action_required: false,
    photo_urls: [],
    contractor_reviewer_id: null,
    reviewer_id: null,
    contractor_investigator_id: null,
    lead_investigator_id: null,
    validator_id: null,
    approver_id: MOCK_USER_ID,
    closeout_photo_urls: [],
    date_closure: '2025-04-21T12:00:00Z',
    reporting_deadline_24h: '2025-04-21T09:30:00Z',
    reporting_deadline_3day: '2025-04-23T09:30:00Z',
    deadline_24h_met: true,
    deadline_3day_met: true,
    deadline_24h_met_at: '2025-04-20T10:00:00Z',
    deadline_3day_met_at: '2025-04-20T10:00:00Z',
    created_at: '2025-04-20T09:30:00Z',
    updated_at: '2025-04-21T12:00:00Z',
    project: MOCK_PROJECTS[2],
    creator: { id: MOCK_USER_ID, email: 'client.admin@example.test', full_name: 'Demo Client Admin', role: 'client_admin', organization_id: CLIENT_ORG_ID, status: 'active', terms_accepted_at: null, privacy_accepted_at: null, terms_version: null, privacy_version: null, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
    creator_organization: CLIENT_ORG_OBJ,
  },
  {
    id: EVENT5_ID,
    reference_number: 'EVT-2025-005',
    project_id: PROJECT1_ID,
    created_by: USER3_ID,
    creator_org_id: CLIENT_ORG_ID,
    approval_level: 'contractor_review',
    type: 'leadership_event',
    was_fire: false,
    was_injury: false,
    was_environment_impacted: false,
    was_security: false,
    impact_other: null,
    classification: 'leadership_site_visit',
    site: 'Zone A - Terminal Building',
    contractor: null,
    specific_area: 'Main entrance',
    latitude: null,
    longitude: null,
    event_date: '2025-05-18T07:00:00Z',
    reported_date: '2025-05-18T07:30:00Z',
    work_related: true,
    impacted_party: null,
    leadership_member_id: USER2_ID,
    attendee_ids: [USER3_ID, MOCK_USER_ID],
    notify_attendees_by_email: true,
    event_description: 'Senior leadership safety walk covering terminal building construction progress.',
    conditions: 'Morning, clear conditions',
    significant_hazard: null,
    repeat_incident: false,
    immediate_corrective_actions: null,
    stop_work: false,
    stop_work_details: null,
    further_action_required: false,
    photo_urls: [],
    contractor_reviewer_id: null,
    reviewer_id: null,
    contractor_investigator_id: null,
    lead_investigator_id: null,
    validator_id: null,
    approver_id: null,
    closeout_photo_urls: [],
    date_closure: null,
    reporting_deadline_24h: '2025-05-19T07:30:00Z',
    reporting_deadline_3day: '2025-05-21T07:30:00Z',
    deadline_24h_met: true,
    deadline_3day_met: false,
    deadline_24h_met_at: '2025-05-18T08:00:00Z',
    deadline_3day_met_at: null,
    created_at: '2025-05-18T07:30:00Z',
    updated_at: '2025-05-18T08:00:00Z',
    project: MOCK_PROJECTS[0],
    creator: { id: USER3_ID, email: 'client.user@example.test', full_name: 'Demo Client User', role: 'client_user', organization_id: CLIENT_ORG_ID, status: 'active', terms_accepted_at: null, privacy_accepted_at: null, terms_version: null, privacy_version: null, created_at: '2025-01-03T00:00:00Z', updated_at: '2025-01-03T00:00:00Z' },
    creator_organization: CLIENT_ORG_OBJ,
  },
]

// ============================================================
// Event Responses
// ============================================================

export const MOCK_EVENT_RESPONSES: EventResponse[] = [
  {
    id: '70000000-0000-0000-0000-000000000001',
    event_id: EVENT2_ID,
    responded_by: USER2_ID,
    responder_org_id: CLIENT_ORG_ID,
    response_text: 'Forklift inspection completed. Load securement procedure updated and operators re-briefed.',
    photo_urls: [],
    is_closing: false,
    created_at: '2025-05-13T09:00:00Z',
    responder: { id: USER2_ID, email: 'client.manager@example.test', full_name: 'Demo Client Manager', role: 'client_manager', organization_id: CLIENT_ORG_ID, status: 'active', terms_accepted_at: null, privacy_accepted_at: null, terms_version: null, privacy_version: null, created_at: '2025-01-02T00:00:00Z', updated_at: '2025-01-02T00:00:00Z' },
    responder_organization: CLIENT_ORG_OBJ,
  },
  {
    id: '70000000-0000-0000-0000-000000000002',
    event_id: EVENT3_ID,
    responded_by: CONTRACTOR_USER1_ID,
    responder_org_id: CONTRACTOR_ORG1_ID,
    response_text: 'Additional silt fencing installed. Environmental monitoring plan activated for the drainage channel.',
    photo_urls: [],
    is_closing: false,
    created_at: '2025-05-15T16:00:00Z',
    responder: { id: CONTRACTOR_USER1_ID, email: 'contractor.user1@example.test', full_name: 'Demo Contractor User 1', role: 'contractor_user', organization_id: CONTRACTOR_ORG1_ID, status: 'active', terms_accepted_at: null, privacy_accepted_at: null, terms_version: null, privacy_version: null, created_at: '2025-01-06T00:00:00Z', updated_at: '2025-01-06T00:00:00Z' },
    responder_organization: MOCK_ORGANIZATIONS[1],
  },
  {
    id: '70000000-0000-0000-0000-000000000003',
    event_id: EVENT4_ID,
    responded_by: MOCK_USER_ID,
    responder_org_id: CLIENT_ORG_ID,
    response_text: 'Recognition letter sent to contractor team for exemplary safety practices.',
    photo_urls: [],
    is_closing: true,
    created_at: '2025-04-21T12:00:00Z',
    responder: { id: MOCK_USER_ID, email: 'client.admin@example.test', full_name: 'Demo Client Admin', role: 'client_admin', organization_id: CLIENT_ORG_ID, status: 'active', terms_accepted_at: null, privacy_accepted_at: null, terms_version: null, privacy_version: null, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
    responder_organization: CLIENT_ORG_OBJ,
  },
]

// ============================================================
// Corrective Actions
// ============================================================

export const MOCK_CORRECTIVE_ACTIONS: CorrectiveAction[] = [
  {
    id: CA1_ID,
    reference_number: 'CA-2025-001',
    event_id: EVENT1_ID,
    inspection_id: null,
    section_id: null,
    item_id: null,
    item_label: null,
    project_id: PROJECT1_ID,
    created_by: MOCK_USER_ID,
    creator_org_id: CLIENT_ORG_ID,
    assigned_to: MOCK_USER_ID,
    approver_id: MOCK_USER_ID,
    title: 'Review scaffolding safety procedures',
    description: 'Conduct full review of scaffolding assembly procedures and PPE requirements following hand injury incident.',
    priority: 'high',
    status: 'open',
    due_date: '2025-06-01T00:00:00Z',
    photo_urls: [],
    completed_at: null,
    approved_at: null,
    rejection_reason: null,
    created_at: '2025-05-10T10:00:00Z',
    updated_at: '2025-05-10T10:00:00Z',
    event: { id: EVENT1_ID, reference_number: 'EVT-2025-001' } as Event,
    project: MOCK_PROJECTS[0],
    creator: MOCK_CURRENT_USER,
    assignee: MOCK_CURRENT_USER,
    approver: MOCK_CURRENT_USER,
  },
  {
    id: CA2_ID,
    reference_number: 'CA-2025-002',
    event_id: EVENT2_ID,
    inspection_id: null,
    section_id: null,
    item_id: null,
    item_label: null,
    project_id: PROJECT2_ID,
    created_by: USER2_ID,
    creator_org_id: CLIENT_ORG_ID,
    assigned_to: CONTRACTOR_USER2_ID,
    approver_id: USER2_ID,
    title: 'Forklift load securement training',
    description: 'Mandatory retraining for all forklift operators on load securement protocols.',
    priority: 'medium',
    status: 'in_progress',
    due_date: '2025-05-30T00:00:00Z',
    photo_urls: [],
    completed_at: null,
    approved_at: null,
    rejection_reason: null,
    created_at: '2025-05-12T16:00:00Z',
    updated_at: '2025-05-14T09:00:00Z',
    event: { id: EVENT2_ID, reference_number: 'EVT-2025-002' } as Event,
    project: MOCK_PROJECTS[1],
    creator: MOCK_PROFILES[1],
    assignee: MOCK_PROFILES[4],
    approver: MOCK_PROFILES[1],
  },
  {
    id: CA3_ID,
    reference_number: 'CA-2025-003',
    event_id: EVENT3_ID,
    inspection_id: null,
    section_id: null,
    item_id: null,
    item_label: null,
    project_id: PROJECT1_ID,
    created_by: MOCK_USER_ID,
    creator_org_id: CLIENT_ORG_ID,
    assigned_to: MOCK_USER_ID,
    approver_id: MOCK_USER_ID,
    title: 'Install permanent erosion control',
    description: 'Design and install permanent erosion control measures around coastal excavation areas.',
    priority: 'critical',
    status: 'pending_approval',
    due_date: '2025-05-25T00:00:00Z',
    photo_urls: [],
    completed_at: '2025-05-20T14:00:00Z',
    approved_at: null,
    rejection_reason: null,
    created_at: '2025-05-15T12:00:00Z',
    updated_at: '2025-05-20T14:00:00Z',
    event: { id: EVENT3_ID, reference_number: 'EVT-2025-003' } as Event,
    project: MOCK_PROJECTS[0],
    creator: MOCK_CURRENT_USER,
    assignee: MOCK_CURRENT_USER,
    approver: MOCK_CURRENT_USER,
  },
  {
    id: CA4_ID,
    reference_number: 'CA-2025-004',
    event_id: null,
    inspection_id: INSPECTION1_ID,
    section_id: null,
    item_id: null,
    item_label: null,
    project_id: PROJECT1_ID,
    created_by: MOCK_USER_ID,
    creator_org_id: CLIENT_ORG_ID,
    assigned_to: USER3_ID,
    approver_id: MOCK_USER_ID,
    title: 'Update fire extinguisher signage',
    description: 'Replace faded fire extinguisher location signs in Zone A building.',
    priority: 'low',
    status: 'approved',
    due_date: '2025-05-20T00:00:00Z',
    photo_urls: [],
    completed_at: '2025-05-18T10:00:00Z',
    approved_at: '2025-05-19T09:00:00Z',
    rejection_reason: null,
    created_at: '2025-05-05T08:00:00Z',
    updated_at: '2025-05-19T09:00:00Z',
    inspection: { id: INSPECTION1_ID, reference_number: 'INS-2025-001' },
    project: MOCK_PROJECTS[0],
    creator: MOCK_CURRENT_USER,
    assignee: MOCK_PROFILES[2],
    approver: MOCK_CURRENT_USER,
  },
]

// ============================================================
// Inspection Templates
// ============================================================

export const MOCK_INSPECTION_TEMPLATES: InspectionTemplate[] = [
  {
    id: TEMPLATE1_ID,
    organization_id: CLIENT_ORG_ID,
    name: 'General Site Safety Inspection',
    description: 'Standard safety inspection template for all project sites',
    sections: [
      {
        id: 'sec-1',
        title: 'Personal Protective Equipment',
        order: 0,
        items: [
          { id: 'item-1-1', label: 'Hard hats worn by all personnel', field_type: 'compliance', required: true, options: null, order: 0 },
          { id: 'item-1-2', label: 'Safety vests visible', field_type: 'compliance', required: true, options: null, order: 1 },
          { id: 'item-1-3', label: 'Safety boots worn', field_type: 'compliance', required: true, options: null, order: 2 },
          { id: 'item-1-4', label: 'PPE condition notes', field_type: 'text', required: false, options: null, order: 3 },
        ],
      },
      {
        id: 'sec-2',
        title: 'Housekeeping',
        order: 1,
        items: [
          { id: 'item-2-1', label: 'Work area clean and organized', field_type: 'compliance', required: true, options: null, order: 0 },
          { id: 'item-2-2', label: 'Waste properly disposed', field_type: 'compliance', required: true, options: null, order: 1 },
          { id: 'item-2-3', label: 'Access routes clear', field_type: 'yes_no', required: true, options: null, order: 2 },
          { id: 'item-2-4', label: 'Site photo', field_type: 'photo', required: false, options: null, order: 3 },
        ],
      },
      {
        id: 'sec-3',
        title: 'Fire Safety',
        order: 2,
        items: [
          { id: 'item-3-1', label: 'Fire extinguishers accessible', field_type: 'compliance', required: true, options: null, order: 0 },
          { id: 'item-3-2', label: 'Emergency exits clear', field_type: 'yes_no', required: true, options: null, order: 1 },
          { id: 'item-3-3', label: 'Fire safety rating', field_type: 'numeric', required: false, options: null, order: 2 },
        ],
      },
    ],
    is_active: true,
    created_by: MOCK_USER_ID,
    created_at: '2025-02-15T00:00:00Z',
    updated_at: '2025-02-15T00:00:00Z',
    creator: { id: MOCK_USER_ID, email: 'client.admin@example.test', full_name: 'Demo Client Admin', role: 'client_admin', organization_id: CLIENT_ORG_ID, status: 'active', terms_accepted_at: null, privacy_accepted_at: null, terms_version: null, privacy_version: null, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
  },
]

// ============================================================
// Inspections
// ============================================================

export const MOCK_INSPECTIONS: Inspection[] = [
  {
    id: INSPECTION1_ID,
    reference_number: 'INS-2025-001',
    template_id: TEMPLATE1_ID,
    project_id: PROJECT1_ID,
    organization_id: CLIENT_ORG_ID,
    conducted_by: MOCK_USER_ID,
    status: 'completed',
    score: 85.5,
    total_items: 11,
    scorable_items: 6,
    compliant_items: 5,
    notes: 'Generally good compliance. Minor issues with fire extinguisher signage.',
    completed_at: '2025-05-05T14:00:00Z',
    created_at: '2025-05-05T10:00:00Z',
    updated_at: '2025-05-05T14:00:00Z',
    template: { id: TEMPLATE1_ID, name: 'General Site Safety Inspection' } as InspectionTemplate,
    project: MOCK_PROJECTS[0],
    conductor: { id: MOCK_USER_ID, email: 'client.admin@example.test', full_name: 'Demo Client Admin', role: 'client_admin', organization_id: CLIENT_ORG_ID, status: 'active', terms_accepted_at: null, privacy_accepted_at: null, terms_version: null, privacy_version: null, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
  },
  {
    id: INSPECTION2_ID,
    reference_number: 'INS-2025-002',
    template_id: TEMPLATE1_ID,
    project_id: PROJECT2_ID,
    organization_id: CLIENT_ORG_ID,
    conducted_by: USER2_ID,
    status: 'completed',
    score: 92.0,
    total_items: 11,
    scorable_items: 6,
    compliant_items: 6,
    notes: 'Excellent compliance across all areas.',
    completed_at: '2025-05-10T16:00:00Z',
    created_at: '2025-05-10T13:00:00Z',
    updated_at: '2025-05-10T16:00:00Z',
    template: { id: TEMPLATE1_ID, name: 'General Site Safety Inspection' } as InspectionTemplate,
    project: MOCK_PROJECTS[1],
    conductor: { id: USER2_ID, email: 'client.manager@example.test', full_name: 'Demo Client Manager', role: 'client_manager', organization_id: CLIENT_ORG_ID, status: 'active', terms_accepted_at: null, privacy_accepted_at: null, terms_version: null, privacy_version: null, created_at: '2025-01-02T00:00:00Z', updated_at: '2025-01-02T00:00:00Z' },
  },
]

// ============================================================
// Inspection Responses
// ============================================================

export const MOCK_INSPECTION_RESPONSES: InspectionResponse[] = [
  { id: '80000000-0000-0000-0000-000000000001', inspection_id: INSPECTION1_ID, section_id: 'sec-1', item_id: 'item-1-1', field_type: 'compliance', value: 'fully_compliant', photo_urls: [], created_at: '2025-05-05T10:05:00Z' },
  { id: '80000000-0000-0000-0000-000000000002', inspection_id: INSPECTION1_ID, section_id: 'sec-1', item_id: 'item-1-2', field_type: 'compliance', value: 'fully_compliant', photo_urls: [], created_at: '2025-05-05T10:06:00Z' },
  { id: '80000000-0000-0000-0000-000000000003', inspection_id: INSPECTION1_ID, section_id: 'sec-1', item_id: 'item-1-3', field_type: 'compliance', value: 'fully_compliant', photo_urls: [], created_at: '2025-05-05T10:07:00Z' },
  { id: '80000000-0000-0000-0000-000000000004', inspection_id: INSPECTION1_ID, section_id: 'sec-2', item_id: 'item-2-1', field_type: 'compliance', value: 'partially_compliant', photo_urls: [], created_at: '2025-05-05T10:10:00Z' },
  { id: '80000000-0000-0000-0000-000000000005', inspection_id: INSPECTION1_ID, section_id: 'sec-2', item_id: 'item-2-2', field_type: 'compliance', value: 'fully_compliant', photo_urls: [], created_at: '2025-05-05T10:11:00Z' },
  { id: '80000000-0000-0000-0000-000000000006', inspection_id: INSPECTION1_ID, section_id: 'sec-3', item_id: 'item-3-1', field_type: 'compliance', value: 'partially_compliant', photo_urls: [], created_at: '2025-05-05T10:15:00Z' },
]

// ============================================================
// Dashboard Stats
// ============================================================

export const MOCK_DASHBOARD_STATS: DashboardStats = {
  draft: 1,
  in_progress: 3,
  closed: 1,
  total: 5,
  open_actions: 3,
  overdue_actions: 0,
  deadline_24h_overdue: 0,
  deadline_3day_overdue: 0,
  deadline_24h_approaching: 0,
}

// ============================================================
// Inspection Stats
// ============================================================

export const MOCK_INSPECTION_STATS: InspectionStats = {
  total: 2,
  completed_this_month: 2,
  average_score: 88.75,
}

// ============================================================
// Audit Log
// ============================================================

export const MOCK_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: '90000000-0000-0000-0000-000000000001',
    actor_id: MOCK_USER_ID,
    actor_email: 'client.admin@example.test',
    action: 'user.update',
    target_table: 'profiles',
    target_id: CONTRACTOR_USER1_ID,
    target_label: 'contractor.user1@example.test',
    metadata: { role: { from: 'client_user', to: 'contractor_user' } },
    created_at: '2025-05-10T08:00:00Z',
  },
  {
    id: '90000000-0000-0000-0000-000000000002',
    actor_id: MOCK_USER_ID,
    actor_email: 'client.admin@example.test',
    action: 'organization.create',
    target_table: 'organizations',
    target_id: CONTRACTOR_ORG3_ID,
    target_label: 'Demo Contractor Gamma',
    metadata: { org_type: 'contractor' },
    created_at: '2025-02-01T00:00:00Z',
  },
]

// ============================================================
// Data Subject Requests (PDPL)
// ============================================================
// In mock mode this is an in-memory store. submitDsrRequest() appends here so
// the demo can show a request being raised. In production this is a DB table
// the DPO works from.

export const MOCK_DSR_REQUESTS: DsrRequest[] = []
