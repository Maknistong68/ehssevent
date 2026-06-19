import { createClient } from '@/lib/supabase/server'
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
  const supabase = await createClient()

  let query = supabase
    .from('events')
    .select(`
      *,
      project:projects(id, name, location),
      creator:profiles!created_by(id, full_name, email),
      creator_organization:organizations!creator_org_id(id, name)
    `)
    .order('created_at', { ascending: false })

  if (filters.approval_level) {
    query = query.eq('approval_level', filters.approval_level)
  }
  if (filters.type) {
    query = query.eq('type', filters.type)
  }
  if (filters.classification) {
    query = query.eq('classification', filters.classification)
  }
  if (filters.project_id) {
    query = query.eq('project_id', filters.project_id)
  }
  if (filters.search) {
    query = query.or(
      `reference_number.ilike.%${filters.search}%,event_description.ilike.%${filters.search}%,specific_area.ilike.%${filters.search}%`
    )
  }

  const { data, error } = await query

  if (error) return []
  return (data as unknown as Event[]) || []
}

export async function getEventById(id: string): Promise<Event | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      project:projects(id, name, location, client_org_id),
      creator:profiles!created_by(id, full_name, email),
      creator_organization:organizations!creator_org_id(id, name)
    `)
    .eq('id', id)
    .single()

  if (error) return null
  return data as unknown as Event
}

export async function getEventResponses(eventId: string): Promise<EventResponse[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('event_responses')
    .select(`
      *,
      responder:profiles!responded_by(id, full_name, email),
      responder_organization:organizations!responder_org_id(id, name)
    `)
    .eq('event_id', eventId)
    .order('created_at', { ascending: true })

  if (error) return []
  return (data as unknown as EventResponse[]) || []
}
