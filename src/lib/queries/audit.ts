import { createClient } from '@/lib/supabase/server'

export interface AuditLogEntry {
  id: string
  actor_id: string | null
  actor_email: string | null
  action: string
  target_table: string | null
  target_id: string | null
  target_label: string | null
  metadata: Record<string, unknown>
  created_at: string
}

/**
 * Returns the most recent audit log entries. Admin-only (RLS enforced).
 */
export async function getAuditLogs(limit = 100): Promise<AuditLogEntry[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return []
  return (data as AuditLogEntry[]) || []
}
