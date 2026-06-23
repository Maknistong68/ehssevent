'use server'

import { revalidatePath } from 'next/cache'
import { requirePermission } from '@/lib/auth/guards'
import { logAudit } from '@/lib/actions/audit'
import { MOCK_PROFILES } from '@/lib/mock-data'
import type { Profile } from '@/types/database'
import type { UserRole, UserStatus } from '@/types/enums'

export async function updateTeamMember(input: {
  user_id: string
  role?: UserRole
  status?: UserStatus
}) {
  const auth = await requirePermission('user:manage')
  if (!auth.ok) return { error: auth.error }

  const profile = MOCK_PROFILES.find((p) => p.id === input.user_id)
  if (profile) {
    if (input.role) profile.role = input.role
    if (input.status) profile.status = input.status
    profile.updated_at = new Date().toISOString()
  }

  revalidatePath('/team')
  return { success: true }
}

/**
 * Invite a member into the current admin's organization. Creates an `invited`
 * profile scoped to that organization.
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
  if (MOCK_PROFILES.some((p) => p.email.toLowerCase() === email)) {
    return { error: 'A user with this email already exists.' }
  }

  const now = new Date().toISOString()
  const newProfile: Profile = {
    id: crypto.randomUUID(),
    email: input.email.trim(),
    full_name: null,
    role: input.role,
    organization_id: auth.profile.organization_id,
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

  const profile = MOCK_PROFILES.find((p) => p.id === input.user_id)
  if (!profile) return { error: 'User not found' }

  profile.role = input.role
  profile.organization_id = auth.profile.organization_id
  profile.status = 'active'
  profile.updated_at = new Date().toISOString()

  await logAudit({
    action: 'user.approve',
    target_table: 'profiles',
    target_id: profile.id,
    target_label: profile.email,
    metadata: {
      role: input.role,
      organization_id: auth.profile.organization_id,
    },
  })

  revalidatePath('/team')
  return { success: true }
}
