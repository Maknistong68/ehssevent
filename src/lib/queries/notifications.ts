import { createClient } from '@/lib/supabase/server'
import type { Notification } from '@/types/database'

/** The current user's notifications, newest first. RLS scopes rows to the
 * authenticated recipient, so no explicit user filter is required. */
export async function getNotifications(
  limit?: number
): Promise<Notification[]> {
  const supabase = await createClient()
  let query = supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
  if (typeof limit === 'number') query = query.limit(limit)

  const { data, error } = await query
  if (error) return []
  return (data ?? []) as unknown as Notification[]
}

/** Count of the current user's unread notifications. */
export async function getUnreadNotificationCount(): Promise<number> {
  const supabase = await createClient()
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('read', false)
  if (error) return 0
  return count ?? 0
}
