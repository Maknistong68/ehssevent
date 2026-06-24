'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requirePermission } from '@/lib/auth/guards'
import {
  createTemplateSchema,
  updateTemplateSchema,
  submitInspectionSchema,
} from '@/lib/validators/inspections'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { COMPLIANCE_SCORE } from '@/types/enums'
import type { ComplianceValue } from '@/types/enums'
import { logAudit } from '@/lib/actions/audit'
import { resolveDefaultApprover } from '@/lib/queries/users'

export async function createTemplate(input: unknown) {
  const auth = await requirePermission('inspection:templates')
  if (!auth.ok) return { error: auth.error }
  if (!auth.profile.organization_id) {
    return { error: 'Your account is not assigned to an organization' }
  }

  const parsed = createTemplateSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { data: template, error } = await supabase
    .from('inspection_templates')
    .insert({
      organization_id: auth.profile.organization_id,
      name: parsed.data.name,
      description: parsed.data.description || null,
      sections: parsed.data.sections,
      is_active: true,
      created_by: auth.profile.id,
    })
    .select('id, name')
    .single()
  if (error || !template) {
    return { error: error?.message ?? 'Failed to create template' }
  }

  await logAudit({
    action: 'inspection_template.create',
    target_table: 'inspection_templates',
    target_id: template.id as string,
    target_label: template.name as string,
    metadata: { sections: parsed.data.sections.length },
  })

  revalidatePath('/inspections/templates')
  redirect('/inspections/templates')
}

export async function updateTemplate(input: unknown) {
  const auth = await requirePermission('inspection:templates')
  if (!auth.ok) return { error: auth.error }

  const parsed = updateTemplateSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const patch: Record<string, unknown> = {
    name: parsed.data.name,
    description: parsed.data.description || null,
    sections: parsed.data.sections,
  }
  if (parsed.data.is_active !== undefined) {
    patch.is_active = parsed.data.is_active
  }

  const { data: template, error } = await supabase
    .from('inspection_templates')
    .update(patch)
    .eq('id', parsed.data.id)
    .select('id, name')
    .maybeSingle()
  if (error) return { error: error.message }
  if (!template) return { error: 'Template not found' }

  await logAudit({
    action: 'inspection_template.update',
    target_table: 'inspection_templates',
    target_id: template.id as string,
    target_label: template.name as string,
  })

  revalidatePath('/inspections/templates')
  revalidatePath(`/inspections/templates/${parsed.data.id}`)

  return { success: true }
}

export async function toggleTemplateActive(templateId: string) {
  const auth = await requirePermission('inspection:templates')
  if (!auth.ok) return { error: auth.error }

  const supabase = await createClient()
  const { data: current } = await supabase
    .from('inspection_templates')
    .select('id, name, is_active')
    .eq('id', templateId)
    .maybeSingle()
  if (!current) return { error: 'Template not found' }

  const { error } = await supabase
    .from('inspection_templates')
    .update({ is_active: !current.is_active })
    .eq('id', templateId)
  if (error) return { error: error.message }

  await logAudit({
    action: 'inspection_template.toggle_active',
    target_table: 'inspection_templates',
    target_id: current.id as string,
    target_label: current.name as string,
    metadata: { is_active: !current.is_active },
  })

  revalidatePath('/inspections/templates')
  revalidatePath(`/inspections/templates/${templateId}`)

  return { success: true }
}

