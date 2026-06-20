import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const signupSchema = z
  .object({
    email: z.string().email('Please enter a valid email address'),
    full_name: z.string().min(2, 'Full name must be at least 2 characters'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirm_password: z.string(),
    // PDPL consent must be provable: the controller has to record that the
    // user accepted, and which policy version they accepted.
    terms_accepted: z.boolean(),
    privacy_accepted: z.boolean(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  })
  .refine((data) => data.terms_accepted === true, {
    message: 'You must accept the Terms of Service',
    path: ['terms_accepted'],
  })
  .refine((data) => data.privacy_accepted === true, {
    message: 'You must accept the Privacy Policy (PDPL)',
    path: ['privacy_accepted'],
  })

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

export type LoginInput = z.infer<typeof loginSchema>
export type SignupInput = z.infer<typeof signupSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
