'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth/guards'
import { logAudit } from '@/lib/actions/audit'
import { createAdminClient } from '@/lib/supabase/admin'
import { env } from '@/lib/env'
import type { OrgType, UserRole, UserStatus } from '@/types/enums'

export async function createOrganization(input: {
  name: string
  org_type: OrgType
  contact_email?: string
}) {
  const auth = await requireAdmin()
  if (!auth.ok) return { error: auth.error }

  const admin = createAdminClient()
  const { data: org, error } = await admin
    .from('organizations')
    .insert({
      name: input.name,
      org_type: input.org_type,
      contact_email: input.contact_email || null,
    })
    .select('id, name')
    .single()
  if (error || !org) {
    return { error: error?.message ?? 'Failed to create organization' }
  }

  await logAudit({
    action: 'organization.create',
    target_table: 'organizations',
    target_id: org.id as string,
    target_label: org.name as string,
    metadata: { org_type: input.org_type },
  })

  revalidatePath('/admin')
  return { success: true }
}

export async function updateUserProfile(input: {
  user_id: string
  role?: UserRole
  organization_id?: string | null
  status?: UserStatus
}) {
  const auth = await requireAdmin()
  if (!auth.ok) return { error: auth.error }

  const admin = createAdminClient()
  const { data: before } = await admin
    .from('profiles')
    .select('email, role, organization_id, status')
    .eq('id', input.user_id)
    .maybeSingle()
  if (!before) return { error: 'User not found' }

  const patch: Record<string, unknown> = {}
  if (input.role) patch.role = input.role
  if (input.organization_id !== undefined)
    patch.organization_id = input.organization_id
  if (input.status) patch.status = input.status

  const { error } = await admin
    .from('profiles')
    .update(patch)
    .eq('id', input.user_id)
  if (error) return { error: error.message }

  await logAudit({
    action: 'user.update',
    target_table: 'profiles',
    target_id: input.user_id,
    target_label: (before.email as string | null) ?? input.user_id,
    metadata: {
      from: {
        role: before.role,
        organization_id: before.organization_id,
        status: before.status,
      },
      to: {
        role: patch.role ?? before.role,
        organization_id:
          patch.organization_id !== undefined
            ? patch.organization_id
            : before.organization_id,
        status: patch.status ?? before.status,
      },
    },
  })

  revalidatePath('/admin')
  return { success: true }
}

/**
 * Invite a new user by email. Sends a Supabase invitation (built-in email);
 * the new auth user triggers a pending profile, which we then assign the given
 * role/organization and mark `invited` until they accept.
 */
export async function inviteUser(input: {
  email: string
  role: UserRole
  organization_id?: string | null
}) {
  const auth = await requireAdmin()
  if (!auth.ok) return { error: auth.error }

  const email = input.email.trim().toLowerCase()
  if (!email) return { error: 'An email address is required.' }

  const admin = createAdminClient()
  const { data: invited, error } =
    await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${env.NEXT_PUBLIC_APP_ORIGIN}/accept-invite`,
    })
  if (error || !invited?.user) {
    return { error: error?.message ?? 'Failed to invite user' }
  }

  const { error: profileError } = await admin
    .from('profiles')
    .update({
      role: input.role,
      organization_id: input.organization_id ?? null,
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
      organization_id: input.organization_id ?? null,
    },
  })

  revalidatePath('/admin')
  return { success: true }
}

/**
 * Approve a self-signup user that is awaiting review: assign their role and
 * organization and move them to `active`.
 */
export async function approveUser(input: {
  user_id: string
  role: UserRole
  organization_id?: string | null
}) {
  const auth = await requireAdmin()
  if (!auth.ok) return { error: auth.error }

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
      organization_id: input.organization_id ?? null,
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
      organization_id: input.organization_id ?? null,
    },
  })

  revalidatePath('/admin')
  return { success: true }
}
