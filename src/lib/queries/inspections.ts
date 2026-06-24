import {
  MOCK_INSPECTION_TEMPLATES,
  MOCK_INSPECTIONS,
  MOCK_INSPECTION_RESPONSES,
} from '@/lib/mock-data'
import type {
  InspectionTemplate,
  Inspection,
  InspectionResponse,
  Profile,
} from '@/types/database'
import type { InspectionStatus } from '@/types/enums'

interface InspectionFilters {
  status?: InspectionStatus
  project_id?: string
  template_id?: string
  conducted_by?: string[]
  search?: string
}

export async function getTemplates(): Promise<InspectionTemplate[]> {
  return MOCK_INSPECTION_TEMPLATES.filter((t) => t.is_active)
}

export async function getAllTemplates(): Promise<InspectionTemplate[]> {
  return [...MOCK_INSPECTION_TEMPLATES]
}

export async function getTemplateById(
  id: string
): Promise<InspectionTemplate | null> {
  return MOCK_INSPECTION_TEMPLATES.find((t) => t.id === id) ?? null
}

export async function getInspections(
  filters: InspectionFilters = {}
): Promise<Inspection[]> {
  let inspections = [...MOCK_INSPECTIONS]

  if (filters.status) {
    inspections = inspections.filter((i) => i.status === filters.status)
  }
  if (filters.project_id) {
    inspections = inspections.filter((i) => i.project_id === filters.project_id)
  }
  if (filters.template_id) {
    inspections = inspections.filter(
      (i) => i.template_id === filters.template_id
    )
  }
  if (filters.conducted_by?.length) {
    inspections = inspections.filter((i) =>
      filters.conducted_by!.includes(i.conducted_by)
    )
  }
  if (filters.search) {
    const q = filters.search.toLowerCase()
    inspections = inspections.filter(
      (i) =>
        i.reference_number.toLowerCase().includes(q) ||
        (i.notes && i.notes.toLowerCase().includes(q))
    )
  }

  return inspections
}

export async function getInspectionById(
  id: string
): Promise<Inspection | null> {
  return MOCK_INSPECTIONS.find((i) => i.id === id) ?? null
}

export async function getInspectionResponses(
  inspectionId: string
): Promise<InspectionResponse[]> {
  return MOCK_INSPECTION_RESPONSES.filter(
    (r) => r.inspection_id === inspectionId
  )
}

// Distinct people who have conducted inspections, used to populate the
// "Conducted by" multi-select filter options.
export async function getInspectionConductors(): Promise<Profile[]> {
  const map = new Map<string, Profile>()
  for (const i of MOCK_INSPECTIONS) {
    if (i.conductor) map.set(i.conductor.id, i.conductor)
  }
  return [...map.values()].sort((a, b) =>
    (a.full_name ?? '').localeCompare(b.full_name ?? '')
  )
}
