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
  Notification,
  NotificationPreferences,
} from '@/types/database'
import type {
  EventApprovalLevel,
  EventType,
  EventClassification,
  EventSignificantHazard,
  EventImpactedParty,
  CorrectiveActionStatus,
  CorrectiveActionPriority,
  InspectionStatus,
  UserRole,
  UserStatus,
} from '@/types/enums'
import type { AuditLogEntry } from '@/lib/queries/audit'
import { buildCrcTemplates } from '@/lib/data/crc-checklists'

// ============================================================
// Helpers
// ============================================================

const pad12 = (n: number) => String(n).padStart(12, '0')
const pad3 = (n: number) => String(n).padStart(3, '0')
const id = (prefix: string, n: number) => `${prefix}-0000-0000-0000-${pad12(n)}`

// Short id constructors per entity family
const U = (n: number) => id('00000000', n) // users / profiles
const ORG = (n: number) => id('10000000', n) // organizations
const PRJ = (n: number) => id('20000000', n) // projects

// ISO date helpers (kept millisecond-free to match existing style)
const iso = (d: Date) => d.toISOString().replace('.000Z', 'Z')
const addMinutes = (s: string, m: number) => iso(new Date(new Date(s).getTime() + m * 60000))
const addHours = (s: string, h: number) => addMinutes(s, h * 60)

// Demo "snapshot" date. All overdue/approaching calculations are made relative
// to this point so the seeded dataset produces stable, realistic dashboard
// figures regardless of the real wall clock.
const NOW = new Date('2025-06-15T00:00:00Z')

export const MOCK_USER_ID = U(1)

const CLIENT_ORG_ID = ORG(1)

// ============================================================
// Organizations
// ============================================================

