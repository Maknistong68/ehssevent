import { getSessionProfile } from '@/lib/auth/guards'
import { MOCK_NOTIFICATION_PREFS } from '@/lib/mock-data'
import type { NotificationPreferences } from '@/types/database'

/** Sensible defaults for a user with no stored preferences row (opt-in by default). */
export function defaultNotificationPreferences(
  userId: string
): NotificationPreferences {
  return {
    user_id: userId,
    email_enabled: true,
    ca_assigned: true,
    ca_status: true,
    event_stage: true,
    deadlines: true,
  }
}

/** The current user's notification preferences, falling back to defaults. */
export async function getNotificationPreferences(): Promise<NotificationPreferences | null> {
  const profile = await getSessionProfile()
  if (!profile) return null

  const stored = MOCK_NOTIFICATION_PREFS.find((p) => p.user_id === profile.id)
  return stored ?? defaultNotificationPreferences(profile.id)
}
