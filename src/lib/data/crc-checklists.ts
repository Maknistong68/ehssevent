import type { InspectionTemplate } from '@/types/database'

// ============================================================
// CRC (Critical Risk Control) Inspection Checklists
//
// Compact, content-only source for the 15 CRC inspection
// checklists (182 questions total). The `buildCrcTemplates`
// builder maps this content onto the `InspectionTemplate` shape
// used throughout the app — every question becomes a
// `field_type: 'compliance'` item.
//
// This file must NOT import from `mock-data.ts` (org/user IDs are
// passed in as arguments) to avoid a circular import.
// ============================================================

export interface CrcSection {
  title: string
  questions: string[]
}

export interface CrcChecklist {
  slug: string
  name: string
  description: string
  sections: CrcSection[]
}

export const CRC_CHECKLISTS: CrcChecklist[] = [
  {
    slug: 'working-near-water',
    name: 'Working on or Near Water',
    description: 'CRC inspection checklist — Working on or Near Water',
    sections: [
      {
        title: 'Requirements / Deliverables',
        questions: [
          'A documented risk assessment for work on or near water is in place and communicated to the team.',
          'A safe work method statement (SWMS) specific to the water activity has been approved.',
          'Personnel hold current competencies and certifications for working on or near water.',
          'A rescue and emergency response plan is established and has been rehearsed.',
          'Weather, tide and current conditions have been assessed prior to commencing work.',
          'Permits to work on or near water have been obtained where required.',
        ],
      },
      {
        title: 'Working on water',
        questions: [
          'Personnel wear approved personal flotation devices (PFDs) at all times.',
          'Vessels and floating plant are certified, maintained and within load limits.',
          'A trained spotter or safety boat is available during over-water operations.',
          'Lifebuoys, throw lines and rescue equipment are accessible at the work area.',
          'Communication systems between vessel and shore are tested and functional.',
        ],
      },
      {
        title: 'Working over or near water',
        questions: [
          'Edge protection or fall prevention is provided where there is a risk of falling into water.',
          'Exclusion zones around water hazards are established and signposted.',
          "Access and egress routes to the water's edge are stable and clearly marked.",
          'Materials and equipment are secured to prevent them entering the water.',
          'Drowning and cold-water immersion hazards are controlled and briefed to the team.',
        ],
      },
    ],
  },
  {
    slug: 'work-at-height',
    name: 'Work at Height',
    description: 'CRC inspection checklist — Work at Height',
    sections: [
      {
        title: 'Requirements / Deliverables',
        questions: [
          'A risk assessment for work at height has been completed and communicated.',
          'The hierarchy of controls has been applied to eliminate or minimise the fall risk.',
          'Personnel are trained and competent to work at height.',
          'A rescue plan for persons working at height is in place.',
          'A permit to work at height has been issued where required.',
        ],
      },
      {
        title: 'Access equipment and platforms',
        questions: [
          'Scaffolding is erected by competent persons and tagged as inspected.',
          'Mobile elevating work platforms (MEWPs) are certified and operated by trained personnel.',
          'Ladders are in good condition, secured and used only for short-duration tasks.',
          'Working platforms have guardrails, mid-rails and toe boards fitted.',
        ],
      },
      {
        title: 'Fall protection',
        questions: [
          'Personal fall arrest systems are inspected before use and correctly anchored.',
          'Tools and materials are secured to prevent dropped objects.',
          'Exclusion zones are established beneath overhead work areas.',
        ],
      },
    ],
  },
  {
    slug: 'working-in-heat',
    name: 'Working in the Heat',
    description: 'CRC inspection checklist — Working in the Heat',
    sections: [
      {
        title: 'Requirements / Deliverables',
        questions: [
          'A heat stress risk assessment has been completed for the work environment.',
          'Ambient temperature and humidity are monitored throughout the shift.',
          'Personnel are trained to recognise the signs of heat illness.',
          'A heat management plan is in place and communicated to workers.',
          'Emergency procedures for heat-related illness are established.',
        ],
      },
      {
        title: 'Heat controls',
        questions: [
          'Adequate drinking water is available and accessible at the work area.',
          'Shaded rest areas are provided for cool-down breaks.',
          'Work-rest cycles are adjusted according to heat conditions.',
          'Personnel wear appropriate lightweight, breathable clothing.',
          'High-risk work is rescheduled to cooler parts of the day where practicable.',
          'New and returning workers are acclimatised to the heat progressively.',
        ],
      },
    ],
  },
  {
    slug: 'lifting',
    name: 'Lifting',
    description: 'CRC inspection checklist — Lifting',
    sections: [
      {
        title: 'Requirements / Deliverables',
        questions: [
          'A lift plan has been prepared and approved for the lifting operation.',
          'The risk assessment identifies all lifting hazards and controls.',
          'Personnel involved hold current crane, rigging and dogging competencies.',
          'A permit to lift has been issued where required.',
          'Roles and responsibilities for the lift team are clearly defined.',
        ],
      },
      {
        title: 'Lifting equipment',
        questions: [
          'Cranes and lifting appliances are within current inspection and certification dates.',
          'Lifting gear (slings, shackles, hooks) is inspected and rated for the load.',
          "Load charts are available and the lift is within the equipment's safe working load.",
          'Outriggers are deployed on stable, load-rated ground bearing.',
          'Lifting equipment is free from visible damage, wear or defects.',
        ],
      },
      {
        title: 'Lifting operations',
        questions: [
          'Exclusion zones are established and enforced beneath suspended loads.',
          'Tag lines are used to control the load where required.',
          'Communication between operator and dogger/rigger is clear and agreed.',
          'Weather conditions, particularly wind speed, are within safe limits.',
          'The load is correctly slung, balanced and secured before lifting.',
        ],
      },
    ],
  },
  {
    slug: 'hot-works',
    name: 'Hot Works',
    description: 'CRC inspection checklist — Hot Works',
    sections: [
      {
        title: 'Requirements / Deliverables',
        questions: [
          'A hot work permit has been issued and is displayed at the work area.',
          'A risk assessment for the hot work activity has been completed.',
          'Personnel are trained and competent in the hot work to be performed.',
          'A fire watch is assigned during and after hot work activities.',
          'The work area has been inspected and approved prior to starting.',
        ],
      },
      {
        title: 'Fire prevention and control',
        questions: [
          'Combustible materials are removed or protected within the hot work zone.',
          'Appropriate fire extinguishing equipment is available at the work area.',
          'Gas cylinders are secured upright and fitted with flashback arrestors.',
          'The area is monitored for a fire watch period after work is completed.',
          'Adequate ventilation is provided to control fumes and gases.',
        ],
      },
    ],
  },
  {
    slug: 'energised-systems',
    name: 'Energised Systems',
    description: 'CRC inspection checklist — Energised Systems',
    sections: [
      {
        title: 'Requirements / Deliverables',
        questions: [
          'A risk assessment for work on energised systems has been completed.',
          'An electrical safety permit has been issued where required.',
          'Personnel hold current electrical competencies for the task.',
          'Single-line diagrams and isolation points have been identified.',
          'A rescue plan for electric shock and arc flash is in place.',
        ],
      },
      {
        title: 'Isolation and lockout',
        questions: [
          'Energy sources are isolated, locked out and tagged before work begins.',
          'Isolation has been tested and proven de-energised before work commences.',
          'Stored energy has been discharged and verified.',
          'Lockout devices and personal danger tags are applied by each worker.',
        ],
      },
      {
        title: 'Working on energised systems',
        questions: [
          'Appropriate insulated tools and rated PPE are used for live work.',
          'Arc flash boundaries are established and exclusion zones maintained.',
          'A second competent person is present during live electrical work.',
          'Test instruments are rated, calibrated and proven before and after use.',
        ],
      },
    ],
  },
  {
    slug: 'drilling-blasting',
    name: 'Drilling and Blasting',
    description: 'CRC inspection checklist — Drilling and Blasting',
    sections: [
      {
        title: 'Requirements / Deliverables',
        questions: [
          'A blast management plan has been prepared and approved.',
          'A risk assessment for drilling and blasting has been completed.',
          'The shotfirer and blast crew hold current licences and competencies.',
          'Explosives are stored, transported and handled per regulatory requirements.',
          'Statutory notifications and permits for blasting have been obtained.',
        ],
      },
      {
        title: 'Blasting operations',
        questions: [
          'Exclusion zones are established and confirmed clear before firing.',
          'Warning signals and sirens are sounded prior to each blast.',
          'Misfire procedures are documented and understood by the crew.',
          'Drill holes are checked, charged and stemmed in accordance with the design.',
          'Post-blast inspection is completed before re-entry to the blast area.',
        ],
      },
    ],
  },
  {
    slug: 'breaking-ground-excavations',
    name: 'Breaking Ground & Excavations',
    description: 'CRC inspection checklist — Breaking Ground & Excavations',
    sections: [
      {
        title: 'Requirements / Deliverables',
        questions: [
          'A permit to excavate / break ground has been issued.',
          'A risk assessment for the excavation activity has been completed.',
          'Underground services have been located, identified and marked.',
          'Personnel are trained and competent in excavation work.',
          'A rescue plan for excavation collapse is in place.',
        ],
      },
      {
        title: 'Excavation controls',
        questions: [
          'Excavations are supported, battered or benched to prevent collapse.',
          'Spoil and materials are kept clear of the excavation edge.',
          'Safe access and egress (ladders/ramps) is provided into the excavation.',
          'Barriers and signage are in place around open excavations.',
          'The atmosphere within deep excavations is tested where required.',
          'Excavations are inspected by a competent person before each shift.',
          'Plant and traffic are kept a safe distance from excavation edges.',
        ],
      },
    ],
  },
  {
    slug: 'piling',
    name: 'Piling',
    description: 'CRC inspection checklist — Piling',
    sections: [
      {
        title: 'Requirements / Deliverables',
        questions: [
          'A piling plan / methodology has been prepared and approved.',
          'A risk assessment for piling activities has been completed.',
          'Ground conditions and underground services have been assessed.',
          'Personnel and operators hold current piling competencies.',
          'A permit to commence piling has been issued where required.',
        ],
      },
      {
        title: 'Piling plant and equipment',
        questions: [
          'Piling rigs are certified, maintained and inspected before use.',
          'The piling rig is set up on stable, load-rated ground.',
          'Lifting attachments and ancillary equipment are rated and inspected.',
          'Rig stability and ground bearing pressures are within design limits.',
        ],
      },
      {
        title: 'Piling operations',
        questions: [
          'Exclusion zones are established around the piling rig and operations.',
          'A trained spotter manages plant movement and personnel separation.',
          'Wet concrete and spoil handling hazards are controlled.',
          'Communication between the operator and ground crew is clear and agreed.',
        ],
      },
    ],
  },
  {
    slug: 'diving-underwater',
    name: 'Diving & Underwater Activities',
    description: 'CRC inspection checklist — Diving & Underwater Activities',
    sections: [
      {
        title: 'Requirements / Deliverables',
        questions: [
          'A dive plan has been prepared and approved for the activity.',
          'A risk assessment for diving operations has been completed.',
          'Divers hold current commercial diving qualifications and medical fitness.',
          'A dive supervisor is appointed and present during operations.',
          'An emergency and decompression plan is in place.',
        ],
      },
      {
        title: 'Diving operations',
        questions: [
          'Diving equipment is inspected, tested and certified before use.',
          'Surface communications with the diver are maintained throughout the dive.',
          'Standby diver and rescue arrangements are in place.',
          'Hazards such as currents, intakes and entrapment are assessed and controlled.',
          'Decompression and surface intervals are managed and recorded.',
        ],
      },
    ],
  },
  {
    slug: 'temporary-works',
    name: 'Temporary Works',
    description: 'CRC inspection checklist — Temporary Works',
    sections: [
      {
        title: 'Requirements / Deliverables',
        questions: [
          'A temporary works register is maintained and up to date.',
          'A risk assessment for the temporary works has been completed.',
          'A temporary works coordinator has been appointed.',
          'Temporary works designs have been checked and approved.',
          'A permit to load / permit to strike has been issued where required.',
        ],
      },
      {
        title: 'Design and inspection',
        questions: [
          'The temporary works are constructed in accordance with the approved design.',
          'Materials used match the design specification.',
          'Temporary works are inspected by a competent person before loading.',
          'Ground bearing and foundations for temporary works are adequate.',
        ],
      },
      {
        title: 'Erection and use',
        questions: [
          'Loading of the temporary works does not exceed design limits.',
          'Modifications are subject to design review and approval.',
          'Dismantling follows an approved sequence and method.',
        ],
      },
    ],
  },
  {
    slug: 'confined-spaces',
    name: 'Confined Spaces',
    description: 'CRC inspection checklist — Confined Spaces',
    sections: [
      {
        title: 'Requirements / Deliverables',
        questions: [
          'A confined space entry permit has been issued.',
          'A risk assessment for the confined space entry has been completed.',
          'Entrants and standby personnel are trained and competent.',
          'A confined space rescue plan is in place and equipment is available.',
          'The confined space is identified, signposted and access controlled.',
        ],
      },
      {
        title: 'Entry controls',
        questions: [
          'The atmosphere is tested for oxygen, flammable and toxic gases before entry.',
          'Continuous atmospheric monitoring is maintained during occupancy.',
          'Mechanical and process isolations are in place and verified.',
          'A standby person maintains communication with entrants at all times.',
          'Adequate ventilation is provided throughout the entry.',
        ],
      },
    ],
  },
  {
    slug: 'working-near-live-roads',
    name: 'Working on or Near Live Roads',
    description: 'CRC inspection checklist — Working on or Near Live Roads',
    sections: [
      {
        title: 'Requirements / Deliverables',
        questions: [
          'A traffic management plan has been prepared and approved.',
          'A risk assessment for working near live roads has been completed.',
          'Traffic controllers hold current accreditation.',
          'A permit to work on or near the carriageway has been issued where required.',
          'Roles and responsibilities for traffic management are defined.',
        ],
      },
      {
        title: 'Traffic management',
        questions: [
          'Traffic control devices are installed in accordance with the plan.',
          'Signage and delineation are correctly positioned and visible.',
          'Workers wear high-visibility clothing appropriate to the road environment.',
          'A safety buffer / exclusion zone separates workers from live traffic.',
          'Speed reductions are in place and enforced through the work zone.',
          'Plant and pedestrian movements near the carriageway are controlled.',
        ],
      },
    ],
  },
  {
    slug: 'driving',
    name: 'Driving',
    description: 'CRC inspection checklist — Driving',
    sections: [
      {
        title: 'Requirements / Deliverables',
        questions: [
          'A risk assessment for driving activities has been completed.',
          'Drivers hold a current licence appropriate to the vehicle class.',
          'A journey management plan is in place for high-risk trips.',
          'Fatigue management arrangements are established.',
          'A driver competency / induction has been completed.',
        ],
      },
      {
        title: 'Vehicle and journey',
        questions: [
          'Vehicles are maintained, serviced and roadworthy.',
          'Pre-start vehicle inspections are completed and recorded.',
          'Seatbelts are worn by all occupants at all times.',
          'Mobile phone and distraction controls are in place and enforced.',
          'Loads are correctly secured and within vehicle limits.',
          'Speed is appropriate to road, weather and site conditions.',
          'Driving hours are managed to control fatigue.',
        ],
      },
    ],
  },
  {
    slug: 'mobile-plant-equipment',
    name: 'Mobile Plant & Equipment',
    description: 'CRC inspection checklist — Mobile Plant & Equipment',
    sections: [
      {
        title: 'Requirements / Deliverables',
        questions: [
          'A risk assessment for mobile plant operations has been completed.',
          'Operators hold current licences and competencies for the plant.',
          'A traffic / pedestrian management plan separates plant from people.',
          'A permit to operate is in place where required.',
          'Plant is included in the site inspection and maintenance register.',
        ],
      },
      {
        title: 'Plant condition',
        questions: [
          'Pre-start inspections are completed and recorded for each machine.',
          'Plant is fitted with operational reversing alarms and warning beacons.',
          'ROPS/FOPS and operator restraints are fitted and functional.',
          'Plant is maintained and serviced in accordance with the schedule.',
          'Defects are reported and faulty plant is tagged out of service.',
        ],
      },
      {
        title: 'Plant operations',
        questions: [
          'Exclusion zones separate operating plant from pedestrians.',
          'A trained spotter assists with blind-spot and reversing operations.',
          'Plant operates within rated capacity and on stable ground.',
          'Communication protocols between operators and ground crew are followed.',
          'Plant is shut down, isolated and secured when unattended.',
        ],
      },
    ],
  },
]

export function buildCrcTemplates(opts: {
  organizationId: string
  createdBy: string
  creator: InspectionTemplate['creator']
  createdAt?: string
}): InspectionTemplate[] {
  const createdAt = opts.createdAt ?? '2025-03-01T00:00:00Z'
  return CRC_CHECKLISTS.map((checklist, ti) => ({
    id: `51000000-0000-4000-8000-${String(ti + 1).padStart(12, '0')}`,
    organization_id: opts.organizationId,
    name: checklist.name,
    description: checklist.description,
    sections: checklist.sections.map((section, si) => ({
      id: `${checklist.slug}-s${si + 1}`,
      title: section.title,
      order: si,
      items: section.questions.map((label, qi) => ({
        id: `${checklist.slug}-s${si + 1}-i${qi + 1}`,
        label,
        field_type: 'compliance' as const,
        required: false,
        options: null,
        order: qi,
      })),
    })),
    is_active: true,
    created_by: opts.createdBy,
    created_at: createdAt,
    updated_at: createdAt,
    creator: opts.creator,
  }))
}