export const MOCK_ORGANIZATIONS: Organization[] = [
  { id: ORG(1), name: 'Harbourside Port Authority', org_type: 'client', logo_url: null, contact_email: 'admin@example.test', is_active: true, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
  { id: ORG(2), name: 'Meridian Marine Construction', org_type: 'contractor', logo_url: null, contact_email: 'info@meridian.example.test', is_active: true, created_at: '2025-01-05T00:00:00Z', updated_at: '2025-01-05T00:00:00Z' },
  { id: ORG(3), name: 'Apex Civil Engineering', org_type: 'contractor', logo_url: null, contact_email: 'contact@apex.example.test', is_active: true, created_at: '2025-01-08T00:00:00Z', updated_at: '2025-01-08T00:00:00Z' },
  { id: ORG(4), name: 'Coastal Foundations Ltd', org_type: 'contractor', logo_url: null, contact_email: 'ops@coastal.example.test', is_active: true, created_at: '2025-01-10T00:00:00Z', updated_at: '2025-01-10T00:00:00Z' },
  { id: ORG(5), name: 'Vanguard Electrical Services', org_type: 'contractor', logo_url: null, contact_email: 'hello@vanguard.example.test', is_active: true, created_at: '2025-01-12T00:00:00Z', updated_at: '2025-01-12T00:00:00Z' },
  { id: ORG(6), name: 'Summit Scaffolding & Access', org_type: 'contractor', logo_url: null, contact_email: 'enquiries@summit.example.test', is_active: true, created_at: '2025-01-15T00:00:00Z', updated_at: '2025-01-15T00:00:00Z' },
  { id: ORG(7), name: 'BlueWater Dredging Co', org_type: 'contractor', logo_url: null, contact_email: 'office@bluewater.example.test', is_active: true, created_at: '2025-02-01T00:00:00Z', updated_at: '2025-02-01T00:00:00Z' },
  { id: ORG(8), name: 'Ironclad Steelworks', org_type: 'contractor', logo_url: null, contact_email: 'works@ironclad.example.test', is_active: true, created_at: '2025-02-04T00:00:00Z', updated_at: '2025-02-04T00:00:00Z' },
]

const orgById = (oid: string): Organization =>
  MOCK_ORGANIZATIONS.find((o) => o.id === oid)!

// ============================================================
// Profiles
// ============================================================

function makeProfile(
  n: number,
  full_name: string,
  email: string,
  username: string,
  role: UserRole,
  orgId: string,
  day: string,
  status: UserStatus = 'active'
): Profile {
  const ts = `${day}T00:00:00Z`
  const accepted = status === 'active'
  return {
    id: U(n),
    username,
    email,
    full_name,
    role,
    organization_id: orgId,
    status,
    terms_accepted_at: accepted ? ts : null,
    privacy_accepted_at: accepted ? ts : null,
    terms_version: accepted ? '1.0' : null,
    privacy_version: accepted ? '1.0' : null,
    created_at: ts,
    updated_at: ts,
    organization: orgById(orgId),
  }
}

// Platform roles are not tied to a client/contractor organization, so they
// can't go through `makeProfile` (which requires an org). They seed the two
// `ADMIN_ROLES` (system_admin, support) that gate `/admin`.
function makePlatformProfile(
  n: number,
  full_name: string,
  email: string,
  username: string,
  role: UserRole,
  day: string
): Profile {
  const ts = `${day}T00:00:00Z`
  return {
    id: U(n),
    username,
    email,
    full_name,
    role,
    organization_id: null,
    status: 'active',
    terms_accepted_at: ts,
    privacy_accepted_at: ts,
    terms_version: '1.0',
    privacy_version: '1.0',
    created_at: ts,
    updated_at: ts,
    organization: undefined,
  }
}

export const MOCK_PROFILES: Profile[] = [
  makeProfile(1, 'Sarah Mitchell', 'client.admin@example.test', 'clientadmin01', 'client_admin', ORG(1), '2025-01-01'),
  makeProfile(2, 'James Okafor', 'james.okafor@example.test', 'manager01', 'client_manager', ORG(1), '2025-01-02'),
  makeProfile(3, 'Priya Raman', 'priya.raman@example.test', 'user01', 'client_user', ORG(1), '2025-01-03'),
  makeProfile(4, 'Daniel Cho', 'daniel.cho@example.test', 'user02', 'client_user', ORG(1), '2025-01-08'),
  makeProfile(5, 'Aisha Rahman', 'aisha.rahman@example.test', 'manager02', 'client_manager', ORG(1), '2025-01-09'),
  makeProfile(6, 'Carlos Mendez', 'carlos.mendez@example.test', 'contractor01', 'contractor_user', ORG(2), '2025-01-06'),
  makeProfile(7, 'Lena Fischer', 'lena.fischer@example.test', 'contractor02', 'contractor_user', ORG(2), '2025-01-12'),
  makeProfile(8, 'Raj Patel', 'raj.patel@example.test', 'contractor03', 'contractor_user', ORG(3), '2025-01-11'),
  makeProfile(9, 'Mohammed Al-Farsi', 'mohammed.alfarsi@example.test', 'contractor04', 'contractor_user', ORG(4), '2025-01-15'),
  makeProfile(10, 'Grace Liu', 'grace.liu@example.test', 'contractor05', 'contractor_user', ORG(5), '2025-01-18'),
  makeProfile(11, 'Owen Walsh', 'owen.walsh@example.test', 'contractor06', 'contractor_user', ORG(6), '2025-01-20'),
  makeProfile(12, 'Sofia Romano', 'sofia.romano@example.test', 'contractor07', 'contractor_user', ORG(7), '2025-02-02'),
  makeProfile(13, 'Hassan Karim', 'hassan.karim@example.test', 'contractor08', 'contractor_user', ORG(8), '2025-02-05', 'deactivated'),
  makeProfile(14, 'Tom Becker', 'tom.becker@example.test', 'user03', 'client_user', ORG(1), '2025-02-10', 'pending'),
  makeProfile(15, 'Emma Schmidt', 'emma.schmidt@example.test', 'contractor09', 'contractor_user', ORG(3), '2025-02-12'),
  makePlatformProfile(100, 'Platform Admin', 'sysadmin@example.test', 'sysadmin01', 'system_admin', '2025-01-01'),
  makePlatformProfile(101, 'Platform Support', 'support@example.test', 'support01', 'support', '2025-01-01'),
]

export const MOCK_CURRENT_USER: Profile = MOCK_PROFILES[0]

const profileById = (pid: string): Profile =>
  MOCK_PROFILES.find((p) => p.id === pid)!

// ============================================================
// Projects
// ============================================================

export const MOCK_PROJECTS: Project[] = [
  { id: PRJ(1), name: 'Harbour Terminal Expansion', description: 'Berth 4–6 deepwater terminal construction and quay wall works', client_org_id: CLIENT_ORG_ID, location: 'North Quay', is_active: true, created_at: '2025-01-20T00:00:00Z', updated_at: '2025-01-20T00:00:00Z', client_organization: orgById(ORG(1)) },
  { id: PRJ(2), name: 'Logistics Warehouse Complex', description: 'Bonded storage and distribution warehouse facility', client_org_id: CLIENT_ORG_ID, location: 'Inland Logistics Zone', is_active: true, created_at: '2025-02-01T00:00:00Z', updated_at: '2025-02-01T00:00:00Z', client_organization: orgById(ORG(1)) },
  { id: PRJ(3), name: 'Subsea Pipeline & Dock Extension', description: 'Subsea fuel pipeline installation and dock extension works', client_org_id: CLIENT_ORG_ID, location: 'South Marine Zone', is_active: true, created_at: '2025-02-15T00:00:00Z', updated_at: '2025-02-15T00:00:00Z', client_organization: orgById(ORG(1)) },
  { id: PRJ(4), name: 'Container Yard Resurfacing', description: 'Resurfacing and drainage upgrade of the main container yard', client_org_id: CLIENT_ORG_ID, location: 'Central Yard', is_active: true, created_at: '2025-03-01T00:00:00Z', updated_at: '2025-03-01T00:00:00Z', client_organization: orgById(ORG(1)) },
  { id: PRJ(5), name: 'Breakwater Reinforcement Works', description: 'Reinforcement and rock armouring of the eastern breakwater', client_org_id: CLIENT_ORG_ID, location: 'East Breakwater', is_active: true, created_at: '2025-03-10T00:00:00Z', updated_at: '2025-03-10T00:00:00Z', client_organization: orgById(ORG(1)) },
  { id: PRJ(6), name: 'Administration & Welfare Building', description: 'New three-storey administration and welfare facility', client_org_id: CLIENT_ORG_ID, location: 'Admin Precinct', is_active: true, created_at: '2025-03-20T00:00:00Z', updated_at: '2025-03-20T00:00:00Z', client_organization: orgById(ORG(1)) },
]

const projectById = (pid: string): Project =>
  MOCK_PROJECTS.find((p) => p.id === pid)!

export const MOCK_PROJECT_CONTRACTORS: ProjectContractor[] = [
  { project_id: PRJ(1), contractor_org_id: ORG(2), created_at: '2025-01-22T00:00:00Z', contractor_organization: orgById(ORG(2)) },
  { project_id: PRJ(1), contractor_org_id: ORG(6), created_at: '2025-01-23T00:00:00Z', contractor_organization: orgById(ORG(6)) },
  { project_id: PRJ(1), contractor_org_id: ORG(8), created_at: '2025-01-24T00:00:00Z', contractor_organization: orgById(ORG(8)) },
  { project_id: PRJ(2), contractor_org_id: ORG(3), created_at: '2025-02-03T00:00:00Z', contractor_organization: orgById(ORG(3)) },
  { project_id: PRJ(2), contractor_org_id: ORG(6), created_at: '2025-02-04T00:00:00Z', contractor_organization: orgById(ORG(6)) },
  { project_id: PRJ(3), contractor_org_id: ORG(4), created_at: '2025-02-17T00:00:00Z', contractor_organization: orgById(ORG(4)) },
  { project_id: PRJ(3), contractor_org_id: ORG(7), created_at: '2025-02-18T00:00:00Z', contractor_organization: orgById(ORG(7)) },
  { project_id: PRJ(4), contractor_org_id: ORG(3), created_at: '2025-03-03T00:00:00Z', contractor_organization: orgById(ORG(3)) },
  { project_id: PRJ(5), contractor_org_id: ORG(2), created_at: '2025-03-12T00:00:00Z', contractor_organization: orgById(ORG(2)) },
  { project_id: PRJ(5), contractor_org_id: ORG(7), created_at: '2025-03-13T00:00:00Z', contractor_organization: orgById(ORG(7)) },
  { project_id: PRJ(5), contractor_org_id: ORG(4), created_at: '2025-03-14T00:00:00Z', contractor_organization: orgById(ORG(4)) },
  { project_id: PRJ(6), contractor_org_id: ORG(3), created_at: '2025-03-22T00:00:00Z', contractor_organization: orgById(ORG(3)) },
  { project_id: PRJ(6), contractor_org_id: ORG(5), created_at: '2025-03-23T00:00:00Z', contractor_organization: orgById(ORG(5)) },
]

// ============================================================
// Events
// ============================================================

interface EventSeed {
  n: number
  prj: number
  by: number
  lvl: EventApprovalLevel
  type: EventType
  cls: EventClassification
  site: string
  area: string
  con: number | null
  date: string
  desc: string
  cond: string
  hz?: EventSignificantHazard | null
  inj?: boolean
  fire?: boolean
  env?: boolean
  sec?: boolean
  party?: EventImpactedParty | null
  stop?: boolean
  stopDet?: string
  imm?: string | null
  further?: boolean
  repeat?: boolean
  lat?: number
  lng?: number
  cr?: number
  rv?: number
  ci?: number
  li?: number
  vl?: number
  ap?: number
  lead?: number
  att?: number[]
}

function makeEvent(s: EventSeed): Event {
  const creator = profileById(U(s.by))
  const reported = addMinutes(s.date, 30)
  const beyond = s.lvl !== 'draft'
  return {
    id: id('30000000', s.n),
    reference_number: `EVT-2025-${pad3(s.n)}`,
    project_id: PRJ(s.prj),
    created_by: U(s.by),
    creator_org_id: creator.organization_id!,
    approval_level: s.lvl,
    type: s.type,
    was_fire: s.fire ?? false,
    was_injury: s.inj ?? false,
    was_environment_impacted: s.env ?? false,
    was_security: s.sec ?? false,
    impact_other: null,
    classification: s.cls,
    site: s.site,
    contractor: s.con ? orgById(ORG(s.con)).name : null,
    specific_area: s.area,
    latitude: s.lat ?? null,
    longitude: s.lng ?? null,
    event_date: s.date,
    reported_date: reported,
    work_related: true,
    impacted_party: s.party ?? null,
    leadership_member_id: s.lead ? U(s.lead) : null,
    attendee_ids: s.att ? s.att.map(U) : [],
    notify_attendees_by_email: !!s.att,
    event_description: s.desc,
    conditions: s.cond,
    significant_hazard: s.hz ?? null,
    repeat_incident: s.repeat ?? false,
    immediate_corrective_actions: s.imm ?? null,
    stop_work: s.stop ?? false,
    stop_work_details: s.stopDet ?? null,
    further_action_required: s.further ?? false,
    photo_urls: [],
    contractor_reviewer_id: s.cr ? U(s.cr) : null,
    reviewer_id: s.rv ? U(s.rv) : null,
    contractor_investigator_id: s.ci ? U(s.ci) : null,
    lead_investigator_id: s.li ? U(s.li) : null,
    validator_id: s.vl ? U(s.vl) : null,
    approver_id: s.ap ? U(s.ap) : null,
    closeout_photo_urls: [],
    date_closure: s.lvl === 'closed' ? addHours(s.date, 120) : null,
    client_closeout_approved_at: null,
    client_closeout_approved_by: null,
    reporting_deadline_24h: addHours(s.date, 24),
    reporting_deadline_3day: addHours(s.date, 72),
    deadline_24h_met: beyond,
    deadline_3day_met: beyond,
    deadline_24h_met_at: beyond ? reported : null,
    deadline_3day_met_at: beyond ? reported : null,
    created_at: reported,
    updated_at: reported,
    project: projectById(PRJ(s.prj)),
    creator,
    creator_organization: orgById(creator.organization_id!),
  }
}

const EVENT_SEEDS: EventSeed[] = [
  { n: 1, prj: 1, by: 6, lvl: 'closed', type: 'incident', cls: 'safety', site: 'North Quay – Berth 4', area: 'Quay wall formwork deck', con: 2, date: '2025-02-10T08:30:00Z', desc: 'Operative sustained a laceration to the forearm while stripping formwork panels.', cond: 'Clear, mild morning, dry deck', hz: 'work_at_height', inj: true, party: 'contractor', imm: 'First aid administered on site; operative referred to clinic for stitches.', further: true, lat: 25.271, lng: 55.307, cr: 6, rv: 2, ci: 6, li: 1, vl: 5, ap: 1 },
  { n: 2, prj: 2, by: 8, lvl: 'review', type: 'near_miss', cls: 'unsafe_condition', site: 'Warehouse – Grid B', area: 'Loading bay 3', con: 3, date: '2025-05-12T14:00:00Z', desc: 'Unsecured palletised load shifted on forklift tines during transfer; no contact made.', cond: 'Indoor, afternoon shift', hz: 'lifting', party: 'contractor', stop: true, stopDet: 'Forklift operations paused pending equipment inspection.', imm: 'Area cordoned; forklift withdrawn for inspection.', further: true, cr: 8, rv: 2 },
  { n: 3, prj: 1, by: 6, lvl: 'investigation', type: 'incident', cls: 'environment', site: 'North Quay – Coastal edge', area: 'Drainage channel near pier', con: 2, date: '2025-05-15T10:00:00Z', desc: 'Hydraulic oil sheen observed on water surface adjacent to excavation works.', cond: 'Post-rain, muddy terrain', hz: 'breaking_ground_excavations', env: true, party: 'client', imm: 'Spill kit deployed; absorbent booms placed around the sheen.', further: true, lat: 25.275, lng: 55.302, cr: 6, rv: 2, ci: 6, li: 1 },
  { n: 4, prj: 3, by: 9, lvl: 'closed', type: 'incident', cls: 'safety', site: 'South Marine Zone', area: 'Dock extension pile cap', con: 4, date: '2025-03-18T09:15:00Z', desc: 'Dropped scaffold clamp fell from height into exclusion zone; no personnel beneath.', cond: 'Breezy, good visibility', hz: 'work_at_height', party: 'contractor', imm: 'Tool tethering reinforced; exclusion zone re-marked.', further: true, lat: 25.262, lng: 55.298, cr: 9, rv: 2, ci: 9, li: 1, vl: 5, ap: 2 },
  { n: 5, prj: 5, by: 12, lvl: 'contractor_review', type: 'near_miss', cls: 'unsafe_act', site: 'East Breakwater', area: 'Rock armour placement zone', con: 7, date: '2025-06-02T11:30:00Z', desc: 'Banksman stepped within the slew radius of an excavator placing armour rock.', cond: 'Hot, high glare', hz: 'mobile_plant_equipment', party: 'contractor', imm: 'Work paused; toolbox talk on exclusion zones delivered.', further: true, cr: 12 },
  { n: 6, prj: 6, by: 10, lvl: 'approval', type: 'incident', cls: 'fire', site: 'Admin Precinct', area: 'Second floor riser', con: 5, date: '2025-04-28T13:45:00Z', desc: 'Smouldering insulation ignited briefly during cable termination works.', cond: 'Indoor, dust present', hz: 'hot_works', fire: true, party: 'contractor', imm: 'Extinguisher discharged; hot works permit suspended.', further: true, cr: 10, rv: 2, ci: 10, li: 1, vl: 5, ap: 1 },
  { n: 7, prj: 4, by: 8, lvl: 'closed', type: 'hazard_identification', cls: 'unsafe_condition', site: 'Central Yard', area: 'Yard gate access road', con: 3, date: '2025-03-25T07:50:00Z', desc: 'Poorly lit pedestrian crossing near the active haul route identified.', cond: 'Pre-dawn, low light', hz: 'working_near_live_roads', party: 'client', imm: 'Temporary lighting and signage installed at crossing.', further: true, cr: 8, rv: 2, ci: 8, li: 2, vl: 5, ap: 1 },
  { n: 8, prj: 1, by: 11, lvl: 'validation', type: 'incident', cls: 'safety', site: 'North Quay – Berth 5', area: 'Scaffold tower stair', con: 6, date: '2025-05-20T15:10:00Z', desc: 'Operative slipped on scaffold stair tread, sustaining a bruised knee.', cond: 'Damp, intermittent rain', hz: 'work_at_height', inj: true, party: 'contractor', imm: 'Anti-slip treads fitted; first aid given.', further: true, cr: 11, rv: 2, ci: 11, li: 1, vl: 5 },
  { n: 9, prj: 3, by: 12, lvl: 'contractor_investigation', type: 'incident', cls: 'environment', site: 'South Marine Zone', area: 'Dredge spoil barge', con: 7, date: '2025-05-22T08:40:00Z', desc: 'Minor overflow of dredge spoil during barge loading observed near the waterline.', cond: 'Calm sea, clear', hz: 'working_near_water', env: true, party: 'client', imm: 'Loading paused; silt curtain repositioned.', further: true, lat: 25.259, lng: 55.295, cr: 12, ci: 12 },
  { n: 10, prj: 2, by: 11, lvl: 'closed', type: 'positive_observation', cls: 'positive_observation', site: 'Warehouse – Grid C', area: 'Mezzanine edge', con: 6, date: '2025-04-05T10:20:00Z', desc: 'Exemplary edge protection and housekeeping observed across the mezzanine works.', cond: 'Indoor, well lit', party: null, further: false, ap: 1 },
  { n: 11, prj: 5, by: 6, lvl: 'review', type: 'incident', cls: 'safety', site: 'East Breakwater', area: 'Crawler crane pad', con: 2, date: '2025-05-25T12:00:00Z', desc: 'Outrigger pad subsided slightly during a tandem lift; lift halted safely.', cond: 'Hot, firm ground', hz: 'lifting', party: 'contractor', stop: true, stopDet: 'Lifting suspended pending ground bearing reassessment.', imm: 'Crane levelled; ground checked by temporary works coordinator.', further: true, cr: 6, rv: 5 },
  { n: 12, prj: 1, by: 7, lvl: 'investigation', type: 'incident', cls: 'welfare', site: 'North Quay – Berth 6', area: 'Rebar fixing zone', con: 2, date: '2025-05-28T11:15:00Z', desc: 'Operative reported heat exhaustion symptoms during afternoon rebar fixing.', cond: 'Very hot, limited shade', hz: 'working_in_heat', inj: true, party: 'contractor', imm: 'Operative moved to cool area, rehydrated and monitored.', further: true, cr: 7, rv: 5, ci: 7, li: 5 },
  { n: 13, prj: 6, by: 15, lvl: 'closed', type: 'near_miss', cls: 'unsafe_condition', site: 'Admin Precinct', area: 'Ground floor stairwell', con: 3, date: '2025-04-02T09:30:00Z', desc: 'Trailing power lead across stairwell created a trip hazard; no fall occurred.', cond: 'Indoor', hz: 'energised_systems', party: 'contractor', imm: 'Cable rerouted and covered with matting.', further: false, cr: 15, rv: 2, ci: 15, li: 2, vl: 5, ap: 1 },
  { n: 14, prj: 4, by: 8, lvl: 'contractor_review', type: 'incident', cls: 'safety', site: 'Central Yard', area: 'Planer working strip', con: 3, date: '2025-06-03T13:20:00Z', desc: 'Reversing road planer made contact with a traffic cone line; no injuries.', cond: 'Hot, dusty', hz: 'mobile_plant_equipment', party: 'contractor', imm: 'Reversing assistant assigned; segregation barriers added.', further: true, cr: 8 },
  { n: 15, prj: 3, by: 9, lvl: 'approval', type: 'incident', cls: 'safety', site: 'South Marine Zone', area: 'Confined chamber inlet', con: 4, date: '2025-05-30T08:00:00Z', desc: 'Gas monitor alarmed on entry to a pipeline inspection chamber; team withdrew.', cond: 'Humid, enclosed', hz: 'confined_spaces', party: 'contractor', stop: true, stopDet: 'Confined space entry stopped until forced ventilation applied.', imm: 'Chamber ventilated and re-tested before re-entry.', further: true, cr: 9, rv: 2, ci: 9, li: 1, vl: 5, ap: 1 },
  { n: 16, prj: 1, by: 6, lvl: 'closed', type: 'leadership_event', cls: 'leadership_site_visit', site: 'North Quay – Berth 4', area: 'Main site entrance', con: null, date: '2025-03-14T07:00:00Z', desc: 'Executive safety leadership walk covering quay wall progress and PPE compliance.', cond: 'Clear morning', party: null, further: false, lead: 1, att: [2, 3, 6] },
  { n: 17, prj: 2, by: 8, lvl: 'review', type: 'hazard_identification', cls: 'fire', site: 'Warehouse – Grid A', area: 'Flammable store', con: 3, date: '2025-06-01T09:00:00Z', desc: 'Flammable goods stored adjacent to a heat source without segregation identified.', cond: 'Indoor', hz: 'fire', party: 'client', imm: 'Materials relocated to the designated flammable store.', further: true, cr: 8, rv: 5 },
  { n: 18, prj: 5, by: 12, lvl: 'contractor_investigation', type: 'incident', cls: 'safety', site: 'East Breakwater', area: 'Survey vessel mooring', con: 7, date: '2025-06-04T10:45:00Z', desc: 'Crew member nearly fell between vessel and quay during transfer in swell.', cond: 'Moderate swell, windy', hz: 'working_near_water', party: 'contractor', imm: 'Transfer halted; gangway and PFD use reinforced.', further: true, lat: 25.258, lng: 55.296, cr: 12, ci: 12 },
  { n: 19, prj: 6, by: 10, lvl: 'closed', type: 'near_miss', cls: 'unsafe_act', site: 'Admin Precinct', area: 'Switchroom', con: 5, date: '2025-04-15T14:30:00Z', desc: 'Operative attempted work on a panel without confirming isolation; stopped by supervisor.', cond: 'Indoor', hz: 'energised_systems', party: 'contractor', imm: 'Lock-out/tag-out re-briefed; isolation verified.', further: true, cr: 10, rv: 2, ci: 10, li: 1, vl: 5, ap: 2 },
  { n: 20, prj: 1, by: 6, lvl: 'validation', type: 'incident', cls: 'environment', site: 'North Quay – Berth 6', area: 'Concrete washout area', con: 2, date: '2025-06-05T11:00:00Z', desc: 'Concrete washout overflowed beyond the bunded area onto hardstanding.', cond: 'Warm, dry', hz: 'breaking_ground_excavations', env: true, party: 'client', imm: 'Spill contained and pumped back; bund capacity increased.', further: true, cr: 6, rv: 2, ci: 6, li: 1, vl: 5 },
  { n: 21, prj: 4, by: 15, lvl: 'investigation', type: 'incident', cls: 'safety', site: 'Central Yard', area: 'Drainage trench', con: 3, date: '2025-06-06T08:30:00Z', desc: 'Trench side partially collapsed adjacent to where an operative had been working.', cond: 'Dry, friable ground', hz: 'breaking_ground_excavations', party: 'contractor', stop: true, stopDet: 'Excavation works stopped pending shoring redesign.', imm: 'Personnel withdrawn; trench barricaded.', further: true, cr: 15, rv: 2, ci: 15, li: 1 },
  { n: 22, prj: 3, by: 9, lvl: 'closed', type: 'positive_observation', cls: 'positive_observation', site: 'South Marine Zone', area: 'Dive support station', con: 4, date: '2025-04-18T09:00:00Z', desc: 'Well-run dive briefing and emergency drill demonstrated strong competency.', cond: 'Calm, clear', party: null, further: false, ap: 1 },
  { n: 23, prj: 5, by: 7, lvl: 'contractor_review', type: 'near_miss', cls: 'unsafe_condition', site: 'East Breakwater', area: 'Temporary haul road', con: 2, date: '2025-06-07T12:30:00Z', desc: 'Tipper truck wheel ran close to an unprotected edge of the haul road.', cond: 'Hot, dusty', hz: 'driving', party: 'contractor', imm: 'Edge protection berm extended; speed limit reduced.', further: true, cr: 7 },
  { n: 24, prj: 2, by: 11, lvl: 'review', type: 'incident', cls: 'safety', site: 'Warehouse – Grid B', area: 'Mobile scaffold', con: 6, date: '2025-06-08T10:00:00Z', desc: 'Mobile scaffold tipped slightly when moved with an operative aboard.', cond: 'Indoor', hz: 'work_at_height', party: 'contractor', imm: 'Operative descended safely; movement procedure re-briefed.', further: true, cr: 11, rv: 5 },
  { n: 25, prj: 1, by: 6, lvl: 'closed', type: 'incident', cls: 'safety', site: 'North Quay – Berth 5', area: 'Steel erection bay', con: 8, date: '2025-04-22T11:40:00Z', desc: 'Steel beam swung unexpectedly during landing, striking temporary handrail.', cond: 'Breezy', hz: 'lifting', party: 'contractor', imm: 'Taglines reinforced; landing zone re-planned.', further: true, repeat: true, cr: 6, rv: 2, ci: 6, li: 1, vl: 5, ap: 1 },
  { n: 26, prj: 6, by: 10, lvl: 'approval', type: 'incident', cls: 'welfare', site: 'Admin Precinct', area: 'Roof plant deck', con: 5, date: '2025-06-09T13:00:00Z', desc: 'Operative felt dizzy working on the exposed roof deck during peak heat.', cond: 'Extreme heat', hz: 'working_in_heat', inj: true, party: 'contractor', imm: 'Work rescheduled to cooler hours; shaded rest area provided.', further: true, cr: 10, rv: 5, ci: 10, li: 5, vl: 2, ap: 1 },
  { n: 27, prj: 3, by: 9, lvl: 'investigation', type: 'incident', cls: 'safety', site: 'South Marine Zone', area: 'Pile driving rig', con: 4, date: '2025-06-10T09:20:00Z', desc: 'Pile follower detached partially during driving, creating a struck-by risk.', cond: 'Calm', hz: 'drilling_blasting', party: 'contractor', stop: true, stopDet: 'Piling stopped to inspect and re-secure the follower.', imm: 'Exclusion zone enforced; rig inspected.', further: true, cr: 9, rv: 2, ci: 9, li: 1 },
  { n: 28, prj: 4, by: 8, lvl: 'closed', type: 'hazard_identification', cls: 'non_conformance', site: 'Central Yard', area: 'Material laydown', con: 3, date: '2025-04-26T08:10:00Z', desc: 'Stacked precast units exceeded the safe stacking height specified.', cond: 'Dry', party: 'client', imm: 'Stacks reduced to compliant height and re-banded.', further: true, cr: 8, rv: 2, ci: 8, li: 2, vl: 5, ap: 1 },
  { n: 29, prj: 5, by: 12, lvl: 'contractor_review', type: 'incident', cls: 'environment', site: 'East Breakwater', area: 'Refuelling bay', con: 7, date: '2025-06-11T10:30:00Z', desc: 'Small diesel spill during plant refuelling reached the bund edge.', cond: 'Hot, dry', hz: 'working_near_water', env: true, party: 'client', imm: 'Spill absorbed; drip trays mandated for all refuelling.', further: true, cr: 12 },
  { n: 30, prj: 2, by: 8, lvl: 'review', type: 'near_miss', cls: 'unsafe_condition', site: 'Warehouse – Grid C', area: 'Rack installation', con: 3, date: '2025-06-12T11:00:00Z', desc: 'Partially installed racking leaned out of plumb before bracing was fitted.', cond: 'Indoor', hz: 'temporary_works', party: 'contractor', imm: 'Area cleared; racking propped and re-levelled.', further: true, cr: 8, rv: 5 },
  { n: 31, prj: 1, by: 6, lvl: 'closed', type: 'leadership_event', cls: 'safety_meeting', site: 'North Quay – Berth 4', area: 'Site induction room', con: null, date: '2025-05-02T07:30:00Z', desc: 'Executive-led monthly safety stand-down covering recent lessons learned.', cond: 'Indoor', party: null, further: false, lead: 2, att: [1, 3, 4] },
  { n: 32, prj: 6, by: 10, lvl: 'validation', type: 'incident', cls: 'safety', site: 'Admin Precinct', area: 'Lift shaft', con: 5, date: '2025-06-12T14:15:00Z', desc: 'Materials hoist gate interlock found bypassed during inspection.', cond: 'Indoor', hz: 'energised_systems', party: 'contractor', stop: true, stopDet: 'Hoist taken out of service until interlock restored.', imm: 'Bypass removed; interlock function verified.', further: true, cr: 10, rv: 2, ci: 10, li: 1, vl: 5 },
  { n: 33, prj: 3, by: 9, lvl: 'contractor_investigation', type: 'incident', cls: 'safety', site: 'South Marine Zone', area: 'Underwater works zone', con: 4, date: '2025-06-13T09:00:00Z', desc: 'Diver experienced a brief communications loss during an underwater inspection.', cond: 'Reduced visibility', hz: 'working_near_water', party: 'contractor', imm: 'Diver recalled per lost-comms procedure; equipment swapped.', further: true, lat: 25.26, lng: 55.297, cr: 9, ci: 9 },
  { n: 34, prj: 5, by: 6, lvl: 'closed', type: 'positive_observation', cls: 'positive_observation', site: 'East Breakwater', area: 'Plant marshalling area', con: 2, date: '2025-05-06T08:30:00Z', desc: 'Excellent segregation of plant and pedestrians observed across the marshalling area.', cond: 'Hot, clear', party: null, further: false, ap: 2 },
  { n: 35, prj: 4, by: 8, lvl: 'draft', type: 'incident', cls: 'safety', site: 'Central Yard', area: 'Kerb laying strip', con: 3, date: '2025-06-05T08:00:00Z', desc: 'Operative reported minor finger pinch while handling kerb units.', cond: 'Hot, dry', hz: 'lifting', inj: true, party: 'contractor', imm: 'First aid applied; mechanical lifting aid requested.', further: true },
  { n: 36, prj: 2, by: 3, lvl: 'draft', type: 'hazard_identification', cls: 'unsafe_condition', site: 'Warehouse – Grid A', area: 'Dock leveller', con: 6, date: '2025-06-08T09:00:00Z', desc: 'Dock leveller showing damaged lip plate identified during walkaround.', cond: 'Indoor', hz: 'mobile_plant_equipment', party: 'client', imm: 'Leveller taken out of use pending repair.', further: true },
  { n: 37, prj: 1, by: 4, lvl: 'draft', type: 'near_miss', cls: 'unsafe_act', site: 'North Quay – Berth 6', area: 'Edge of slab', con: 2, date: '2025-06-10T07:30:00Z', desc: 'Operative observed leaning over an unprotected slab edge to retrieve a tool.', cond: 'Cool morning', hz: 'work_at_height', party: 'contractor', imm: 'Edge protection reinstated; behaviour challenged on the spot.', further: true },
  { n: 38, prj: 5, by: 12, lvl: 'draft', type: 'incident', cls: 'environment', site: 'East Breakwater', area: 'Silt curtain line', con: 7, date: '2025-06-12T09:00:00Z', desc: 'Silt curtain detached at one anchor point allowing turbidity to escape.', cond: 'Choppy', hz: 'working_near_water', env: true, party: 'client', imm: 'Curtain re-anchored; turbidity monitoring increased.', further: true, lat: 25.257, lng: 55.294 },
  { n: 39, prj: 6, by: 5, lvl: 'draft', type: 'hazard_identification', cls: 'fire', site: 'Admin Precinct', area: 'Temporary site office', con: 3, date: '2025-06-14T06:00:00Z', desc: 'Obstructed fire escape route from the temporary site office identified.', cond: 'Indoor', hz: 'fire', party: 'client', imm: 'Route cleared; daily housekeeping check added.', further: true },
  { n: 40, prj: 3, by: 9, lvl: 'draft', type: 'near_miss', cls: 'unsafe_condition', site: 'South Marine Zone', area: 'Dock extension deck', con: 4, date: '2025-06-14T18:00:00Z', desc: 'Loose decking board lifted underfoot near the dock extension working area.', cond: 'Evening, lit', hz: 'work_at_height', party: 'contractor', imm: 'Board secured; full deck check scheduled.', further: true },
]

export const MOCK_EVENTS: Event[] = EVENT_SEEDS.map(makeEvent)

const eventRefById = (eid: string): string =>
  MOCK_EVENTS.find((e) => e.id === eid)?.reference_number ?? ''

// ============================================================
// Event Responses
// ============================================================

interface ResponseSeed {
  n: number
  ev: number
  by: number
  text: string
  date: string
  closing?: boolean
}

function makeResponse(s: ResponseSeed): EventResponse {
  const responder = profileById(U(s.by))
  return {
    id: id('70000000', s.n),
    event_id: id('30000000', s.ev),
    responded_by: U(s.by),
    responder_org_id: responder.organization_id!,
    response_text: s.text,
    photo_urls: [],
    is_closing: s.closing ?? false,
    created_at: s.date,
    responder,
    responder_organization: orgById(responder.organization_id!),
  }
}

const RESPONSE_SEEDS: ResponseSeed[] = [
  { n: 1, ev: 1, by: 6, text: 'Investigation completed. Formwork stripping method statement revised and team re-briefed on cut-resistant gloves.', date: '2025-02-12T10:00:00Z' },
  { n: 2, ev: 1, by: 1, text: 'Reviewed and validated corrective actions. Event closed with lessons shared at the weekly safety meeting.', date: '2025-02-15T09:00:00Z', closing: true },
  { n: 3, ev: 2, by: 8, text: 'Forklift inspected and returned to service. Load securement procedure updated and operators re-trained.', date: '2025-05-13T09:00:00Z' },
  { n: 4, ev: 2, by: 2, text: 'Acknowledged contractor response. Awaiting completion of the operator retraining records before closing.', date: '2025-05-13T16:00:00Z' },
  { n: 5, ev: 3, by: 6, text: 'Additional silt fencing installed and environmental monitoring plan activated for the drainage channel.', date: '2025-05-15T16:00:00Z' },
  { n: 6, ev: 4, by: 9, text: 'Tool tethering audit completed across all elevated work areas; no further deficiencies found.', date: '2025-03-20T11:00:00Z' },
  { n: 7, ev: 4, by: 2, text: 'Corrective actions verified on site. Event closed.', date: '2025-03-23T10:00:00Z', closing: true },
  { n: 8, ev: 6, by: 10, text: 'Hot works permit conditions tightened; fire watch duration extended to 60 minutes post-works.', date: '2025-04-29T09:30:00Z' },
  { n: 9, ev: 7, by: 8, text: 'Permanent lighting installed at the pedestrian crossing and signage upgraded.', date: '2025-03-27T14:00:00Z' },
  { n: 10, ev: 7, by: 1, text: 'Verified on a follow-up night walk. Crossing now well lit. Event closed.', date: '2025-03-30T20:00:00Z', closing: true },
  { n: 11, ev: 8, by: 11, text: 'Anti-slip treads fitted to all scaffold stairs on the project; weekly inspection added.', date: '2025-05-21T10:00:00Z' },
  { n: 12, ev: 11, by: 6, text: 'Ground bearing reassessed and crane mats upsized. Lift plan reissued for approval.', date: '2025-05-26T09:00:00Z' },
  { n: 13, ev: 15, by: 9, text: 'Forced ventilation and continuous gas monitoring now mandatory for all chamber entries.', date: '2025-05-30T13:00:00Z' },
  { n: 14, ev: 21, by: 15, text: 'Shoring design reviewed by temporary works coordinator; trench boxes deployed before re-entry.', date: '2025-06-06T15:00:00Z' },
  { n: 15, ev: 27, by: 9, text: 'Pile follower connection inspected and modified; pre-use checks added to the piling permit.', date: '2025-06-10T16:00:00Z' },
]

export const MOCK_EVENT_RESPONSES: EventResponse[] = RESPONSE_SEEDS.map(makeResponse)

// ============================================================
// Inspection Templates
// ============================================================

const TEMPLATE1_ID = id('50000000', 1)

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
    creator: MOCK_CURRENT_USER,
  },
  ...buildCrcTemplates({
    organizationId: CLIENT_ORG_ID,
    createdBy: MOCK_USER_ID,
    creator: MOCK_CURRENT_USER,
  }),
]

