import type { EventType, EventClassification } from '@/types/enums'

// Picklists and export configuration for the event reporting module.
// Site and contractor values are synthetic demo placeholders. (The original
// production picklists mirrored an upstream import template one-to-one; that
// fidelity is intentionally dropped here so no real company names or contract
// numbers are stored — see the "fully sanitize" data-minimization decision.)

// Each site is paired one-to-one with the contractor working it. Site is the
// single source of truth; contractor is derived from this map (never entered
// directly) so the two values can never drift out of sync.
export const SITE_CONTRACTOR_MAP: Record<string, string> = {
  'Site 01': 'Contractor A',
  'Site 02': 'Contractor B',
  'Site 03': 'Contractor C',
  'Site 04': 'Contractor D',
  'Site 05': 'Contractor E',
  'Site 06': 'Contractor F',
  'Site 07': 'Contractor G',
  'Site 08': 'Contractor H',
  'Site 09': 'Contractor I',
  'Site 10': 'Contractor J',
}

export const SITE_OPTIONS: string[] = Object.keys(SITE_CONTRACTOR_MAP)

// Classification is a sub-category of the selected Type. A Type value never
// re-appears as a Classification — single source of truth for both event forms.
export const CLASSIFICATION_BY_TYPE: Record<EventType, EventClassification[]> = {
  incident: ['fire', 'environment', 'welfare', 'security', 'safety'],
  near_miss: [],
  hazard_identification: ['unsafe_act', 'unsafe_condition', 'non_conformance'],
  positive_observation: ['positive_observation'],
  leadership_event: [
    'leadership_site_visit',
    'emergency_drill',
    'safety_meeting',
    'contractor_performance_review',
  ],
}

// Resolve the contractor responsible for a given site, or null when the site is
// empty or unrecognized.
export function contractorForSite(
  site: string | null | undefined
): string | null {
  if (!site) return null
  return SITE_CONTRACTOR_MAP[site] ?? null
}

// Exact ordered header row for the exported importable file.
export const EXPORT_COLUMNS: string[] = [
  'CS \\ Approval Process Level',
  'Type',
  'Was there a fire?',
  'Did a person suffer an injury or illness?',
  'Was the environment impacted?',
  'Classification',
  'Site',
  'Contractor',
  'CS \\ Specific Area',
  'Latitude',
  'Longitude',
  'Event Date',
  'Reported Date',
  'UR \\ Work-related',
  'UR \\ Impacted Party',
  'Leadership Member Name',
  'Attendees',
  'Notify attendees by email',
  'Event Description',
  'Conditions',
  'Significant Hazard',
  'Was this a Repeat Incident?',
  'Immediate Corrective Actions',
  'UR  \\ Stop Work',
  'UR \\ Stop Work Details',
  'UR \\ Further Corrective Action Required?',
  'Attachments',
  'UR \\ Contractor Reviewer',
  'UR \\ Reviewer',
  'CS \\ Contractor Investigator',
  'UR \\ Lead Investigator',
  'UR \\ Validator',
  'UR \\ Approver',
  'Created By',
]
