import { z } from 'zod'

export const createCorrectiveActionSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  event_id: z.string().uuid().optional().or(z.literal('')),
  inspection_id: z.string().uuid().optional().or(z.literal('')),
  section_id: z.string().optional(),
  item_id: z.string().optional(),
  item_label: z.string().optional(),
  project_id: z.string().uuid().optional().or(z.literal('')),
  assigned_to: z
    .string()
    .uuid('Please select a responsible person')
    .optional()
    .or(z.literal('')),
  approver_id: z
    .string()
    .uuid('Please select an approver')
    .optional()
    .or(z.literal('')),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  due_date: z.string().optional(),
  photo_urls: z.array(z.string()).default([]),
})

export const updateCorrectiveActionStatusSchema = z.object({
  corrective_action_id: z.string().uuid(),
  status: z.enum([
    'open',
    'in_progress',
    'pending_approval',
    'approved',
    'rejected',
  ]),
  rejection_reason: z.string().optional(),
})

export type CreateCorrectiveActionInput = z.infer<
  typeof createCorrectiveActionSchema
>
export type UpdateCorrectiveActionStatusInput = z.infer<
  typeof updateCorrectiveActionStatusSchema
>
