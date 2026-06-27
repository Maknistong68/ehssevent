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

export interface AuditLogFilters {
  /** ISO date (inclusive lower bound) */
  from?: string
  /** ISO date (inclusive upper bound) */
  to?: string
  /** actor email substring (case-insensitive) */
  actor?: string
  /** exact target_table match */
  table?: string
}

const AUDIT_SELECT =
  'id, actor_id, actor_email, action, target_table, target_id, target_label, metadata, created_at'

export async function getAuditLogs(
  limit = 100,
  filters: AuditLogFilters = {}
): Promise<AuditLogEntry[]> {
  const supabase = await createClient()
  let query = supabase
    .from('audit_logs')
    .select(AUDIT_SELECT)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (filters.from) query = query.gte('created_at', filters.from)
  if (filters.to) {
    // Treat `to` as inclusive of the whole day.
    const end = new Date(
      new Date(filters.to).getTime() + 24 * 60 * 60 * 1000 - 1
    )
    query = query.lte('created_at', end.toISOString())
  }
  if (filters.actor) query = query.ilike('actor_email', `%${filters.actor}%`)
  if (filters.table) query = query.eq('target_table', filters.table)

  const { data, error } = await query
  if (error) return []
  return (data ?? []) as unknown as AuditLogEntry[]
}

/**
 * Per-record audit timeline (newest first) for a single entity, used by the
 * audit timeline embedded on event / corrective-action detail pages.
 */
export async function getRecordAuditLog(
  table: string,
  id: string
): Promise<AuditLogEntry[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('audit_logs')
    .select(AUDIT_SELECT)
    .eq('target_table', table)
    .eq('target_id', id)
    .order('created_at', { ascending: false })

  if (error) return []
  return (data ?? []) as unknown as AuditLogEntry[]
}

/** Distinct target tables present in the log, for the admin filter dropdown. */
export async function getAuditTables(): Promise<string[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('audit_logs')
    .select('target_table')
    .not('target_table', 'is', null)

  if (error) return []
  const tables = new Set<string>()
  for (const row of data ?? []) {
    const t = (row as { target_table: string | null }).target_table
    if (t) tables.add(t)
  }
  return [...tables].sort()
}
