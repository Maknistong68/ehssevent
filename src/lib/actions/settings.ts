'use server'

import { revalidatePath } from 'next/cache'
import { requireUser, requirePermission } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { defaultNotificationPreferences } from '@/lib/queries/settings'
import { logAudit } from '@/lib/actions/audit'
import {
  notificationPreferencesSchema,
  updateOrganizationSchema,
  type NotificationPreferencesInput,
  type UpdateOrganizationInput,
} from '@/lib/validators/settings'

type ActionResult = { success?: boolean; error?: string }

/**
 * Persists the current user's notification preferences. Upserts the row so it
 * is created on first save and updated thereafter. RLS limits the row to the
 * authenticated user.
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
  const supabase = await createClient()
  const { error } = await supabase.from('notification_preferences').upsert({
    ...defaultNotificationPreferences(userId),
    ...parsed.data,
    user_id: userId,
  })
  if (error) return { error: error.message }

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
 * Updates the caller's organization. Gated by org:manage. Writes via the
 * service-role client since organization rows are not directly user-writable
 * under RLS.
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

  // A non-platform admin may only edit their own organization.
  if (
    auth.profile.organization_id &&
    parsed.data.id !== auth.profile.organization_id
  ) {
    return { error: 'You can only edit your own organization.' }
  }

  const admin = createAdminClient()
  const { data: org, error } = await admin
    .from('organizations')
    .update({
      name: parsed.data.name,
      contact_email: parsed.data.contact_email
        ? parsed.data.contact_email
        : null,
    })
    .eq('id', parsed.data.id)
    .select('id, name, contact_email')
    .maybeSingle()
  if (error) return { error: error.message }
  if (!org) return { error: 'Organization not found' }

  await logAudit({
    action: 'update',
    target_table: 'organizations',
    target_id: org.id as string,
    target_label: org.name as string,
    metadata: { name: org.name, contact_email: org.contact_email },
  })

  revalidatePath('/settings')
  return { success: true }
}
