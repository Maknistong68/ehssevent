import { createClient } from '@/lib/supabase/server'
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

const TEMPLATE_SELECT = '*, creator:profiles(*)'
const INSPECTION_SELECT = `
  *,
  template:inspection_templates(*),
  project:projects(*),
  conductor:profiles(*)
`

export async function getTemplates(): Promise<InspectionTemplate[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('inspection_templates')
    .select(TEMPLATE_SELECT)
    .eq('is_active', true)
    .order('name', { ascending: true })
  if (error) return []
  return (data ?? []) as unknown as InspectionTemplate[]
}

export async function getAllTemplates(): Promise<InspectionTemplate[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('inspection_templates')
    .select(TEMPLATE_SELECT)
    .order('name', { ascending: true })
  if (error) return []
  return (data ?? []) as unknown as InspectionTemplate[]
}

export async function getTemplateById(
  id: string
): Promise<InspectionTemplate | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('inspection_templates')
    .select(TEMPLATE_SELECT)
    .eq('id', id)
    .maybeSingle()
  if (error) return null
  return (data as unknown as InspectionTemplate) ?? null
}

export async function getInspections(
  filters: InspectionFilters = {}
): Promise<Inspection[]> {
  const supabase = await createClient()
  let query = supabase
    .from('inspections')
    .select(INSPECTION_SELECT)
    .order('created_at', { ascending: false })

  if (filters.status) query = query.eq('status', filters.status)
  if (filters.project_id) query = query.eq('project_id', filters.project_id)
  if (filters.template_id) query = query.eq('template_id', filters.template_id)
  if (filters.conducted_by?.length)
    query = query.in('conducted_by', filters.conducted_by)
  if (filters.search) {
    const q = filters.search.replace(/[%,]/g, '')
    query = query.or(`reference_number.ilike.%${q}%,notes.ilike.%${q}%`)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as Inspection[]
}

export async function getInspectionById(
  id: string
): Promise<Inspection | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('inspections')
    .select(INSPECTION_SELECT)
    .eq('id', id)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return (data as unknown as Inspection) ?? null
}

export async function getInspectionResponses(
  inspectionId: string
): Promise<InspectionResponse[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('inspection_responses')
    .select('*')
    .eq('inspection_id', inspectionId)
  if (error) return []
  return (data ?? []) as unknown as InspectionResponse[]
}

// Distinct people who have conducted inspections, used to populate the
// "Conducted by" multi-select filter options.
export async function getInspectionConductors(): Promise<Profile[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('inspections')
    .select('conductor:profiles(*)')
  if (error) return []
  const map = new Map<string, Profile>()
  for (const row of (data ?? []) as unknown as {
    conductor: Profile | null
  }[]) {
    if (row.conductor) map.set(row.conductor.id, row.conductor)
  }
  return [...map.values()].sort((a, b) =>
    (a.full_name ?? '').localeCompare(b.full_name ?? '')
  )
}
