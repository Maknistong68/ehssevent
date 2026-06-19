import { createClient } from '@/lib/supabase/server'
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

const SELECT_WITH_RELATIONS = `
  *,
  event:events!event_id(id, reference_number),
  inspection:inspections!inspection_id(id, reference_number),
  project:projects(id, name, location),
  creator:profiles!created_by(id, full_name, email),
  assignee:profiles!assigned_to(id, full_name, email),
  approver:profiles!approver_id(id, full_name, email)
`

export async function getCorrectiveActions(
  filters: CorrectiveActionFilters = {}
): Promise<CorrectiveAction[]> {
  const supabase = await createClient()

  let query = supabase
    .from('corrective_actions')
    .select(SELECT_WITH_RELATIONS)
    .order('created_at', { ascending: false })

  if (filters.status) {
    query = query.eq('status', filters.status)
  }
  if (filters.priority) {
    query = query.eq('priority', filters.priority)
  }
  if (filters.project_id) {
    query = query.eq('project_id', filters.project_id)
  }
  if (filters.event_id) {
    query = query.eq('event_id', filters.event_id)
  }
  if (filters.inspection_id) {
    query = query.eq('inspection_id', filters.inspection_id)
  }
  if (filters.search) {
    query = query.or(
      `title.ilike.%${filters.search}%,reference_number.ilike.%${filters.search}%`
    )
  }

  const { data, error } = await query

  if (error) return []
  return (data as unknown as CorrectiveAction[]) || []
}

export async function getCorrectiveActionById(
  id: string
): Promise<CorrectiveAction | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('corrective_actions')
    .select(SELECT_WITH_RELATIONS)
    .eq('id', id)
    .single()

  if (error) return null
  return data as unknown as CorrectiveAction
}

export async function getEventCorrectiveActions(
  eventId: string
): Promise<CorrectiveAction[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('corrective_actions')
    .select(SELECT_WITH_RELATIONS)
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })

  if (error) return []
  return (data as unknown as CorrectiveAction[]) || []
}

export async function getInspectionCorrectiveActions(
  inspectionId: string
): Promise<CorrectiveAction[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('corrective_actions')
    .select(SELECT_WITH_RELATIONS)
    .eq('inspection_id', inspectionId)
    .order('created_at', { ascending: false })

  if (error) return []
  return (data as unknown as CorrectiveAction[]) || []
}
