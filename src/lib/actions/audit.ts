'use server'

export interface AuditEntry {
  action: string
  target_table?: string | null
  target_id?: string | null
  target_label?: string | null
  metadata?: Record<string, unknown>
}

export async function logAudit(_entry: AuditEntry): Promise<void> {
  // No-op in mock mode
}
