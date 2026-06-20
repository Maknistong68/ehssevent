'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth/guards'
import type { OrgType, UserRole } from '@/types/enums'

export async function createOrganization(_input: {
  name: string
  org_type: OrgType
  contact_email?: string
}) {
  const auth = await requireAdmin()
  if (!auth.ok) return { error: auth.error }

  revalidatePath('/admin')
  return { success: true }
}

export async function updateUserProfile(_input: {
  user_id: string
  role?: UserRole
  organization_id?: string | null
  is_active?: boolean
}) {
  const auth = await requireAdmin()
  if (!auth.ok) return { error: auth.error }

  revalidatePath('/admin')
  return { success: true }
}
