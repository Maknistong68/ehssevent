import { createClient } from '@/lib/supabase/server'
import type { InspectionTemplate, Inspection, InspectionResponse } from '@/types/database'
import type { InspectionStatus } from '@/types/enums'

interface InspectionFilters {
  status?: InspectionStatus
  project_id?: string
  template_id?: string
  search?: string
}

export async function getTemplates(): Promise<InspectionTemplate[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('inspection_templates')
    .select(`
      *,
      creator:profiles!created_by(id, full_name, email)
    `)
    .eq('is_active', true)
    .order('name')

  if (error) return []
  return (data as unknown as InspectionTemplate[]) || []
}

export async function getAllTemplates(): Promise<InspectionTemplate[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('inspection_templates')
    .select(`
      *,
      creator:profiles!created_by(id, full_name, email)
    `)
    .order('name')

  if (error) return []
  return (data as unknown as InspectionTemplate[]) || []
}

export async function getTemplateById(id: string): Promise<InspectionTemplate | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('inspection_templates')
    .select(`
      *,
      creator:profiles!created_by(id, full_name, email)
    `)
    .eq('id', id)
    .single()

  if (error) return null
  return data as unknown as InspectionTemplate
}

export async function getInspections(filters: InspectionFilters = {}): Promise<Inspection[]> {
  const supabase = await createClient()

  let query = supabase
    .from('inspections')
    .select(`
      *,
      template:inspection_templates(id, name),
      project:projects(id, name, location),
      conductor:profiles!conducted_by(id, full_name, email)
    `)
    .order('created_at', { ascending: false })

  if (filters.status) {
    query = query.eq('status', filters.status)
  }
  if (filters.project_id) {
    query = query.eq('project_id', filters.project_id)
  }
  if (filters.template_id) {
    query = query.eq('template_id', filters.template_id)
  }
  if (filters.search) {
    query = query.or(`reference_number.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`)
  }

  const { data, error } = await query

  if (error) return []
  return (data as unknown as Inspection[]) || []
}

export async function getInspectionById(id: string): Promise<Inspection | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('inspections')
    .select(`
      *,
      template:inspection_templates(*),
      project:projects(id, name, location, client_org_id),
      conductor:profiles!conducted_by(id, full_name, email)
    `)
    .eq('id', id)
    .single()

  if (error) return null
  return data as unknown as Inspection
}

export async function getInspectionResponses(inspectionId: string): Promise<InspectionResponse[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('inspection_responses')
    .select('*')
    .eq('inspection_id', inspectionId)
    .order('created_at', { ascending: true })

  if (error) return []
  return (data as unknown as InspectionResponse[]) || []
}
