// Picklists and export configuration for the event reporting module.
// Site and contractor values are synthetic demo placeholders. (The original
// production picklists mirrored an upstream import template one-to-one; that
// fidelity is intentionally dropped here so no real company names or contract
// numbers are stored — see the "fully sanitize" data-minimization decision.)

export const SITE_OPTIONS: string[] = [
  'Site 01 — Contractor A (Demo)',
  'Site 02 — Contractor B (Demo)',
  'Site 03 — Contractor C (Demo)',
  'Site 04 — Contractor D (Demo)',
  'Site 05 — Contractor E (Demo)',
  'Site 06 — Contractor F (Demo)',
  'Site 07 — Contractor G (Demo)',
  'Site 08 — Contractor H (Demo)',
  'Site 09 — Contractor I (Demo)',
  'Site 10 — Contractor J (Demo)',
]

export const CONTRACTOR_OPTIONS: string[] = [
  'Contractor A',
  'Contractor B',
  'Contractor C',
  'Contractor D',
  'Contractor E',
  'Contractor F',
  'Contractor G',
  'Contractor H',
  'Contractor I',
  'Contractor J',
]

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
