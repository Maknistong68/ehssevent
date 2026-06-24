import { getSessionProfile } from '@/lib/auth/guards'
import { MOCK_NOTIFICATION_PREFS } from '@/lib/mock-data'
import type { NotificationPreferences } from '@/types/database'

/** Sensible defaults for a user with no stored preferences row (opt-in by default). */
export function defaultNotificationPreferences(
  userId: string
): NotificationPreferences {
  return {
    user_id: userId,
    ca_assigned: true,
    ca_status: true,
    event_stage: true,
  }
}

/** A specific user's notification preferences, falling back to defaults. */
export function notificationPreferencesFor(
  userId: string
): NotificationPreferences {
  const stored = MOCK_NOTIFICATION_PREFS.find((p) => p.user_id === userId)
  return stored ?? defaultNotificationPreferences(userId)
}

/** The current user's notification preferences, falling back to defaults. */
export async function getNotificationPreferences(): Promise<NotificationPreferences | null> {
  const profile = await getSessionProfile()
  if (!profile) return null

  return notificationPreferencesFor(profile.id)
}
