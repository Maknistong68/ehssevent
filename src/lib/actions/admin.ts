'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth/guards'
import { logAudit } from '@/lib/actions/audit'
import { ADMIN_ROLES, type OrgType, type UserRole } from '@/types/enums'

export async function createOrganization(input: {
  name: string
  org_type: OrgType
  contact_email?: string
}) {
  const auth = await requireAdmin()
  if (!auth.ok) return { error: auth.error }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('organizations')
    .insert({
      name: input.name,
      org_type: input.org_type,
      contact_email: input.contact_email || null,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  await logAudit({
    action: 'organization.create',
    target_table: 'organizations',
    target_id: data?.id ?? null,
    target_label: input.name,
    metadata: { org_type: input.org_type },
  })

  revalidatePath('/admin')
  return { success: true }
}

export async function updateUserProfile(input: {
  user_id: string
  role?: UserRole
  organization_id?: string | null
  is_active?: boolean
}) {
  const auth = await requireAdmin()
  if (!auth.ok) return { error: auth.error }
  const actor = auth.profile

  // Prevent admins from changing their own role or active status,
  // which avoids self-escalation and accidental self-lockout.
  if (input.user_id === actor.id && (input.role !== undefined || input.is_active !== undefined)) {
    return { error: 'You cannot change your own role or active status' }
  }

  // Only a system_admin may grant platform-admin roles.
  if (
    input.role !== undefined &&
    ADMIN_ROLES.includes(input.role) &&
    actor.role !== 'system_admin'
  ) {
    return { error: 'Only a system admin can assign admin roles' }
  }

  const supabase = await createClient()

  // Capture the prior values so the audit log records what changed.
  const { data: before } = await supabase
    .from('profiles')
    .select('email, role, organization_id, is_active')
    .eq('id', input.user_id)
    .single()

  const updateData: Record<string, unknown> = {}
  if (input.role !== undefined) updateData.role = input.role
  if (input.organization_id !== undefined) updateData.organization_id = input.organization_id
  if (input.is_active !== undefined) updateData.is_active = input.is_active

  const { error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', input.user_id)

  if (error) return { error: error.message }

  await logAudit({
    action: 'user.update',
    target_table: 'profiles',
    target_id: input.user_id,
    target_label: before?.email ?? null,
    metadata: {
      ...(input.role !== undefined && { role: { from: before?.role, to: input.role } }),
      ...(input.organization_id !== undefined && {
        organization_id: { from: before?.organization_id, to: input.organization_id },
      }),
      ...(input.is_active !== undefined && {
        is_active: { from: before?.is_active, to: input.is_active },
      }),
    },
  })

  revalidatePath('/admin')
  return { success: true }
}
