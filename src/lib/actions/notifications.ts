'use server'

import { revalidatePath } from 'next/cache'
import { getSessionProfile } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  getNotifications,
  getUnreadNotificationCount,
} from '@/lib/queries/notifications'
import type { Notification, NotificationType } from '@/types/database'

export interface CreateNotificationInput {
  user_id: string
  type: NotificationType
  title: string
  body?: string | null
  link?: string | null
}

// Maps each notification type to the preference column that gates it. Types
// without an entry are always delivered.
const TYPE_PREF: Partial<
  Record<NotificationType, 'ca_assigned' | 'ca_status' | 'event_stage'>
> = {
  ca_assigned: 'ca_assigned',
  ca_submitted: 'ca_status',
  ca_approved: 'ca_status',
  ca_rejected: 'ca_status',
  event_stage_changed: 'event_stage',
}

/**
 * Creates an in-app notification for a recipient. Called by mutating actions
 * (CA assigned/approved/rejected, event stage change). Honors the recipient's
 * notification preferences: skips the notification if they've opted out of the
 * category. Inserts via the service-role client because notifications are
 * written *for another user*, whom RLS does not let the caller insert as.
 */
export async function createNotification(
  input: CreateNotificationInput
): Promise<void> {
  const admin = createAdminClient()

  // Respect the recipient's opt-out for this notification category. Missing
  // preference rows default to delivering (the column defaults are `true`).
  const gate = TYPE_PREF[input.type]
  if (gate) {
    const { data: prefs } = await admin
      .from('notification_preferences')
      .select('ca_assigned, ca_status, event_stage')
      .eq('user_id', input.user_id)
      .maybeSingle()
    if (prefs && prefs[gate] === false) return
  }

  await admin.from('notifications').insert({
    user_id: input.user_id,
    type: input.type,
    title: input.title,
    body: input.body ?? null,
    link: input.link ?? null,
  })

  revalidatePath('/notifications')
}

/** Loads the current user's recent notifications and unread count (client bell). */
export async function loadNotifications(
  limit = 20
): Promise<{ items: Notification[]; unread: number }> {
  const [items, unread] = await Promise.all([
    getNotifications(limit),
    getUnreadNotificationCount(),
  ])
  return { items, unread }
}

/** Marks one of the current user's notifications as read. RLS ensures a user
 * can only update their own rows. */
export async function markNotificationRead(
  notificationId: string
): Promise<{ success?: boolean; error?: string }> {
  const profile = await getSessionProfile()
  if (!profile) return { error: 'Not authenticated' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)
  if (error) return { error: error.message }

  revalidatePath('/notifications')
  return { success: true }
}

/** Marks all of the current user's notifications as read. */
export async function markAllNotificationsRead(): Promise<{
  success?: boolean
  error?: string
}> {
  const profile = await getSessionProfile()
  if (!profile) return { error: 'Not authenticated' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('read', false)
  if (error) return { error: error.message }

  revalidatePath('/notifications')
  return { success: true }
}
