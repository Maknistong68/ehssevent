'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth/guards'
import { logAudit } from '@/lib/actions/audit'
import { MOCK_PROFILES } from '@/lib/mock-data'
import type { Profile } from '@/types/database'
import type { OrgType, UserRole, UserStatus } from '@/types/enums'

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

export async function updateUserProfile(input: {
  user_id: string
  role?: UserRole
  organization_id?: string | null
  status?: UserStatus
}) {
  const auth = await requireAdmin()
  if (!auth.ok) return { error: auth.error }

  const profile = MOCK_PROFILES.find((p) => p.id === input.user_id)
  if (profile) {
    const before = {
      role: profile.role,
      organization_id: profile.organization_id,
      status: profile.status,
    }
    if (input.role) profile.role = input.role
    if (input.organization_id !== undefined)
      profile.organization_id = input.organization_id
    if (input.status) profile.status = input.status
    profile.updated_at = new Date().toISOString()

    await logAudit({
      action: 'user.update',
      target_table: 'profiles',
      target_id: profile.id,
      target_label: profile.email,
      metadata: {
        from: before,
        to: {
          role: profile.role,
          organization_id: profile.organization_id,
          status: profile.status,
        },
      },
    })
  }

  revalidatePath('/admin')
  return { success: true }
}

/**
 * Invite a new user. Creates a profile in the `invited` state with the role
 * and organization pre-assigned; the user becomes `active` only after they
 * accept the invitation.
 */
export async function inviteUser(input: {
  email: string
  role: UserRole
  organization_id?: string | null
}) {
  const auth = await requireAdmin()
  if (!auth.ok) return { error: auth.error }

  const email = input.email.trim().toLowerCase()
  if (MOCK_PROFILES.some((p) => p.email.toLowerCase() === email)) {
    return { error: 'A user with this email already exists.' }
  }

  const now = new Date().toISOString()
  const newProfile: Profile = {
    id: crypto.randomUUID(),
    email: input.email.trim(),
    full_name: null,
    role: input.role,
    organization_id: input.organization_id ?? null,
    status: 'invited',
    terms_accepted_at: null,
    privacy_accepted_at: null,
    terms_version: null,
    privacy_version: null,
    created_at: now,
    updated_at: now,
  }
  MOCK_PROFILES.push(newProfile)

  await logAudit({
    action: 'user.invite',
    target_table: 'profiles',
    target_id: newProfile.id,
    target_label: newProfile.email,
    metadata: { role: input.role, organization_id: input.organization_id ?? null },
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

  const profile = MOCK_PROFILES.find((p) => p.id === input.user_id)
  if (!profile) return { error: 'User not found' }

  profile.role = input.role
  profile.organization_id = input.organization_id ?? null
  profile.status = 'active'
  profile.updated_at = new Date().toISOString()

  await logAudit({
    action: 'user.approve',
    target_table: 'profiles',
    target_id: profile.id,
    target_label: profile.email,
    metadata: { role: input.role, organization_id: input.organization_id ?? null },
  })

  revalidatePath('/admin')
  return { success: true }
}
