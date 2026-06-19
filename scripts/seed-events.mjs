import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    'Missing env vars. Run with: node --env-file=.env.local scripts/seed-events.mjs'
  )
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const SITE = '4800000882 [AL-FAHD] South Business Community High Density Expansion'
const CONTRACTOR = 'Al Fahd'
const AREA = 'Hive Work Area'
const AUTHOR = 'Carlo Mar Banadero'
const EVENT_DATE = '2026-01-06T00:00:00Z'

const TYPE_MAP = {
  'Positive Observation': 'positive_observation',
  'Hazard Identification': 'hazard_identification',
}
const CLASS_MAP = {
  'Positive Observation': 'positive_observation',
  'Unsafe Condition': 'unsafe_condition',
  'Unsafe Act': 'unsafe_act',
  'Non-Conformance': 'non_conformance',
}
const HAZARD_MAP = {
  Other: 'other',
  'Mobile Plant & Equipment': 'mobile_plant_equipment',
  'Breaking Ground & Excavations': 'breaking_ground_excavations',
  Driving: 'driving',
  'Energised Systems': 'energised_systems',
}

// reported_date offsets keep the original spread of dates from the source file
const SAMPLE = [
  { type: 'Positive Observation', cls: 'Positive Observation', hazard: 'Other', reported: '2027-02-06', further: false, desc: null, action: null },
  { type: 'Hazard Identification', cls: 'Unsafe Condition', hazard: 'Other', reported: '2027-02-07', further: true,
    desc: 'Highly flammable chemical canisters were found stored under direct sunlight without adequate protection. Improper storage and management of flammable materials were observed',
    action: 'Store all flammable chemical canisters in a designated, shaded, and ventilated storage area with appropriate fire prevention and spill control measures.' },
  { type: 'Hazard Identification', cls: 'Non-Conformance', hazard: 'Other', reported: '2027-02-08', further: true,
    desc: 'Hand tools were found without valid color coding. Additionally, some tools were in poor condition, showing physical damage and unauthorized fabrication/modification.',
    action: 'Remove damaged, fabricated, or defective hand tools from service immediately. Ensure all tools are inspected, maintained, and provided with valid color coding.' },
  { type: 'Hazard Identification', cls: 'Unsafe Condition', hazard: 'Mobile Plant & Equipment', reported: '2027-02-09', further: true,
    desc: 'A gas-powered portable roller compactor was found without an inspection tag and color coding.',
    action: 'Conduct inspection of the gas-powered portable roller compactor and affix the required inspection tag and color code prior to use.' },
  { type: 'Hazard Identification', cls: 'Unsafe Condition', hazard: 'Other', reported: '2027-02-10', further: true,
    desc: 'During the routine inspection, it was observed that the toilet facilities provided in the rest shelter area were insufficient. Approximately 20 personnel are assigned to the work area; however, only one toilet facility was available.',
    action: 'Provide additional toilet facilities in accordance with workforce requirements and applicable welfare standards.' },
  { type: 'Hazard Identification', cls: 'Unsafe Condition', hazard: 'Breaking Ground & Excavations', reported: '2027-02-11', further: true,
    desc: 'Edge protection around excavations was found to be insufficient and inadequate. Scaffolding barriers installed had gaps, and warning tapes were being utilized as edge protection and barricading. Furthermore, trench excavations were found without adequate barricades and warning signage',
    action: 'Install robust edge protection around all excavations, eliminate gaps in barricading, replace warning tapes with suitable physical barriers, and provide adequate warning signs and barricades around excavation areas.' },
  { type: 'Hazard Identification', cls: 'Unsafe Condition', hazard: 'Driving', reported: '2027-02-12', further: true,
    desc: 'Security patrol vehicles were observed traveling against the designated traffic flow (counterflow) on the access road.',
    action: 'Reinforce traffic management requirements and ensure all drivers follow the designated traffic flow. Conduct awareness sessions and monitor compliance.' },
  { type: 'Hazard Identification', cls: 'Unsafe Condition', hazard: 'Energised Systems', reported: '2027-02-13', further: true,
    desc: "The tower light provided on site did not display the responsible electrician's details and contact number. In addition, no fire extinguisher was available in the immediate vicinity.",
    action: "Display the responsible electrician's name and contact details on the tower light. Provide a suitable fire extinguisher adjacent to the equipment and ensure routine inspections are conducted." },
  { type: 'Hazard Identification', cls: 'Unsafe Condition', hazard: 'Other', reported: '2027-02-14', further: true,
    desc: 'Poor cable management was observed. Cables intended for installation were left obstructing pedestrian walkways, creating a tripping hazard and increasing the risk of damage to nearby parked vehicles.',
    action: 'Implement proper cable management by routing, securing, and protecting cables to prevent trip hazards and potential damage from vehicle movements.' },
  { type: 'Hazard Identification', cls: 'Unsafe Condition', hazard: 'Other', reported: '2027-02-06', further: true,
    desc: 'A straight ladder was found improperly stored when not in use. Additionally, the ladder was not inspected and did not have a valid color code.',
    action: 'Store ladders properly when not in use and ensure all ladders are inspected, tagged, and color coded in accordance with site requirements.' },
  { type: 'Hazard Identification', cls: 'Unsafe Condition', hazard: 'Breaking Ground & Excavations', reported: '2027-02-06', further: true,
    desc: 'Safe access and egress for the excavation were not provided. A worker was observed exiting the excavation through unstable and loose soil adjacent to the excavation area.',
    action: 'Provide safe access and egress for excavations, such as ladders or engineered access points, and prohibit personnel from climbing unstable excavation slopes.' },
  { type: 'Hazard Identification', cls: 'Unsafe Condition', hazard: 'Other', reported: '2027-02-06', further: true,
    desc: 'Non-compliance related to work permits and task briefings was identified. Multiple work permits were issued; however, only one task briefing was conducted',
    action: 'Ensure task briefings are conducted for each approved work permit and whenever there are changes in work scope, location, or associated hazards.' },
  { type: 'Hazard Identification', cls: 'Unsafe Condition', hazard: 'Mobile Plant & Equipment', reported: '2027-02-06', further: true,
    desc: "The skid loader's Proximity Warning Alert System (PWAS) was found not audible. Furthermore, the equipment checklist was insufficient, as it did not include verification of the PWAS functionality prior to operation.",
    action: 'Repair the skid loader PWAS system to ensure it is fully audible and functional. Update the pre-use inspection checklist to include verification of PWAS functionality before operation.' },
  { type: 'Hazard Identification', cls: 'Unsafe Condition', hazard: 'Other', reported: '2027-02-06', further: true,
    desc: 'Protruding reinforcing bars (rebars) were observed without protective rebar caps.',
    action: 'Install approved rebar caps or other suitable protection on all exposed and protruding reinforcing bars.' },
  { type: 'Hazard Identification', cls: 'Unsafe Condition', hazard: 'Breaking Ground & Excavations', reported: '2027-02-06', further: true,
    desc: 'A worker was observed carrying out excavation activities adjacent to an elevated area without adequate fall protection. No barricades or other protective measures were provided to eliminate the fall hazard.',
    action: 'Provide adequate fall protection measures, including barricades, edge protection, or other engineered controls, before allowing work adjacent to elevated areas.' },
  { type: 'Hazard Identification', cls: 'Unsafe Act', hazard: 'Other', reported: '2027-02-06', further: true,
    desc: 'PPE non-compliance was observed, with a worker engaged in excavation activities not wearing the required safety shoes.',
    action: 'Enforce PPE compliance through supervision and monitoring. Ensure all personnel wear the required PPE, including safety footwear, before commencing work' },
  { type: 'Hazard Identification', cls: 'Unsafe Condition', hazard: 'Mobile Plant & Equipment', reported: '2027-02-06', further: true, repeat: true,
    desc: 'Repeated observation: A mobile equipment unit previously identified as having a non-functional PWAS system was found operating on site despite prior instructions prohibiting its use until the system was fully repaired and functional.',
    action: 'Immediately remove from service any mobile equipment with a non-functional PWAS system. Equipment shall only be returned to operation after repairs, testing, and verification of full functionality.' },
  { type: 'Hazard Identification', cls: 'Unsafe Condition', hazard: 'Mobile Plant & Equipment', reported: '2027-02-06', further: true,
    desc: 'A water tanker was observed parked on a sloped surface without wheel chocks installed.',
    action: 'Install wheel chocks on all vehicles and equipment parked on sloped surfaces to prevent unintended movement.' },
  { type: 'Hazard Identification', cls: 'Unsafe Condition', hazard: 'Mobile Plant & Equipment', reported: '2027-02-06', further: true,
    desc: 'Interlock materials were observed being transported by a telehandler without being properly secured.',
    action: 'Ensure all loads transported by telehandlers are properly secured and stabilized before movement. Operators shall verify load security prior to transport.' },
  { type: 'Hazard Identification', cls: 'Unsafe Condition', hazard: 'Mobile Plant & Equipment', reported: '2027-02-06', further: true,
    desc: 'An asphalt cutting machine was found without an inspection tag, equipment checklist, and valid color coding.',
    action: 'Conduct inspection of the asphalt cutting machine, complete the required checklist, and provide a valid inspection tag and color coding before use.' },
]

