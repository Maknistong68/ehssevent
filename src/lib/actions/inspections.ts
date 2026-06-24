'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requirePermission } from '@/lib/auth/guards'
import {
  createTemplateSchema,
  updateTemplateSchema,
  submitInspectionSchema,
} from '@/lib/validators/inspections'
import {
  MOCK_USER_ID,
  MOCK_INSPECTIONS,
  MOCK_INSPECTION_RESPONSES,
  MOCK_CORRECTIVE_ACTIONS,
  MOCK_CURRENT_USER,
  MOCK_PROJECTS,
  MOCK_INSPECTION_TEMPLATES,
  MOCK_PROFILES,
} from '@/lib/mock-data'
import { COMPLIANCE_SCORE } from '@/types/enums'
import type { ComplianceValue } from '@/types/enums'
import type {
  Inspection,
  InspectionResponse,
  CorrectiveAction,
  Event,
  InspectionTemplate,
} from '@/types/database'
import { logAudit } from '@/lib/actions/audit'
import { resolveDefaultApprover } from '@/lib/queries/users'
import { randomUUID } from 'crypto'

export async function createTemplate(input: unknown) {
  const auth = await requirePermission('inspection:templates')
  if (!auth.ok) return { error: auth.error }

  const parsed = createTemplateSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const now = new Date().toISOString()
  const template: InspectionTemplate = {
    id: randomUUID(),
    organization_id: MOCK_CURRENT_USER.organization_id || '',
    name: parsed.data.name,
    description: parsed.data.description || null,
    sections: parsed.data.sections,
    is_active: true,
    created_by: MOCK_USER_ID,
    created_at: now,
    updated_at: now,
    creator: MOCK_CURRENT_USER,
  }
  MOCK_INSPECTION_TEMPLATES.push(template)

  await logAudit({
    action: 'inspection_template.create',
    target_table: 'inspection_templates',
    target_id: template.id,
    target_label: template.name,
    metadata: { sections: template.sections.length },
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

  const template = MOCK_INSPECTION_TEMPLATES.find(
    (t) => t.id === parsed.data.id
  )
  if (!template) return { error: 'Template not found' }

  template.name = parsed.data.name
  template.description = parsed.data.description || null
  template.sections = parsed.data.sections
  if (parsed.data.is_active !== undefined) {
    template.is_active = parsed.data.is_active
  }
  template.updated_at = new Date().toISOString()

  await logAudit({
    action: 'inspection_template.update',
    target_table: 'inspection_templates',
    target_id: template.id,
    target_label: template.name,
  })

  revalidatePath('/inspections/templates')
  revalidatePath(`/inspections/templates/${parsed.data.id}`)

  return { success: true }
}

export async function toggleTemplateActive(templateId: string) {
  const auth = await requirePermission('inspection:templates')
  if (!auth.ok) return { error: auth.error }

  const template = MOCK_INSPECTION_TEMPLATES.find((t) => t.id === templateId)
  if (!template) return { error: 'Template not found' }

  template.is_active = !template.is_active
  template.updated_at = new Date().toISOString()

  await logAudit({
    action: 'inspection_template.toggle_active',
    target_table: 'inspection_templates',
    target_id: template.id,
    target_label: template.name,
    metadata: { is_active: template.is_active },
  })

  revalidatePath('/inspections/templates')
  revalidatePath(`/inspections/templates/${templateId}`)

  return { success: true }
}

export async function submitInspection(input: unknown) {
  const auth = await requirePermission('inspection:conduct')
  if (!auth.ok) return { error: auth.error }

  const parsed = submitInspectionSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { template_id, project_id, notes, responses, corrective_actions } =
    parsed.data

  // Enforce that the inspection is complete: every required item must be
  // answered before the record can be saved.
  const submitTemplate = MOCK_INSPECTION_TEMPLATES.find(
    (t) => t.id === template_id
  )
  if (submitTemplate) {
    const isAnswered = (sectionId: string, itemId: string) => {
      const resp = responses.find(
        (r) => r.section_id === sectionId && r.item_id === itemId
      )
      if (!resp) return false
      if (resp.field_type === 'photo') return resp.photo_urls.length > 0
      return !!(resp.value && resp.value.trim() !== '')
    }
    const missing = submitTemplate.sections
      .flatMap((s) => s.items.map((i) => ({ section: s, item: i })))
      .filter(({ section, item }) => item.required && !isAnswered(section.id, item.id))
    if (missing.length > 0) {
      return {
        error: `Inspection is incomplete: ${missing.length} required item(s) need a response.`,
      }
    }
  }

  const inspectionId = randomUUID()
  const now = new Date().toISOString()
  const refNum = `INS-${new Date().getFullYear()}-${String(MOCK_INSPECTIONS.length + 1).padStart(3, '0')}`

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

  const template = MOCK_INSPECTION_TEMPLATES.find((t) => t.id === template_id)
  const project = MOCK_PROJECTS.find((p) => p.id === project_id)

  // Create inspection record
  const inspection: Inspection = {
    id: inspectionId,
    reference_number: refNum,
    template_id,
    project_id,
    organization_id: MOCK_CURRENT_USER.organization_id || '',
    conducted_by: MOCK_USER_ID,
    status: 'completed',
    score,
    total_items: responses.length,
    scorable_items: scorableItems,
    compliant_items: compliantItems,
    notes: notes || null,
    completed_at: now,
    created_at: now,
    updated_at: now,
    template: template || undefined,
    project: project || undefined,
    conductor: {
      id: MOCK_USER_ID,
      username: MOCK_CURRENT_USER.username,
      email: MOCK_CURRENT_USER.email,
      full_name: MOCK_CURRENT_USER.full_name,
      role: MOCK_CURRENT_USER.role,
      organization_id: MOCK_CURRENT_USER.organization_id,
      status: 'active',
      terms_accepted_at: null,
      privacy_accepted_at: null,
      terms_version: null,
      privacy_version: null,
      created_at: MOCK_CURRENT_USER.created_at,
      updated_at: MOCK_CURRENT_USER.updated_at,
    },
  }
  MOCK_INSPECTIONS.push(inspection)

  // Create response records
  for (const resp of responses) {
    const responseRecord: InspectionResponse = {
      id: randomUUID(),
      inspection_id: inspectionId,
      section_id: resp.section_id,
      item_id: resp.item_id,
      field_type: resp.field_type,
      value: resp.value,
      comment: resp.comment ?? null,
      photo_urls: resp.photo_urls,
      created_at: now,
    }
    MOCK_INSPECTION_RESPONSES.push(responseRecord)
  }

  // Create corrective actions for non-compliant items
  if (corrective_actions && corrective_actions.length > 0) {
    // Segregation of duties: prefer a separate approver-capable colleague over
    // the inspector, falling back to the inspector only if none exists.
    const caApprover =
      resolveDefaultApprover(
        MOCK_USER_ID,
        MOCK_CURRENT_USER.organization_id ?? null
      ) ?? MOCK_CURRENT_USER
    for (const ca of corrective_actions) {
      const caId = randomUUID()
      const caRefNum = `CA-${new Date().getFullYear()}-${String(MOCK_CORRECTIVE_ACTIONS.length + 1).padStart(3, '0')}`
      const assignee = MOCK_PROFILES.find((p) => p.id === ca.assigned_to)

      const caRecord: CorrectiveAction = {
        id: caId,
        reference_number: caRefNum,
        event_id: null,
        inspection_id: inspectionId,
        section_id: ca.section_id,
        item_id: ca.item_id,
        item_label: ca.item_label,
        project_id,
        created_by: MOCK_USER_ID,
        creator_org_id: MOCK_CURRENT_USER.organization_id || '',
        assigned_to: ca.assigned_to,
        approver_id: caApprover.id,
        title: ca.title,
        description: ca.description?.trim()
          ? ca.description
          : `Corrective action for inspection item: ${ca.item_label}`,
        priority: ca.priority ?? 'medium',
        status: 'open',
        due_date: ca.due_date?.trim()
          ? ca.due_date
          : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        photo_urls: [],
        completed_at: null,
        approved_at: null,
        rejection_reason: null,
        created_at: now,
        updated_at: now,
        inspection: { id: inspectionId, reference_number: refNum },
        project: project || undefined,
        creator: MOCK_CURRENT_USER,
        assignee: assignee || undefined,
        approver: caApprover,
      }
      MOCK_CORRECTIVE_ACTIONS.push(caRecord)
    }
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