export async function submitInspection(input: unknown) {
  const auth = await requirePermission('inspection:conduct')
  if (!auth.ok) return { error: auth.error }
  if (!auth.profile.organization_id) {
    return { error: 'Your account is not assigned to an organization' }
  }

  const parsed = submitInspectionSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { template_id, project_id, notes, responses, corrective_actions } =
    parsed.data

  const supabase = await createClient()

  // Enforce that the inspection is complete: every required item must be
  // answered before the record can be saved.
  const { data: submitTemplate } = await supabase
    .from('inspection_templates')
    .select('sections')
    .eq('id', template_id)
    .maybeSingle()
  if (submitTemplate) {
    const isAnswered = (sectionId: string, itemId: string) => {
      const resp = responses.find(
        (r) => r.section_id === sectionId && r.item_id === itemId
      )
      if (!resp) return false
      if (resp.field_type === 'photo') return resp.photo_urls.length > 0
      return !!(resp.value && resp.value.trim() !== '')
    }
    const sections = (submitTemplate.sections ?? []) as {
      id: string
      items: { id: string; required: boolean }[]
    }[]
    const missing = sections
      .flatMap((s) => s.items.map((i) => ({ section: s, item: i })))
      .filter(
        ({ section, item }) => item.required && !isAnswered(section.id, item.id)
      )
    if (missing.length > 0) {
      return {
        error: `Inspection is incomplete: ${missing.length} required item(s) need a response.`,
      }
    }
  }

  const admin = createAdminClient()
  const year = new Date().getFullYear()
  const { count: inspCount } = await admin
    .from('inspections')
    .select('id', { count: 'exact', head: true })
  const refNum = `INS-${year}-${String((inspCount ?? 0) + 1).padStart(3, '0')}`

  // Calculate compliance score
  let scorableItems = 0
  let compliantScore = 0
  for (const resp of responses) {
    if (resp.field_type === 'compliance' && resp.value) {
      const score = COMPLIANCE_SCORE[resp.value as ComplianceValue]
      if (score !== null && score !== undefined) {
        scorableItems++
        compliantScore += score
      }
    }
  }
  const score =
    scorableItems > 0 ? (compliantScore / scorableItems) * 100 : null
  const compliantItems = responses.filter(
    (r) => r.field_type === 'compliance' && r.value === 'fully_compliant'
  ).length

  // Create inspection record
  const { data: inspection, error: inspError } = await supabase
    .from('inspections')
    .insert({
      reference_number: refNum,
      template_id,
      project_id,
      organization_id: auth.profile.organization_id,
      conducted_by: auth.profile.id,
      status: 'completed',
      score,
      total_items: responses.length,
      scorable_items: scorableItems,
      compliant_items: compliantItems,
      notes: notes || null,
      completed_at: new Date().toISOString(),
    })
    .select('id')
    .single()
  if (inspError || !inspection) {
    return { error: inspError?.message ?? 'Failed to save inspection' }
  }
  const inspectionId = inspection.id as string

  // Create response records
  if (responses.length > 0) {
    const { error: respError } = await supabase
      .from('inspection_responses')
      .insert(
        responses.map((resp) => ({
          inspection_id: inspectionId,
          section_id: resp.section_id,
          item_id: resp.item_id,
          field_type: resp.field_type,
          value: resp.value,
          comment: resp.comment ?? null,
          photo_urls: resp.photo_urls,
        }))
      )
    if (respError) return { error: respError.message }
  }

  // Create corrective actions for non-compliant items
  if (corrective_actions && corrective_actions.length > 0) {
    // Segregation of duties: prefer a separate approver-capable colleague over
    // the inspector, falling back to the inspector only if none exists.
    const approver = await resolveDefaultApprover(
      auth.profile.id,
      auth.profile.organization_id
    )
    const approverId = approver?.id ?? auth.profile.id

    const { count: caCount } = await admin
      .from('corrective_actions')
      .select('id', { count: 'exact', head: true })
    const baseSeq = caCount ?? 0

    const rows = corrective_actions.map((ca, index) => ({
      reference_number: `CA-${year}-${String(baseSeq + index + 1).padStart(3, '0')}`,
      event_id: null,
      inspection_id: inspectionId,
      section_id: ca.section_id,
      item_id: ca.item_id,
      item_label: ca.item_label,
      project_id,
      created_by: auth.profile.id,
      creator_org_id: auth.profile.organization_id,
      assigned_to: ca.assigned_to,
      approver_id: approverId,
      title: ca.title,
      description: ca.description?.trim()
        ? ca.description
        : `Corrective action for inspection item: ${ca.item_label}`,
      priority: ca.priority ?? 'medium',
      status: 'open' as const,
      due_date: ca.due_date?.trim()
        ? ca.due_date
        : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    }))
    const { error: caError } = await supabase
      .from('corrective_actions')
      .insert(rows)
    if (caError) return { error: caError.message }
  }

  await logAudit({
    action: 'inspection.complete',
    target_table: 'inspections',
    target_id: inspectionId,
    target_label: refNum,
    metadata: { score, total_items: responses.length },
  })

  revalidatePath('/inspections')
  revalidatePath('/corrective-actions')
  revalidatePath('/dashboard')
  redirect('/inspections')
}
