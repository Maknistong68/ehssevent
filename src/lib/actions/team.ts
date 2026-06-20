'use server'

import { revalidatePath } from 'next/cache'
import { requirePermission } from '@/lib/auth/guards'
import type { UserRole } from '@/types/enums'

export async function updateTeamMember(_input: {
  user_id: string
  role?: UserRole
  is_active?: boolean
}) {
  const auth = await requirePermission('user:manage')
  if (!auth.ok) return { error: auth.error }

  revalidatePath('/team')
  return { success: true }
}