// ============================================================
// Inspections
// ============================================================

interface InspSeed {
  n: number
  tpl: string
  tplName: string
  prj: number
  by: number
  st: InspectionStatus
  score: number | null
  total: number
  scorable: number
  compliant: number
  notes: string | null
  created: string
  completed: string | null
}

function makeInspection(s: InspSeed): Inspection {
  const conductor = profileById(U(s.by))
  return {
    id: id('60000000', s.n),
    reference_number: `INS-2025-${pad3(s.n)}`,
    template_id: s.tpl,
    project_id: PRJ(s.prj),
    organization_id: CLIENT_ORG_ID,
    conducted_by: U(s.by),
    status: s.st,
    score: s.st === 'draft' ? null : s.score,
    total_items: s.total,
    scorable_items: s.scorable,
    compliant_items: s.compliant,
    notes: s.notes,
    completed_at: s.st === 'completed' ? s.completed : null,
    created_at: s.created,
    updated_at: s.st === 'completed' ? s.completed ?? s.created : s.created,
    template:
      MOCK_INSPECTION_TEMPLATES.find((t) => t.id === s.tpl) ??
      ({ id: s.tpl, name: s.tplName } as InspectionTemplate),
    project: projectById(PRJ(s.prj)),
    conductor,
  }
}

