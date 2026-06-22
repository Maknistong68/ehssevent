import { MOCK_NOTIFICATIONS } from '@/lib/mock-data'
import { getSessionProfile } from '@/lib/auth/guards'
import type { Notification } from '@/types/database'

/** The current user's notifications, newest first. */
export async function getNotifications(limit?: number): Promise<Notification[]> {
  const profile = await getSessionProfile()
  if (!profile) return []

  const mine = MOCK_NOTIFICATIONS.filter((n) => n.user_id === profile.id).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
  return typeof limit === 'number' ? mine.slice(0, limit) : mine
}

/** Count of the current user's unread notifications. */
export async function getUnreadNotificationCount(): Promise<number> {
  const profile = await getSessionProfile()
  if (!profile) return 0
  return MOCK_NOTIFICATIONS.filter(
    (n) => n.user_id === profile.id && !n.read
  ).length
}
