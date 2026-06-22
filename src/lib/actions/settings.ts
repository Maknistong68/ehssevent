'use server'

import { revalidatePath } from 'next/cache'
import { requireUser, requirePermission } from '@/lib/auth/guards'
import {
  MOCK_NOTIFICATION_PREFS,
  MOCK_ORGANIZATIONS,
} from '@/lib/mock-data'
import { defaultNotificationPreferences } from '@/lib/queries/settings'
import { logAudit } from '@/lib/actions/audit'
import {
  notificationPreferencesSchema,
  changePasswordSchema,
  updateOrganizationSchema,
  type NotificationPreferencesInput,
  type ChangePasswordInput,
  type UpdateOrganizationInput,
} from '@/lib/validators/settings'

type ActionResult = { success?: boolean; error?: string }

/**
 * Persists the current user's notification preferences. Creates the row on
 * first save, otherwise mutates it in place.
 */
export async function updateNotificationPreferences(
  input: NotificationPreferencesInput
): Promise<ActionResult> {
  const auth = await requireUser()
  if (!auth.ok) return { error: auth.error }

  const parsed = notificationPreferencesSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const userId = auth.profile.id
  const existing = MOCK_NOTIFICATION_PREFS.find((p) => p.user_id === userId)
  if (existing) {
    Object.assign(existing, parsed.data)
  } else {
    MOCK_NOTIFICATION_PREFS.push({
      ...defaultNotificationPreferences(userId),
      ...parsed.data,
    })
  }

  await logAudit({
    action: 'update',
    target_table: 'notification_preferences',
    target_id: userId,
    target_label: 'Notification preferences',
    metadata: { ...parsed.data },
  })

  revalidatePath('/settings')
  return { success: true }
}

/**
 * Change-password stub. Validates input shape only; no credential store exists
 * in mock mode.
 * TODO(prod): verify current_password and update the credential via the auth
 * provider (e.g. Supabase auth.updateUser), then audit the change.
 */
export async function changePassword(
  input: ChangePasswordInput
): Promise<ActionResult> {
  const auth = await requireUser()
  if (!auth.ok) return { error: auth.error }

  const parsed = changePasswordSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  // TODO(prod): real credential verification + update.
  await logAudit({
    action: 'update',
    target_table: 'auth',
    target_id: auth.profile.id,
    target_label: 'Password changed',
  })

  return { success: true }
}

/**
 * MFA enable/disable stub. Records intent only.
 * TODO(prod): enroll/unenroll a TOTP factor with the auth provider and persist
 * the verified state.
 */
export async function setMfaEnabled(enabled: boolean): Promise<ActionResult> {
  const auth = await requireUser()
  if (!auth.ok) return { error: auth.error }

  // TODO(prod): real MFA enrollment/verification flow.
  await logAudit({
    action: 'update',
    target_table: 'auth',
    target_id: auth.profile.id,
    target_label: enabled ? 'MFA enabled' : 'MFA disabled',
  })

  return { success: true }
}

/**
 * Updates the caller's organization. Gated by org:manage; mutates the mock
 * organization record.
 */
export async function updateOrganization(
  input: UpdateOrganizationInput
): Promise<ActionResult> {
  const auth = await requirePermission('org:manage')
  if (!auth.ok) return { error: auth.error }

  const parsed = updateOrganizationSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const org = MOCK_ORGANIZATIONS.find((o) => o.id === parsed.data.id)
  if (!org) return { error: 'Organization not found' }

  org.name = parsed.data.name
  org.contact_email = parsed.data.contact_email
    ? parsed.data.contact_email
    : null
  org.updated_at = new Date().toISOString()

  await logAudit({
    action: 'update',
    target_table: 'organizations',
    target_id: org.id,
    target_label: org.name,
    metadata: { name: org.name, contact_email: org.contact_email },
  })

  revalidatePath('/settings')
  return { success: true }
}
