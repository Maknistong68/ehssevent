import { createClient } from '@/lib/supabase/server'
import type { DsrRequest } from '@/types/database'

/** All data-subject requests, newest first, for the admin DSR queue. RLS lets
 * platform admins see every request (and a user only their own). */
export async function getDsrRequests(): Promise<DsrRequest[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('dsr_requests')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return []
  return (data ?? []) as unknown as DsrRequest[]
}
