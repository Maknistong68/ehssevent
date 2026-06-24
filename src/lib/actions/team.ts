'use server'

import { revalidatePath } from 'next/cache'
import { requirePermission } from '@/lib/auth/guards'
import { logAudit } from '@/lib/actions/audit'
import { createAdminClient } from '@/lib/supabase/admin'
import { env } from '@/lib/env'
import type { UserRole, UserStatus } from '@/types/enums'

export async function updateTeamMember(input: {
  user_id: string
  role?: UserRole
  status?: UserStatus
}) {
  const auth = await requirePermission('user:manage')
  if (!auth.ok) return { error: auth.error }

  const admin = createAdminClient()
  // Scope edits to the admin's own organization for non-platform admins.
  const { data: target } = await admin
    .from('profiles')
    .select('id, organization_id')
    .eq('id', input.user_id)
    .maybeSingle()
  if (!target) return { error: 'User not found' }
  if (
    auth.profile.organization_id &&
    target.organization_id !== auth.profile.organization_id
  ) {
    return { error: 'You can only manage members of your organization.' }
  }

  const patch: Record<string, unknown> = {}
  if (input.role) patch.role = input.role
  if (input.status) patch.status = input.status

  const { error } = await admin
    .from('profiles')
    .update(patch)
    .eq('id', input.user_id)
  if (error) return { error: error.message }

  revalidatePath('/team')
  return { success: true }
}

/**
 * Invite a member into the current admin's organization by email. Sends a
 * Supabase invitation; the created auth user yields a pending profile, which
 * we assign to the admin's org with the chosen role and mark `invited`.
 */
export async function inviteTeamMember(input: {
  email: string
  role: UserRole
}) {
  const auth = await requirePermission('user:manage')
  if (!auth.ok) return { error: auth.error }
  if (!auth.profile.organization_id) {
    return { error: 'You are not assigned to an organization.' }
  }

  const email = input.email.trim().toLowerCase()
  if (!email) return { error: 'An email address is required.' }

  const admin = createAdminClient()
  const { data: invited, error } =
    await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${env.NEXT_PUBLIC_APP_ORIGIN}/accept-invite`,
    })
  if (error || !invited?.user) {
    return { error: error?.message ?? 'Failed to invite member' }
  }

  const { error: profileError } = await admin
    .from('profiles')
    .update({
      role: input.role,
      organization_id: auth.profile.organization_id,
      status: 'invited',
    })
    .eq('id', invited.user.id)
  if (profileError) return { error: profileError.message }

  await logAudit({
    action: 'user.invite',
    target_table: 'profiles',
    target_id: invited.user.id,
    target_label: email,
    metadata: {
      role: input.role,
      organization_id: auth.profile.organization_id,
    },
  })

  revalidatePath('/team')
  return { success: true }
}

/**
 * Approve a pending self-signup user into the current admin's organization.
 */
export async function approveTeamMember(input: {
  user_id: string
  role: UserRole
}) {
  const auth = await requirePermission('user:manage')
  if (!auth.ok) return { error: auth.error }
  if (!auth.profile.organization_id) {
    return { error: 'You are not assigned to an organization.' }
  }

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('id, email')
    .eq('id', input.user_id)
    .maybeSingle()
  if (!profile) return { error: 'User not found' }

  const { error } = await admin
    .from('profiles')
    .update({
      role: input.role,
      organization_id: auth.profile.organization_id,
      status: 'active',
    })
    .eq('id', input.user_id)
  if (error) return { error: error.message }

  await logAudit({
    action: 'user.approve',
    target_table: 'profiles',
    target_id: input.user_id,
    target_label: (profile.email as string | null) ?? input.user_id,
    metadata: {
      role: input.role,
      organization_id: auth.profile.organization_id,
    },
  })

  revalidatePath('/team')
  return { success: true }
}
