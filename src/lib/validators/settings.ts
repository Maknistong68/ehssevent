import { z } from 'zod'

export const notificationPreferencesSchema = z.object({
  email_enabled: z.boolean(),
  ca_assigned: z.boolean(),
  ca_status: z.boolean(),
  event_stage: z.boolean(),
  deadlines: z.boolean(),
})

export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, 'Current password is required'),
    new_password: z
      .string()
      .min(8, 'New password must be at least 8 characters'),
    confirm_password: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
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
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>
