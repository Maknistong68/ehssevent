import { MOCK_CORRECTIVE_ACTIONS } from '@/lib/mock-data'
import type { CorrectiveAction } from '@/types/database'
import type {
  CorrectiveActionStatus,
  CorrectiveActionPriority,
} from '@/types/enums'

interface CorrectiveActionFilters {
  status?: CorrectiveActionStatus
  priority?: CorrectiveActionPriority
  project_id?: string
  event_id?: string
  inspection_id?: string
  search?: string
}

export async function getCorrectiveActions(
  filters: CorrectiveActionFilters = {}
): Promise<CorrectiveAction[]> {
  let cas = [...MOCK_CORRECTIVE_ACTIONS]

  if (filters.status) {
    cas = cas.filter((ca) => ca.status === filters.status)
  }
  if (filters.priority) {
    cas = cas.filter((ca) => ca.priority === filters.priority)
  }
  if (filters.project_id) {
    cas = cas.filter((ca) => ca.project_id === filters.project_id)
  }
  if (filters.event_id) {
    cas = cas.filter((ca) => ca.event_id === filters.event_id)
  }
  if (filters.inspection_id) {
    cas = cas.filter((ca) => ca.inspection_id === filters.inspection_id)
  }
  if (filters.search) {
    const q = filters.search.toLowerCase()
    cas = cas.filter(
      (ca) =>
        ca.title.toLowerCase().includes(q) ||
        ca.reference_number.toLowerCase().includes(q)
    )
  }

  return cas
}

export async function getCorrectiveActionById(
  id: string
): Promise<CorrectiveAction | null> {
  return MOCK_CORRECTIVE_ACTIONS.find((ca) => ca.id === id) ?? null
}

export async function getEventCorrectiveActions(
  eventId: string
): Promise<CorrectiveAction[]> {
  return MOCK_CORRECTIVE_ACTIONS.filter((ca) => ca.event_id === eventId)
}

export async function getInspectionCorrectiveActions(
  inspectionId: string
): Promise<CorrectiveAction[]> {
  return MOCK_CORRECTIVE_ACTIONS.filter((ca) => ca.inspection_id === inspectionId)
}
