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

export async function getAuditLogs(limit = 100): Promise<AuditLogEntry[]> {
  return MOCK_AUDIT_LOGS.slice(0, limit)
}