const INSPECTION_SEEDS: InspSeed[] = [
  { n: 1, tpl: TEMPLATE1_ID, tplName: 'General Site Safety Inspection', prj: 1, by: 1, st: 'completed', score: 83.3, total: 11, scorable: 6, compliant: 4, notes: 'Generally good compliance. Minor issue with fire extinguisher signage.', created: '2025-05-05T10:00:00Z', completed: '2025-05-05T14:00:00Z' },
  { n: 2, tpl: TEMPLATE1_ID, tplName: 'General Site Safety Inspection', prj: 2, by: 5, st: 'completed', score: 100, total: 11, scorable: 6, compliant: 6, notes: 'Excellent compliance across all areas.', created: '2025-05-10T13:00:00Z', completed: '2025-05-10T16:00:00Z' },
  { n: 3, tpl: TEMPLATE1_ID, tplName: 'General Site Safety Inspection', prj: 1, by: 2, st: 'completed', score: 66.7, total: 11, scorable: 6, compliant: 3, notes: 'Several housekeeping non-conformances noted for follow-up.', created: '2025-05-18T12:00:00Z', completed: '2025-05-18T15:00:00Z' },
  { n: 4, tpl: '51000000-0000-4000-8000-000000000002', tplName: 'Work at Height', prj: 1, by: 3, st: 'completed', score: 90.9, total: 11, scorable: 11, compliant: 10, notes: 'Edge protection in good order; one harness inspection record missing.', created: '2025-03-12T09:00:00Z', completed: '2025-03-12T11:00:00Z' },
  { n: 5, tpl: '51000000-0000-4000-8000-000000000004', tplName: 'Lifting', prj: 5, by: 6, st: 'completed', score: 86.7, total: 15, scorable: 15, compliant: 13, notes: 'Lift plans current; two slings due for recertification.', created: '2025-03-20T08:00:00Z', completed: '2025-03-20T10:00:00Z' },
  { n: 6, tpl: '51000000-0000-4000-8000-000000000008', tplName: 'Breaking Ground & Excavations', prj: 4, by: 8, st: 'completed', score: 75.0, total: 12, scorable: 12, compliant: 9, notes: 'Permit in place; shoring inspection frequency to be increased.', created: '2025-03-28T07:30:00Z', completed: '2025-03-28T09:00:00Z' },
  { n: 7, tpl: '51000000-0000-4000-8000-000000000015', tplName: 'Mobile Plant & Equipment', prj: 4, by: 8, st: 'completed', score: 93.3, total: 15, scorable: 15, compliant: 14, notes: 'Strong segregation; minor reversing-aid defect logged.', created: '2025-04-02T11:00:00Z', completed: '2025-04-02T13:00:00Z' },
  { n: 8, tpl: '51000000-0000-4000-8000-000000000001', tplName: 'Working on or Near Water', prj: 3, by: 9, st: 'completed', score: 88.9, total: 18, scorable: 18, compliant: 16, notes: 'PFDs and rescue equipment in good order.', created: '2025-04-08T08:00:00Z', completed: '2025-04-08T10:00:00Z' },
  { n: 9, tpl: '51000000-0000-4000-8000-000000000012', tplName: 'Confined Spaces', prj: 3, by: 9, st: 'completed', score: 87.5, total: 8, scorable: 8, compliant: 7, notes: 'Entry controls robust; refresh rescue drill due.', created: '2025-04-12T09:30:00Z', completed: '2025-04-12T11:00:00Z' },
  { n: 10, tpl: '51000000-0000-4000-8000-000000000006', tplName: 'Energised Systems', prj: 6, by: 10, st: 'completed', score: 100, total: 11, scorable: 11, compliant: 11, notes: 'Full compliance; lock-out/tag-out exemplary.', created: '2025-04-16T12:00:00Z', completed: '2025-04-16T14:00:00Z' },
  { n: 11, tpl: '51000000-0000-4000-8000-000000000005', tplName: 'Hot Works', prj: 6, by: 10, st: 'completed', score: 88.9, total: 9, scorable: 9, compliant: 8, notes: 'Permit and fire watch in place; one extinguisher overdue service.', created: '2025-04-20T08:00:00Z', completed: '2025-04-20T09:30:00Z' },
  { n: 12, tpl: '51000000-0000-4000-8000-000000000014', tplName: 'Driving', prj: 5, by: 7, st: 'completed', score: 83.3, total: 12, scorable: 12, compliant: 10, notes: 'Journey management good; two licences pending verification.', created: '2025-04-24T07:00:00Z', completed: '2025-04-24T08:00:00Z' },
  { n: 13, tpl: '51000000-0000-4000-8000-000000000013', tplName: 'Working on or Near Live Roads', prj: 4, by: 8, st: 'completed', score: 81.8, total: 11, scorable: 11, compliant: 9, notes: 'Traffic management plan followed; signage partly faded.', created: '2025-04-29T06:30:00Z', completed: '2025-04-29T07:30:00Z' },
  { n: 14, tpl: '51000000-0000-4000-8000-000000000011', tplName: 'Temporary Works', prj: 2, by: 6, st: 'completed', score: 90.9, total: 11, scorable: 11, compliant: 10, notes: 'Design and inspection register up to date.', created: '2025-05-02T08:30:00Z', completed: '2025-05-02T10:00:00Z' },
  { n: 15, tpl: '51000000-0000-4000-8000-000000000009', tplName: 'Piling', prj: 3, by: 9, st: 'completed', score: 72.7, total: 11, scorable: 11, compliant: 8, notes: 'Exclusion zones to be better enforced during driving.', created: '2025-05-06T07:30:00Z', completed: '2025-05-06T09:00:00Z' },
  { n: 16, tpl: '51000000-0000-4000-8000-000000000003', tplName: 'Working in the Heat', prj: 1, by: 2, st: 'completed', score: 81.8, total: 11, scorable: 11, compliant: 9, notes: 'Shade and water provision good; mid-day rest schedule to be reinforced.', created: '2025-05-12T10:00:00Z', completed: '2025-05-12T12:00:00Z' },
  { n: 17, tpl: '51000000-0000-4000-8000-000000000007', tplName: 'Drilling and Blasting', prj: 3, by: 9, st: 'completed', score: 90.0, total: 10, scorable: 10, compliant: 9, notes: 'Blast controls and exclusion arrangements compliant.', created: '2025-05-16T08:30:00Z', completed: '2025-05-16T10:00:00Z' },
  { n: 18, tpl: '51000000-0000-4000-8000-000000000010', tplName: 'Diving & Underwater Activities', prj: 3, by: 9, st: 'completed', score: 80.0, total: 10, scorable: 10, compliant: 8, notes: 'Dive plan thorough; comms backup to be added.', created: '2025-06-02T07:30:00Z', completed: '2025-06-02T09:00:00Z' },
  { n: 19, tpl: '51000000-0000-4000-8000-000000000002', tplName: 'Work at Height', prj: 1, by: 3, st: 'completed', score: 100, total: 11, scorable: 11, compliant: 11, notes: 'Full compliance on follow-up inspection.', created: '2025-06-03T09:30:00Z', completed: '2025-06-03T11:00:00Z' },
  { n: 20, tpl: '51000000-0000-4000-8000-000000000004', tplName: 'Lifting', prj: 5, by: 6, st: 'completed', score: 80.0, total: 15, scorable: 15, compliant: 12, notes: 'Ground bearing checks added following recent near miss.', created: '2025-06-05T08:30:00Z', completed: '2025-06-05T10:00:00Z' },
  { n: 21, tpl: '51000000-0000-4000-8000-000000000015', tplName: 'Mobile Plant & Equipment', prj: 4, by: 8, st: 'completed', score: 86.7, total: 15, scorable: 15, compliant: 13, notes: 'Segregation maintained; one beacon defective.', created: '2025-06-06T11:30:00Z', completed: '2025-06-06T13:00:00Z' },
  { n: 22, tpl: '51000000-0000-4000-8000-000000000001', tplName: 'Working on or Near Water', prj: 5, by: 12, st: 'completed', score: 83.3, total: 18, scorable: 18, compliant: 15, notes: 'Rescue boat available; two throw lines need replacing.', created: '2025-06-08T08:30:00Z', completed: '2025-06-08T10:00:00Z' },
  { n: 23, tpl: '51000000-0000-4000-8000-000000000008', tplName: 'Breaking Ground & Excavations', prj: 4, by: 15, st: 'completed', score: 83.3, total: 12, scorable: 12, compliant: 10, notes: 'Trench boxes in use; permit board to be updated daily.', created: '2025-06-09T07:30:00Z', completed: '2025-06-09T09:00:00Z' },
  { n: 24, tpl: '51000000-0000-4000-8000-000000000006', tplName: 'Energised Systems', prj: 6, by: 10, st: 'completed', score: 90.9, total: 11, scorable: 11, compliant: 10, notes: 'Isolation procedures followed; one label missing.', created: '2025-06-10T12:30:00Z', completed: '2025-06-10T14:00:00Z' },
  { n: 25, tpl: '51000000-0000-4000-8000-000000000012', tplName: 'Confined Spaces', prj: 3, by: 9, st: 'completed', score: 75.0, total: 8, scorable: 8, compliant: 6, notes: 'Ventilation adequate; standby person training to refresh.', created: '2025-06-11T09:30:00Z', completed: '2025-06-11T11:00:00Z' },
  { n: 26, tpl: '51000000-0000-4000-8000-000000000011', tplName: 'Temporary Works', prj: 2, by: 5, st: 'completed', score: 81.8, total: 11, scorable: 11, compliant: 9, notes: 'Racking bracing rectified following near miss.', created: '2025-06-12T08:30:00Z', completed: '2025-06-12T10:00:00Z' },
  { n: 27, tpl: '51000000-0000-4000-8000-000000000002', tplName: 'Work at Height', prj: 1, by: 3, st: 'draft', score: null, total: 11, scorable: 11, compliant: 0, notes: null, created: '2025-06-13T08:00:00Z', completed: null },
  { n: 28, tpl: '51000000-0000-4000-8000-000000000014', tplName: 'Driving', prj: 5, by: 7, st: 'draft', score: null, total: 12, scorable: 12, compliant: 0, notes: null, created: '2025-06-13T09:00:00Z', completed: null },
  { n: 29, tpl: '51000000-0000-4000-8000-000000000015', tplName: 'Mobile Plant & Equipment', prj: 4, by: 8, st: 'draft', score: null, total: 15, scorable: 15, compliant: 0, notes: null, created: '2025-06-14T08:00:00Z', completed: null },
  { n: 30, tpl: '51000000-0000-4000-8000-000000000001', tplName: 'Working on or Near Water', prj: 3, by: 9, st: 'draft', score: null, total: 18, scorable: 18, compliant: 0, notes: null, created: '2025-06-14T10:00:00Z', completed: null },
]

