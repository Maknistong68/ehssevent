import { z } from 'zod'

export const notificationPreferencesSchema = z.object({
  ca_assigned: z.boolean(),
  ca_status: z.boolean(),
  event_stage: z.boolean(),
})

export const updateOrganizationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2, 'Organization name must be at least 2 characters'),
  contact_email: z
    .string()
    .email('Enter a valid email address')
    .optional()
    .or(z.literal('')),
})

export type NotificationPreferencesInput = z.infer<
  typeof notificationPreferencesSchema
>
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>
