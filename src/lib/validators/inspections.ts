import { z } from 'zod'

const templateItemSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1, 'Item label is required'),
  field_type: z.enum([
    'text',
    'yes_no',
    'pass_fail',
    'numeric',
    'photo',
    'dropdown',
    'compliance',
  ]),
  required: z.boolean().default(false),
  options: z.array(z.string().min(1)).nullable().default(null),
  order: z.number().int().min(0),
})

const templateSectionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1, 'Section title is required'),
  order: z.number().int().min(0),
  items: z
    .array(templateItemSchema)
    .min(1, 'Each section must have at least one item'),
})

export const createTemplateSchema = z.object({
  name: z.string().min(3, 'Template name must be at least 3 characters'),
  description: z.string().optional(),
  sections: z
    .array(templateSectionSchema)
    .min(1, 'Template must have at least one section'),
})

export const updateTemplateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(3, 'Template name must be at least 3 characters'),
  description: z.string().optional(),
  sections: z
    .array(templateSectionSchema)
    .min(1, 'Template must have at least one section'),
  is_active: z.boolean().optional(),
})

const inspectionResponseSchema = z.object({
  section_id: z.string().min(1),
  item_id: z.string().min(1),
  field_type: z.enum([
    'text',
    'yes_no',
    'pass_fail',
    'numeric',
    'photo',
    'dropdown',
    'compliance',
  ]),
  value: z.string().nullable().default(null),
  comment: z.string().nullable().default(null),
  observation: z.string().nullable().default(null),
  action_plan: z.string().nullable().default(null),
  photo_urls: z.array(z.string()).default([]),
})

export const submitInspectionSchema = z.object({
  template_id: z.string().uuid('Please select a template'),
  project_id: z.string().uuid('Please select a project'),
  notes: z.string().optional(),
  responses: z.array(inspectionResponseSchema),
  corrective_actions: z
    .array(
      z.object({
        section_id: z.string(),
        item_id: z.string(),
        item_label: z.string(),
        title: z.string().min(3),
        assigned_to: z.string().uuid(),
      })
    )
    .optional(),
})

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>
export type SubmitInspectionInput = z.infer<typeof submitInspectionSchema>
