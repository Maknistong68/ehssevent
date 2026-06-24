import { getSessionProfile } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
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

/** The current user's notification preferences, falling back to defaults. */
export async function getNotificationPreferences(): Promise<NotificationPreferences | null> {
  const profile = await getSessionProfile()
  if (!profile) return null

  const supabase = await createClient()
  const { data } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', profile.id)
    .maybeSingle()

  return (
    (data as unknown as NotificationPreferences) ??
    defaultNotificationPreferences(profile.id)
  )
}