export const MOCK_INSPECTIONS: Inspection[] = INSPECTION_SEEDS.map(makeInspection)

const inspectionRefById = (iid: string): string =>
  MOCK_INSPECTIONS.find((i) => i.id === iid)?.reference_number ?? ''

// ============================================================
// Inspection Responses
// ============================================================

// Completed inspections must be fully answered (mirrors the form's
// completion rule): every item of the template gets a response. Compliance
// items are distributed to match each seed's score and compliant counts;
// other field types receive a sensible default answer. Drafts are left
// unanswered so they remain genuinely incomplete.
function buildInspectionResponses(): InspectionResponse[] {
  const out: InspectionResponse[] = []
  let counter = 0

  for (const s of INSPECTION_SEEDS) {
    if (s.st !== 'completed') continue
    const template = MOCK_INSPECTION_TEMPLATES.find((t) => t.id === s.tpl)
    if (!template) continue

    const inspectionId = id('60000000', s.n)
    const createdAt = s.completed ?? s.created

    // Build the compliance value sequence so the rendered responses are
    // consistent with the stored score / compliant counts.
    const complianceCount = template.sections
      .flatMap((sec) => sec.items)
      .filter((it) => it.field_type === 'compliance').length
    const fully = Math.min(s.compliant, complianceCount)
    const neededPoints = Math.round(((s.score ?? 0) / 100) * complianceCount)
    let partial = Math.max(0, Math.round((neededPoints - fully) * 2))
    partial = Math.min(partial, complianceCount - fully)
    const nonCompliant = complianceCount - fully - partial
    const complianceValues: string[] = [
      ...Array<string>(fully).fill('fully_compliant'),
      ...Array<string>(partial).fill('partially_compliant'),
      ...Array<string>(nonCompliant).fill('non_compliant'),
    ]
    let complianceIndex = 0

    for (const section of template.sections) {
      for (const item of section.items) {
        counter += 1
        let value: string | null
        switch (item.field_type) {
          case 'compliance':
            value = complianceValues[complianceIndex] ?? 'fully_compliant'
            complianceIndex += 1
            break
          case 'yes_no':
            value = 'yes'
            break
          case 'pass_fail':
            value = 'pass'
            break
          case 'numeric':
            value = '5'
            break
          case 'dropdown':
            value = item.options?.[0] ?? 'N/A'
            break
          case 'text':
            value = 'Checked and satisfactory.'
            break
          default:
            // photo (and any non-answerable types) stay empty/optional
            value = null
        }
        out.push({
          id: id('80000000', counter),
          inspection_id: inspectionId,
          section_id: section.id,
          item_id: item.id,
          field_type: item.field_type,
          value,
          photo_urls: [],
          created_at: createdAt,
        })
      }
    }
  }

  return out
}

