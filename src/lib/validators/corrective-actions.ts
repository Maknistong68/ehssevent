import { z } from 'zod'

export const createCorrectiveActionSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  event_id: z.string().uuid().optional().or(z.literal('')),
  inspection_id: z.string().uuid().optional().or(z.literal('')),
  section_id: z.string().optional(),
  item_id: z.string().optional(),
  item_label: z.string().optional(),
  assigned_to: z.string().uuid('Please select a responsible person'),
})

export const updateCorrectiveActionStatusSchema = z.object({
  corrective_action_id: z.string().uuid(),
  status: z.enum(['pending_approval', 'approved', 'rejected']),
  rejection_reason: z.string().optional(),
  photo_urls: z.array(z.string()).optional(),
})

export type CreateCorrectiveActionInput = z.infer<
  typeof createCorrectiveActionSchema
>
export type UpdateCorrectiveActionStatusInput = z.infer<
  typeof updateCorrectiveActionStatusSchema
>
