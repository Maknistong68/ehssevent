import { MOCK_EVENTS, MOCK_EVENT_RESPONSES } from '@/lib/mock-data'
import type { Event, EventResponse } from '@/types/database'
import type {
  EventApprovalLevel,
  EventType,
  EventClassification,
} from '@/types/enums'

interface EventFilters {
  approval_level?: EventApprovalLevel
  type?: EventType
  classification?: EventClassification
  project_id?: string
  search?: string
}

export async function getEvents(filters: EventFilters = {}): Promise<Event[]> {
  let events = [...MOCK_EVENTS]

  if (filters.approval_level) {
    events = events.filter((e) => e.approval_level === filters.approval_level)
  }
  if (filters.type) {
    events = events.filter((e) => e.type === filters.type)
  }
  if (filters.classification) {
    events = events.filter((e) => e.classification === filters.classification)
  }
  if (filters.project_id) {
    events = events.filter((e) => e.project_id === filters.project_id)
  }
  if (filters.search) {
    const q = filters.search.toLowerCase()
    events = events.filter(
      (e) =>
        e.reference_number.toLowerCase().includes(q) ||
        (e.event_description && e.event_description.toLowerCase().includes(q)) ||
        (e.specific_area && e.specific_area.toLowerCase().includes(q))
    )
  }

  return events
}

export async function getEventById(id: string): Promise<Event | null> {
  return MOCK_EVENTS.find((e) => e.id === id) ?? null
}

export async function getEventResponses(eventId: string): Promise<EventResponse[]> {
  return MOCK_EVENT_RESPONSES.filter((r) => r.event_id === eventId)
}
