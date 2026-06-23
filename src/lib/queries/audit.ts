import { MOCK_AUDIT_LOGS } from '@/lib/mock-data'

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

function byCreatedAtDesc(a: AuditLogEntry, b: AuditLogEntry): number {
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
}

export async function getAuditLogs(
  limit = 100,
  filters: AuditLogFilters = {}
): Promise<AuditLogEntry[]> {
  let logs = [...MOCK_AUDIT_LOGS]

  if (filters.from) {
    const from = new Date(filters.from).getTime()
    logs = logs.filter((l) => new Date(l.created_at).getTime() >= from)
  }
  if (filters.to) {
    // Treat `to` as inclusive of the whole day.
    const to = new Date(filters.to).getTime() + 24 * 60 * 60 * 1000 - 1
    logs = logs.filter((l) => new Date(l.created_at).getTime() <= to)
  }
  if (filters.actor) {
    const needle = filters.actor.toLowerCase()
    logs = logs.filter((l) =>
      (l.actor_email ?? '').toLowerCase().includes(needle)
    )
  }
  if (filters.table) {
    logs = logs.filter((l) => l.target_table === filters.table)
  }

  return logs.sort(byCreatedAtDesc).slice(0, limit)
}

/**
 * Per-record audit timeline (newest first) for a single entity, used by the
 * audit timeline embedded on event / corrective-action detail pages.
 */
export async function getRecordAuditLog(
  table: string,
  id: string
): Promise<AuditLogEntry[]> {
  return MOCK_AUDIT_LOGS.filter(
    (l) => l.target_table === table && l.target_id === id
  ).sort(byCreatedAtDesc)
}

/** Distinct target tables present in the log, for the admin filter dropdown. */
export async function getAuditTables(): Promise<string[]> {
  const tables = new Set<string>()
  for (const l of MOCK_AUDIT_LOGS) {
    if (l.target_table) tables.add(l.target_table)
  }
  return [...tables].sort()
}
