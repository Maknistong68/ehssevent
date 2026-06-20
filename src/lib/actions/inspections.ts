'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requirePermission } from '@/lib/auth/guards'
import {
  createTemplateSchema,
  updateTemplateSchema,
  submitInspectionSchema,
} from '@/lib/validators/inspections'
import { COMPLIANCE_SCORE, type ComplianceValue } from '@/types/enums'

export async function createTemplate(input: unknown) {
  const auth = await requirePermission('inspection:templates')
  if (!auth.ok) return { error: auth.error }

  const parsed = createTemplateSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  if (!auth.profile.organization_id) {
    return { error: 'Your account is not associated with an organization' }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('inspection_templates')
    .insert({
      name: parsed.data.name,
      description: parsed.data.description || null,
      sections: parsed.data.sections,
      organization_id: auth.profile.organization_id,
      created_by: auth.profile.id,
    })
    .select('id')
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/inspections/templates')
  redirect(`/inspections/templates/${data.id}`)
}

export async function updateTemplate(input: unknown) {
  const auth = await requirePermission('inspection:templates')
  if (!auth.ok) return { error: auth.error }

  const supabase = await createClient()

  const parsed = updateTemplateSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const updateData: Record<string, unknown> = {
    name: parsed.data.name,
    description: parsed.data.description || null,
    sections: parsed.data.sections,
  }

  if (parsed.data.is_active !== undefined) {
    updateData.is_active = parsed.data.is_active
  }

  const { error } = await supabase
    .from('inspection_templates')
    .update(updateData)
    .eq('id', parsed.data.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/inspections/templates')
  revalidatePath(`/inspections/templates/${parsed.data.id}`)

  return { success: true }
}

export async function toggleTemplateActive(templateId: string) {
  const auth = await requirePermission('inspection:templates')
  if (!auth.ok) return { error: auth.error }

  const supabase = await createClient()

  // Get current state
  const { data: template } = await supabase
    .from('inspection_templates')
    .select('is_active')
    .eq('id', templateId)
    .single()

  if (!template) {
    return { error: 'Template not found' }
  }

  const { error } = await supabase
    .from('inspection_templates')
    .update({ is_active: !template.is_active })
    .eq('id', templateId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/inspections/templates')
  revalidatePath(`/inspections/templates/${templateId}`)

  return { success: true }
}

export async function submitInspection(input: unknown) {
  const auth = await requirePermission('inspection:conduct')
  if (!auth.ok) return { error: auth.error }

  const supabase = await createClient()

  const parsed = submitInspectionSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  if (!auth.profile.organization_id) {
    return { error: 'Your account is not associated with an organization' }
  }

  // Fetch template to validate and compute score
  const { data: template } = await supabase
    .from('inspection_templates')
    .select('sections')
    .eq('id', parsed.data.template_id)
    .single()

  if (!template) {
    return { error: 'Template not found' }
  }

  const sections = template.sections as { id: string; items: { id: string; field_type: string; required: boolean }[] }[]

  // Validate required fields
  for (const section of sections) {
    for (const item of section.items) {
      if (item.required) {
        const response = parsed.data.responses.find(
          (r) => r.section_id === section.id && r.item_id === item.id
        )
        if (item.field_type === 'photo') {
          if (!response || response.photo_urls.length === 0) {
            return { error: `A required photo field has no photos uploaded` }
          }
        } else if (!response?.value) {
          return { error: `A required field is missing a response` }
        }
      }
    }
  }

  // Compute score.
  // Only `compliance` items are scored. Each scored item is auto equal-weighted,
  // so the score is the average attained fraction across applicable items
  // (Not Applicable answers are excluded and the denominator re-normalises).
  let totalItems = 0
  let scorableItems = 0
  let compliantItems = 0
  let attainedFraction = 0

  for (const section of sections) {
    for (const item of section.items) {
      totalItems++
      if (item.field_type === 'compliance') {
        const response = parsed.data.responses.find(
          (r) => r.section_id === section.id && r.item_id === item.id
        )
        const value = response?.value as ComplianceValue | undefined
        if (!value) continue
        const fraction = COMPLIANCE_SCORE[value]
        // not_applicable (null) is excluded from scoring entirely
        if (fraction === null || fraction === undefined) continue
        scorableItems++
        attainedFraction += fraction
        if (value === 'fully_compliant') {
          compliantItems++
        }
      }
    }
  }

  const score = scorableItems > 0 ? (attainedFraction / scorableItems) * 100 : null

  // Insert inspection
  const { data: inspection, error: inspectionError } = await supabase
    .from('inspections')
    .insert({
      template_id: parsed.data.template_id,
      project_id: parsed.data.project_id,
      organization_id: auth.profile.organization_id,
      conducted_by: auth.profile.id,
      status: 'completed',
      score: score !== null ? Math.round(score * 100) / 100 : null,
      total_items: totalItems,
      scorable_items: scorableItems,
      compliant_items: compliantItems,
      notes: parsed.data.notes || null,
      completed_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (inspectionError) {
    return { error: inspectionError.message }
  }

  // Bulk insert responses
  const responseRows = parsed.data.responses.map((r) => ({
    inspection_id: inspection.id,
    section_id: r.section_id,
    item_id: r.item_id,
    field_type: r.field_type,
    value: r.value,
    photo_urls: r.photo_urls,
  }))

  if (responseRows.length > 0) {
    const { error: responsesError } = await supabase
      .from('inspection_responses')
      .insert(responseRows)

    if (responsesError) {
      return { error: responsesError.message }
    }
  }

  revalidatePath('/inspections')
  revalidatePath('/dashboard')
  redirect(`/inspections/${inspection.id}`)
}