export const MOCK_INSPECTION_RESPONSES: InspectionResponse[] =
  buildInspectionResponses()

// ============================================================
// Corrective Actions
// ============================================================

interface CaSeed {
  n: number
  ev?: number
  insp?: number
  itemLabel?: string
  prj: number
  by: number
  to?: number
  ap?: number
  title: string
  desc: string
  pr: CorrectiveActionPriority
  st: CorrectiveActionStatus
  due: string
  created: string
  updated?: string
  completed?: string
  approved?: string
  rej?: string
}

function makeCa(s: CaSeed): CorrectiveAction {
  const creator = profileById(U(s.by))
  const approverId = s.ap ?? 1
  return {
    id: id('40000000', s.n),
    reference_number: `CA-2025-${pad3(s.n)}`,
    event_id: s.ev ? id('30000000', s.ev) : null,
    inspection_id: s.insp ? id('60000000', s.insp) : null,
    section_id: null,
    item_id: null,
    item_label: s.itemLabel ?? null,
    project_id: PRJ(s.prj),
    created_by: U(s.by),
    creator_org_id: creator.organization_id!,
    assigned_to: s.to ? U(s.to) : null,
    approver_id: U(approverId),
    title: s.title,
    description: s.desc,
    priority: s.pr,
    status: s.st,
    due_date: s.due,
    photo_urls: [],
    completed_at: s.completed ?? null,
    approved_at: s.approved ?? null,
    rejection_reason: s.rej ?? null,
    created_at: s.created,
    updated_at: s.updated ?? s.created,
    event: s.ev ? ({ id: id('30000000', s.ev), reference_number: eventRefById(id('30000000', s.ev)) } as Event) : undefined,
    inspection: s.insp ? { id: id('60000000', s.insp), reference_number: inspectionRefById(id('60000000', s.insp)) } : undefined,
    project: projectById(PRJ(s.prj)),
    creator,
    assignee: s.to ? profileById(U(s.to)) : undefined,
    approver: profileById(U(approverId)),
  }
}

