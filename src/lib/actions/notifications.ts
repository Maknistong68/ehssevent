'use server'

import { revalidatePath } from 'next/cache'
import { getSessionProfile } from '@/lib/auth/guards'
import { MOCK_NOTIFICATIONS } from '@/lib/mock-data'
import {
  getNotifications,
  getUnreadNotificationCount,
} from '@/lib/queries/notifications'
import { notificationPreferencesFor } from '@/lib/queries/settings'
import type { Notification, NotificationType } from '@/types/database'

export interface CreateNotificationInput {
  user_id: string
  type: NotificationType
  title: string
  body?: string | null
  link?: string | null
}

// Maps each notification type to the preference that gates it. Types without
// an entry are always delivered.
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
 * category.
 *
 * This is an internal helper rather than a user-facing form action; it never
 * trusts a client-supplied recipient beyond what the calling action provides.
 *
 * TODO(prod): INSERT into the `notifications` table and deliver via realtime.
 */
export async function createNotification(
  input: CreateNotificationInput
): Promise<void> {
  const prefs = notificationPreferencesFor(input.user_id)

  // Respect the recipient's opt-out for this notification category.
  const gate = TYPE_PREF[input.type]
  if (gate && !prefs[gate]) return

  const notification: Notification = {
    id: crypto.randomUUID(),
    user_id: input.user_id,
    type: input.type,
    title: input.title,
    body: input.body ?? null,
    link: input.link ?? null,
    read: false,
    created_at: new Date().toISOString(),
  }
  MOCK_NOTIFICATIONS.unshift(notification)

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

/** Marks one of the current user's notifications as read. */
export async function markNotificationRead(
  notificationId: string
): Promise<{ success?: boolean; error?: string }> {
  const profile = await getSessionProfile()
  if (!profile) return { error: 'Not authenticated' }

  const notification = MOCK_NOTIFICATIONS.find(
    (n) => n.id === notificationId && n.user_id === profile.id
  )
  if (!notification) return { error: 'Notification not found' }

  notification.read = true
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

  for (const n of MOCK_NOTIFICATIONS) {
    if (n.user_id === profile.id) n.read = true
  }
  revalidatePath('/notifications')
  return { success: true }
}