async function main() {
  console.log('\n--- Seeding sample events ---\n')

  // Pick an existing profile (with an organization) to own the events
  const { data: profiles, error: profErr } = await supabase
    .from('profiles')
    .select('id, full_name, organization_id')
    .not('organization_id', 'is', null)
    .limit(1)

  if (profErr) {
    console.error('Error reading profiles:', profErr.message)
    process.exit(1)
  }
  if (!profiles || profiles.length === 0) {
    console.error(
      'No profiles with an organization found. Run scripts/seed.mjs first to create users/orgs.'
    )
    process.exit(1)
  }

  const owner = profiles[0]
  console.log(
    `Owner: ${owner.full_name || owner.id} (org ${owner.organization_id})`
  )

  const rows = SAMPLE.map((s) => ({
    created_by: owner.id,
    creator_org_id: owner.organization_id,
    approval_level: 'contractor_review',
    type: TYPE_MAP[s.type],
    classification: CLASS_MAP[s.cls],
    significant_hazard: HAZARD_MAP[s.hazard] ?? 'other',
    site: SITE,
    contractor: CONTRACTOR,
    specific_area: AREA,
    event_date: EVENT_DATE,
    reported_date: `${s.reported}T00:00:00Z`,
    work_related: true,
    repeat_incident: s.repeat ?? false,
    stop_work: false,
    further_action_required: s.further,
    event_description: s.desc,
    immediate_corrective_actions: s.action,
    created_by_name: AUTHOR,
  }))

  const { data, error } = await supabase.from('events').insert(rows).select('id')

  if (error) {
    console.error('Error inserting events:', error.message)
    process.exit(1)
  }

  console.log(`\nInserted ${data.length} sample events.`)
  console.log('Open /events to view them or use Export to download the file.\n')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
