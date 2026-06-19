import { z } from 'zod'

export const createProjectSchema = z.object({
  name: z.string().min(2, 'Project name must be at least 2 characters'),
  description: z.string().optional(),
  location: z.string().optional(),
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>
