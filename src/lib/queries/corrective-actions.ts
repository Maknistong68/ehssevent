import { createClient } from '@/lib/supabase/server'
import { isCorrectiveActionOverdue } from '@/lib/utils/corrective-actions'
import type { CorrectiveAction, Profile } from '@/types/database'
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
  created_by?: string[]
  assigned_to?: string[]
  overdue?: boolean
  date_from?: string
  date_to?: string
  search?: string
}

// corrective_actions has three FKs into profiles (created_by, assigned_to,
// approver_id) so each embed is disambiguated by its constraint name.
const CA_SELECT = `
  *,
  event:events(*),
  inspection:inspections(id, reference_number),
  project:projects(*),
  creator:profiles!corrective_actions_created_by_fkey(*),
  assignee:profiles!corrective_actions_assigned_to_fkey(*),
  approver:profiles!corrective_actions_approver_id_fkey(*)
`

export async function getCorrectiveActions(
  filters: CorrectiveActionFilters = {}
): Promise<CorrectiveAction[]> {
  const supabase = await createClient()
  let query = supabase
    .from('corrective_actions')
    .select(CA_SELECT)
    .order('created_at', { ascending: false })

  if (filters.status) query = query.eq('status', filters.status)
  if (filters.priority) query = query.eq('priority', filters.priority)
  if (filters.project_id) query = query.eq('project_id', filters.project_id)
  if (filters.event_id) query = query.eq('event_id', filters.event_id)
  if (filters.inspection_id)
    query = query.eq('inspection_id', filters.inspection_id)
  if (filters.created_by?.length)
    query = query.in('created_by', filters.created_by)
  if (filters.assigned_to?.length)
    query = query.in('assigned_to', filters.assigned_to)
  if (filters.date_from) query = query.gte('created_at', filters.date_from)
  if (filters.date_to)
    query = query.lte('created_at', `${filters.date_to}T23:59:59`)
  if (filters.search) {
    const q = filters.search.replace(/[%,]/g, '')
    query = query.or(`title.ilike.%${q}%,reference_number.ilike.%${q}%`)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  let cas = (data ?? []) as unknown as CorrectiveAction[]

  // Overdue depends on due_date + status, evaluated in app code.
  if (filters.overdue) cas = cas.filter((ca) => isCorrectiveActionOverdue(ca))
  return cas
}

export async function getCorrectiveActionById(
  id: string
): Promise<CorrectiveAction | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('corrective_actions')
    .select(CA_SELECT)
    .eq('id', id)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return (data as unknown as CorrectiveAction) ?? null
}

export async function getEventCorrectiveActions(
  eventId: string
): Promise<CorrectiveAction[]> {
  return getCorrectiveActions({ event_id: eventId })
}

export async function getInspectionCorrectiveActions(
  inspectionId: string
): Promise<CorrectiveAction[]> {
  return getCorrectiveActions({ inspection_id: inspectionId })
}

const byFullName = (a: Profile, b: Profile) =>
  (a.full_name ?? '').localeCompare(b.full_name ?? '')

// Distinct creators and assignees actually present on corrective actions, used
// to populate the multi-select filter options.
export async function getCorrectiveActionPeople(): Promise<{
  creators: Profile[]
  assignees: Profile[]
}> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('corrective_actions').select(
    `creator:profiles!corrective_actions_created_by_fkey(*),
       assignee:profiles!corrective_actions_assigned_to_fkey(*)`
  )
  if (error) return { creators: [], assignees: [] }

  const creators = new Map<string, Profile>()
  const assignees = new Map<string, Profile>()
  for (const row of (data ?? []) as unknown as {
    creator: Profile | null
    assignee: Profile | null
  }[]) {
    if (row.creator) creators.set(row.creator.id, row.creator)
    if (row.assignee) assignees.set(row.assignee.id, row.assignee)
  }
  return {
    creators: [...creators.values()].sort(byFullName),
    assignees: [...assignees.values()].sort(byFullName),
  }
}