const CA_SEEDS: CaSeed[] = [
  { n: 1, ev: 1, prj: 1, by: 6, to: 6, ap: 1, title: 'Revise formwork stripping method statement', desc: 'Update the SWMS and reissue cut-resistant glove requirements following the forearm laceration.', pr: 'high', st: 'approved', due: '2025-02-25T00:00:00Z', created: '2025-02-11T10:00:00Z', completed: '2025-02-20T15:00:00Z', approved: '2025-02-22T09:00:00Z' },
  { n: 2, ev: 2, prj: 2, by: 2, to: 8, ap: 2, title: 'Forklift operator load-securement retraining', desc: 'Mandatory retraining for all forklift operators on load securement protocols.', pr: 'medium', st: 'in_progress', due: '2025-05-30T00:00:00Z', created: '2025-05-13T16:00:00Z', updated: '2025-05-20T09:00:00Z' },
  { n: 3, ev: 3, prj: 1, by: 1, to: 6, ap: 1, title: 'Install permanent erosion and spill control', desc: 'Design and install permanent erosion/spill control measures around the coastal excavation.', pr: 'critical', st: 'pending_approval', due: '2025-05-25T00:00:00Z', created: '2025-05-15T12:00:00Z', completed: '2025-06-10T14:00:00Z', updated: '2025-06-10T14:00:00Z' },
  { n: 4, ev: 4, prj: 3, by: 2, to: 9, ap: 2, title: 'Site-wide tool tethering audit', desc: 'Audit and enforce tool tethering across all work-at-height activities.', pr: 'high', st: 'approved', due: '2025-03-22T00:00:00Z', created: '2025-03-19T11:00:00Z', completed: '2025-03-21T16:00:00Z', approved: '2025-03-23T10:00:00Z' },
  { n: 5, ev: 5, prj: 5, by: 5, to: 12, ap: 5, title: 'Re-mark excavator exclusion zones', desc: 'Re-establish and clearly mark slew exclusion zones for armour rock placement.', pr: 'high', st: 'open', due: '2025-06-20T00:00:00Z', created: '2025-06-02T13:00:00Z' },
  { n: 6, ev: 6, prj: 6, by: 1, to: 10, ap: 1, title: 'Extend hot works fire watch period', desc: 'Increase the post-works fire watch duration following the riser ignition.', pr: 'medium', st: 'rejected', due: '2025-05-10T00:00:00Z', created: '2025-04-29T14:00:00Z', completed: '2025-05-08T10:00:00Z', updated: '2025-05-09T09:00:00Z', rej: 'Proposed watch period insufficient; align with the 60-minute standard and resubmit.' },
  { n: 7, ev: 7, prj: 4, by: 2, to: 8, ap: 1, title: 'Upgrade pedestrian crossing lighting', desc: 'Install permanent lighting and signage at the haul-route pedestrian crossing.', pr: 'medium', st: 'approved', due: '2025-04-05T00:00:00Z', created: '2025-03-26T09:00:00Z', completed: '2025-03-28T17:00:00Z', approved: '2025-03-30T10:00:00Z' },
  { n: 8, ev: 8, prj: 1, by: 1, to: 11, ap: 1, title: 'Fit anti-slip treads to scaffold stairs', desc: 'Retrofit anti-slip treads across all scaffold stair towers on the project.', pr: 'medium', st: 'in_progress', due: '2025-06-05T00:00:00Z', created: '2025-05-21T10:00:00Z', updated: '2025-06-02T09:00:00Z' },
  { n: 9, ev: 9, prj: 3, by: 1, to: 12, ap: 1, title: 'Reposition and inspect silt curtains', desc: 'Reposition dredge silt curtains and introduce daily inspection checks.', pr: 'high', st: 'open', due: '2025-06-10T00:00:00Z', created: '2025-05-23T09:00:00Z' },
  { n: 10, ev: 13, prj: 6, by: 2, to: 15, ap: 2, title: 'Cable management on stairwells', desc: 'Provide cable ramps and reroute all power leads crossing stairwells.', pr: 'low', st: 'approved', due: '2025-04-10T00:00:00Z', created: '2025-04-02T11:00:00Z', completed: '2025-04-06T15:00:00Z', approved: '2025-04-08T09:00:00Z' },
  { n: 11, ev: 11, prj: 5, by: 5, to: 6, ap: 5, title: 'Reassess crane ground bearing', desc: 'Reassess outrigger ground bearing pressures and upsize crane mats.', pr: 'high', st: 'in_progress', due: '2025-06-12T00:00:00Z', created: '2025-05-26T09:00:00Z', updated: '2025-06-08T09:00:00Z' },
  { n: 12, ev: 12, prj: 1, by: 5, to: 7, ap: 5, title: 'Implement heat-stress management plan', desc: 'Introduce work/rest cycles and hydration stations for hot-weather works.', pr: 'high', st: 'in_progress', due: '2025-06-18T00:00:00Z', created: '2025-05-28T12:00:00Z', updated: '2025-06-05T09:00:00Z' },
  { n: 13, ev: 15, prj: 3, by: 1, to: 9, ap: 1, title: 'Mandate forced ventilation for chamber entry', desc: 'Require forced ventilation and continuous gas monitoring for all chamber entries.', pr: 'critical', st: 'approved', due: '2025-06-05T00:00:00Z', created: '2025-05-30T13:00:00Z', completed: '2025-06-02T14:00:00Z', approved: '2025-06-04T09:00:00Z' },
  { n: 14, insp: 6, itemLabel: 'Shoring inspection frequency', prj: 4, by: 1, to: 8, ap: 1, title: 'Increase trench shoring inspection frequency', desc: 'Increase shoring inspections to twice daily for active excavations.', pr: 'medium', st: 'open', due: '2025-04-15T00:00:00Z', created: '2025-03-28T10:00:00Z' },
  { n: 15, ev: 17, prj: 2, by: 5, to: 8, ap: 5, title: 'Segregate flammable storage', desc: 'Relocate flammable goods to the designated segregated flammable store.', pr: 'high', st: 'pending_approval', due: '2025-06-10T00:00:00Z', created: '2025-06-01T10:00:00Z', completed: '2025-06-09T16:00:00Z', updated: '2025-06-09T16:00:00Z' },
  { n: 16, ev: 19, prj: 6, by: 2, to: 10, ap: 2, title: 'Reinforce lock-out/tag-out compliance', desc: 'Re-brief and audit LOTO procedures across electrical works.', pr: 'high', st: 'rejected', due: '2025-04-25T00:00:00Z', created: '2025-04-15T15:00:00Z', completed: '2025-04-22T10:00:00Z', updated: '2025-04-24T09:00:00Z', rej: 'Audit evidence incomplete; attach signed isolation registers and resubmit.' },
  { n: 17, ev: 20, prj: 1, by: 1, to: 6, ap: 1, title: 'Increase concrete washout bund capacity', desc: 'Enlarge the bunded washout area and fit an overflow alarm.', pr: 'medium', st: 'in_progress', due: '2025-06-25T00:00:00Z', created: '2025-06-05T11:00:00Z', updated: '2025-06-10T09:00:00Z' },
  { n: 18, ev: 21, prj: 4, by: 1, to: 15, ap: 1, title: 'Redesign trench shoring', desc: 'Engage the temporary works coordinator to redesign trench shoring before re-entry.', pr: 'critical', st: 'open', due: '2025-06-13T00:00:00Z', created: '2025-06-06T09:00:00Z' },
  { n: 19, insp: 1, itemLabel: 'Fire extinguisher signage', prj: 1, by: 1, to: 3, ap: 1, title: 'Replace faded fire extinguisher signage', desc: 'Replace faded fire extinguisher location signage in the PPE and store areas.', pr: 'low', st: 'approved', due: '2025-05-20T00:00:00Z', created: '2025-05-05T14:30:00Z', completed: '2025-05-18T10:00:00Z', approved: '2025-05-19T09:00:00Z' },
  { n: 20, ev: 23, prj: 5, by: 5, to: 7, ap: 5, title: 'Extend haul-road edge protection', desc: 'Extend edge protection berms and reduce the speed limit on the temporary haul road.', pr: 'medium', st: 'in_progress', due: '2025-06-22T00:00:00Z', created: '2025-06-07T13:00:00Z', updated: '2025-06-11T09:00:00Z' },
  { n: 21, ev: 24, prj: 2, by: 2, to: 11, ap: 2, title: 'Revise mobile scaffold movement procedure', desc: 'Prohibit movement of occupied mobile scaffolds and re-brief operatives.', pr: 'medium', st: 'open', due: '2025-06-28T00:00:00Z', created: '2025-06-08T10:00:00Z' },
  { n: 22, insp: 15, itemLabel: 'Piling exclusion zones', prj: 3, by: 1, to: 9, ap: 1, title: 'Improve piling exclusion zone enforcement', desc: 'Improve enforcement and signage of piling exclusion zones during driving.', pr: 'high', st: 'approved', due: '2025-05-20T00:00:00Z', created: '2025-05-06T09:30:00Z', completed: '2025-05-16T10:00:00Z', approved: '2025-05-18T09:00:00Z' },
  { n: 23, ev: 25, prj: 1, by: 1, to: 6, ap: 1, title: 'Improve crane tagline control', desc: 'Adopt dual taglines and revise the landing zone plan for steel erection.', pr: 'high', st: 'open', due: '2025-05-10T00:00:00Z', created: '2025-04-23T12:00:00Z' },
  { n: 24, ev: 26, prj: 6, by: 5, to: 10, ap: 5, title: 'Reschedule roof works to cooler hours', desc: 'Shift exposed roof works to early morning during heat alerts.', pr: 'medium', st: 'in_progress', due: '2025-06-20T00:00:00Z', created: '2025-06-09T13:00:00Z', updated: '2025-06-12T09:00:00Z' },
  { n: 25, ev: 28, prj: 4, by: 2, to: 8, ap: 2, title: 'Enforce safe stacking heights', desc: 'Re-band and limit precast stack heights to the specified maximum.', pr: 'medium', st: 'rejected', due: '2025-05-05T00:00:00Z', created: '2025-04-26T08:00:00Z', completed: '2025-05-02T10:00:00Z', updated: '2025-05-04T09:00:00Z', rej: 'Stacking plan not provided; submit a revised laydown layout for approval.' },
  { n: 26, ev: 27, prj: 3, by: 1, to: 9, ap: 1, title: 'Modify pile follower connection', desc: 'Inspect and modify the pile follower connection and add pre-use checks.', pr: 'high', st: 'pending_approval', due: '2025-06-16T00:00:00Z', created: '2025-06-10T16:00:00Z', completed: '2025-06-13T10:00:00Z', updated: '2025-06-13T10:00:00Z' },
  { n: 27, insp: 13, itemLabel: 'Traffic signage condition', prj: 4, by: 1, to: 8, ap: 1, title: 'Replace faded traffic management signage', desc: 'Replace faded traffic management signage on the live-road works.', pr: 'low', st: 'in_progress', due: '2025-06-30T00:00:00Z', created: '2025-04-30T10:00:00Z', updated: '2025-06-05T09:00:00Z' },
  { n: 28, ev: 29, prj: 5, by: 5, to: 12, ap: 5, title: 'Mandate refuelling drip trays', desc: 'Require drip trays and spill kits at all plant refuelling points.', pr: 'medium', st: 'pending_approval', due: '2025-06-18T00:00:00Z', created: '2025-06-11T11:00:00Z', completed: '2025-06-14T10:00:00Z', updated: '2025-06-14T10:00:00Z' },
  { n: 29, ev: 30, prj: 2, by: 2, to: 8, ap: 2, title: 'Brace racking before release', desc: 'Require bracing sign-off before installed racking is left unattended.', pr: 'high', st: 'open', due: '2025-06-24T00:00:00Z', created: '2025-06-12T11:00:00Z' },
  { n: 30, ev: 18, prj: 5, by: 5, to: 12, ap: 5, title: 'Improve vessel transfer arrangements', desc: 'Provide a secured gangway and enforce PFD use for all vessel transfers.', pr: 'high', st: 'open', due: '2025-06-14T00:00:00Z', created: '2025-06-04T11:00:00Z' },
  { n: 31, ev: 32, prj: 6, by: 1, to: 10, ap: 1, title: 'Restore materials hoist gate interlock', desc: 'Repair and verify the materials hoist gate interlock and remove the bypass.', pr: 'critical', st: 'pending_approval', due: '2025-06-16T00:00:00Z', created: '2025-06-12T14:30:00Z', completed: '2025-06-14T11:00:00Z', updated: '2025-06-14T11:00:00Z' },
  { n: 32, ev: 33, prj: 3, by: 1, to: 9, ap: 1, title: 'Add redundant diver communications', desc: 'Provide backup diver comms and review the lost-communications drill.', pr: 'high', st: 'in_progress', due: '2025-06-21T00:00:00Z', created: '2025-06-13T10:00:00Z', updated: '2025-06-14T09:00:00Z' },
  { n: 33, insp: 9, itemLabel: 'Confined space rescue drill', prj: 3, by: 1, to: 9, ap: 1, title: 'Complete confined-space rescue refresher', desc: 'Schedule and complete a refresher confined-space rescue drill.', pr: 'medium', st: 'open', due: '2025-06-08T00:00:00Z', created: '2025-04-12T11:00:00Z' },
  { n: 34, ev: 12, prj: 1, by: 5, to: 7, ap: 5, title: 'Provide shaded rest areas', desc: 'Install shaded welfare and rest areas at the rebar fixing zones.', pr: 'medium', st: 'pending_approval', due: '2025-06-12T00:00:00Z', created: '2025-05-29T10:00:00Z', completed: '2025-06-11T16:00:00Z', updated: '2025-06-11T16:00:00Z' },
  { n: 35, ev: 3, prj: 1, by: 1, to: 6, ap: 1, title: 'Activate environmental monitoring plan', desc: 'Stand up a water-quality monitoring plan near the drainage channel.', pr: 'high', st: 'open', due: '2025-06-05T00:00:00Z', created: '2025-05-16T09:00:00Z' },
]

