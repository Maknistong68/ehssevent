'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requirePermission } from '@/lib/auth/guards'
import { ADMIN_ROLES, type UserRole } from '@/types/enums'

/**
 * Updates a user profile within the caller's organization.
 * Only users with 'user:manage' permission (client_admin) can call this.
 * Cannot assign platform-admin roles (system_admin, support).
 */
export async function updateTeamMember(input: {
  user_id: string
  role?: UserRole
  is_active?: boolean
}) {
  const auth = await requirePermission('user:manage')
  if (!auth.ok) return { error: auth.error }
  const actor = auth.profile

  if (!actor.organization_id) {
    return { error: 'Your account is not associated with an organization' }
  }

  // Cannot modify own role or active status
  if (input.user_id === actor.id) {
    return { error: 'You cannot change your own role or active status' }
  }

  // client_admin cannot assign platform-admin roles
  if (input.role && ADMIN_ROLES.includes(input.role)) {
    return { error: 'You cannot assign admin roles' }
  }

  const supabase = await createClient()

  // Verify the target user belongs to the same organization
  const { data: target } = await supabase
    .from('profiles')
    .select('id, organization_id')
    .eq('id', input.user_id)
    .single()

  if (!target || target.organization_id !== actor.organization_id) {
    return { error: 'User not found in your organization' }
  }

  const updateData: Record<string, unknown> = {}
  if (input.role !== undefined) updateData.role = input.role
  if (input.is_active !== undefined) updateData.is_active = input.is_active

  const { error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', input.user_id)

  if (error) return { error: error.message }

  revalidatePath('/team')
  return { success: true }
}
