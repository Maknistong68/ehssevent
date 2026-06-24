import { createClient } from '@/lib/supabase/server'
import type { Event } from '@/types/database'
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
  site?: string
  date_from?: string
  date_to?: string
  search?: string
}

// Embedded relations matching the Event interface. The profiles table has
// several FKs from events (created_by, reviewer_id, …) so the creator join is
// disambiguated by the constraint name. Cross-org creator/org rows may resolve
// to null when RLS hides them — the UI already treats those as optional.
const EVENT_SELECT = `
  *,
  project:projects(*),
  creator:profiles!events_created_by_fkey(*),
  creator_organization:organizations!events_creator_org_id_fkey(*)
`

export async function getEvents(filters: EventFilters = {}): Promise<Event[]> {
  const supabase = await createClient()

  // RLS scopes the rows to the caller's organization (or all rows for platform
  // admins), so no app-side org filtering is needed here.
  let query = supabase
    .from('events')
    .select(EVENT_SELECT)
    .order('reported_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (filters.approval_level)
    query = query.eq('approval_level', filters.approval_level)
  if (filters.type) query = query.eq('type', filters.type)
  if (filters.classification)
    query = query.eq('classification', filters.classification)
  if (filters.project_id) query = query.eq('project_id', filters.project_id)
  if (filters.site) query = query.eq('site', filters.site)
  if (filters.date_from) query = query.gte('event_date', filters.date_from)
  if (filters.date_to)
    query = query.lte('event_date', `${filters.date_to}T23:59:59`)
  if (filters.search) {
    const q = filters.search.replace(/[%,]/g, '')
    query = query.or(
      `reference_number.ilike.%${q}%,event_description.ilike.%${q}%,specific_area.ilike.%${q}%`
    )
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as Event[]
}

export async function getEventById(id: string): Promise<Event | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('events')
    .select(EVENT_SELECT)
    .eq('id', id)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return (data as unknown as Event) ?? null
}