export const MOCK_CORRECTIVE_ACTIONS: CorrectiveAction[] = CA_SEEDS.map(makeCa)

// ============================================================
// Dashboard Stats (derived from the seeded data above)
// ============================================================

export const MOCK_DASHBOARD_STATS: DashboardStats = (() => {
  const draft = MOCK_EVENTS.filter((e) => e.approval_level === 'draft').length
  const closed = MOCK_EVENTS.filter((e) => e.approval_level === 'closed').length
  const total = MOCK_EVENTS.length
  const in_progress = total - draft - closed

  const openCas = MOCK_CORRECTIVE_ACTIONS.filter(
    (c) => c.status !== 'approved' && c.status !== 'rejected'
  )
  const open_actions = openCas.length
  const overdue_actions = openCas.filter(
    (c) => c.due_date != null && new Date(c.due_date) < NOW
  ).length

  const active = MOCK_EVENTS.filter((e) => e.approval_level !== 'closed')
  const deadline_24h_overdue = active.filter(
    (e) => !e.deadline_24h_met && e.reporting_deadline_24h != null && new Date(e.reporting_deadline_24h) < NOW
  ).length
  const deadline_3day_overdue = active.filter(
    (e) => !e.deadline_3day_met && e.reporting_deadline_3day != null && new Date(e.reporting_deadline_3day) < NOW
  ).length
  const in24h = new Date(NOW.getTime() + 24 * 3600 * 1000)
  const deadline_24h_approaching = active.filter((e) => {
    if (e.deadline_24h_met || e.reporting_deadline_24h == null) return false
    const d = new Date(e.reporting_deadline_24h)
    return d >= NOW && d <= in24h
  }).length

  return {
    draft,
    in_progress,
    closed,
    total,
    open_actions,
    overdue_actions,
    deadline_24h_overdue,
    deadline_3day_overdue,
    deadline_24h_approaching,
  }
})()

// ============================================================
// Inspection Stats (derived)
// ============================================================

export const MOCK_INSPECTION_STATS: InspectionStats = (() => {
  const total = MOCK_INSPECTIONS.length
  const completed = MOCK_INSPECTIONS.filter((i) => i.status === 'completed')
  const completed_this_month = completed.filter(
    (i) =>
      i.completed_at != null &&
      new Date(i.completed_at).getUTCFullYear() === NOW.getUTCFullYear() &&
      new Date(i.completed_at).getUTCMonth() === NOW.getUTCMonth()
  ).length
  const scores = completed
    .map((i) => i.score)
    .filter((s): s is number => s != null)
  const average_score = scores.length
    ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
    : null
  return { total, completed_this_month, average_score }
})()

// ============================================================
// Audit Log
// ============================================================

export const MOCK_AUDIT_LOGS: AuditLogEntry[] = [
  { id: id('90000000', 1), actor_id: U(1), actor_email: 'client.admin@example.test', action: 'organization.create', target_table: 'organizations', target_id: ORG(7), target_label: 'BlueWater Dredging Co', metadata: { org_type: 'contractor' }, created_at: '2025-02-01T09:15:00Z' },
  { id: id('90000000', 2), actor_id: U(1), actor_email: 'client.admin@example.test', action: 'organization.create', target_table: 'organizations', target_id: ORG(8), target_label: 'Ironclad Steelworks', metadata: { org_type: 'contractor' }, created_at: '2025-02-04T10:05:00Z' },
  { id: id('90000000', 3), actor_id: U(1), actor_email: 'client.admin@example.test', action: 'user.invite', target_table: 'profiles', target_id: U(14), target_label: 'tom.becker@example.test', metadata: { role: 'client_user' }, created_at: '2025-02-10T08:30:00Z' },
  { id: id('90000000', 4), actor_id: U(2), actor_email: 'james.okafor@example.test', action: 'project.create', target_table: 'projects', target_id: PRJ(5), target_label: 'Breakwater Reinforcement Works', metadata: { location: 'East Breakwater' }, created_at: '2025-03-10T11:00:00Z' },
  { id: id('90000000', 5), actor_id: U(1), actor_email: 'client.admin@example.test', action: 'user.update', target_table: 'profiles', target_id: U(13), target_label: 'hassan.karim@example.test', metadata: { status: { from: 'active', to: 'deactivated' } }, created_at: '2025-05-02T14:20:00Z' },
  { id: id('90000000', 6), actor_id: U(2), actor_email: 'james.okafor@example.test', action: 'event.advance', target_table: 'events', target_id: id('30000000', 2), target_label: 'EVT-2025-002', metadata: { approval_level: { from: 'contractor_review', to: 'review' } }, created_at: '2025-05-12T15:00:00Z' },
  { id: id('90000000', 7), actor_id: U(6), actor_email: 'carlos.mendez@example.test', action: 'event.create', target_table: 'events', target_id: id('30000000', 9), target_label: 'EVT-2025-009', metadata: { type: 'hazard_identification' }, created_at: '2025-05-15T10:30:00Z' },
  { id: id('90000000', 8), actor_id: U(1), actor_email: 'client.admin@example.test', action: 'corrective_action.create', target_table: 'corrective_actions', target_id: id('40000000', 3), target_label: 'CA-2025-003', metadata: { priority: 'critical' }, created_at: '2025-05-15T12:00:00Z' },
  { id: id('90000000', 9), actor_id: U(5), actor_email: 'aisha.rahman@example.test', action: 'inspection.complete', target_table: 'inspections', target_id: id('60000000', 2), target_label: 'INS-2025-002', metadata: { score: 100 }, created_at: '2025-05-10T16:00:00Z' },
  { id: id('90000000', 10), actor_id: U(1), actor_email: 'client.admin@example.test', action: 'corrective_action.approve', target_table: 'corrective_actions', target_id: id('40000000', 4), target_label: 'CA-2025-004', metadata: { status: { from: 'pending_approval', to: 'approved' } }, created_at: '2025-05-19T09:00:00Z' },
  { id: id('90000000', 11), actor_id: U(1), actor_email: 'client.admin@example.test', action: 'user.approve', target_table: 'profiles', target_id: U(15), target_label: 'emma.schmidt@example.test', metadata: { status: { from: 'pending', to: 'active' } }, created_at: '2025-02-13T09:45:00Z' },
  { id: id('90000000', 12), actor_id: U(2), actor_email: 'james.okafor@example.test', action: 'event.close', target_table: 'events', target_id: id('30000000', 4), target_label: 'EVT-2025-004', metadata: { approval_level: { from: 'approval', to: 'closed' } }, created_at: '2025-04-12T12:00:00Z' },
]

// ============================================================
// Data Subject Requests (PDPL)
// ============================================================
// In mock mode this is an in-memory store. submitDsrRequest() appends here so
// the demo can show a request being raised. In production this is a DB table
// the DPO works from.

export const MOCK_DSR_REQUESTS: DsrRequest[] = []

// ============================================================
// Notifications
// ============================================================
// In-memory notification store. Mutating actions append here via
// createNotification() so the bell menu and notifications page reflect activity
// raised during the running session.
// TODO(prod): replace with a `notifications` table (RLS: a user reads only
// their own rows) and deliver via realtime / push.

export const MOCK_NOTIFICATIONS: Notification[] = []

// ============================================================
// Notification preferences
// ============================================================
// Per-user delivery preferences (Settings → Notifications). Rows are created
// lazily on first save; getNotificationPreferences() supplies defaults for
// users without a stored row.
// TODO(prod): replace with a `notification_preferences` table keyed by user_id.

export const MOCK_NOTIFICATION_PREFS: NotificationPreferences[] = []
