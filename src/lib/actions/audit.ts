'use server'

import { getSessionProfile } from '@/lib/auth/guards'
import { MOCK_AUDIT_LOGS, MOCK_PROFILES } from '@/lib/mock-data'
import type { AuditLogEntry } from '@/lib/queries/audit'

export interface AuditEntry {
  action: string
  target_table?: string | null
  target_id?: string | null
  target_label?: string | null
  metadata?: Record<string, unknown>
}

/**
 * Records an audit entry. In mock mode this prepends to MOCK_AUDIT_LOGS so the
 * admin Audit Log tab and per-record timelines reflect real activity in the
 * running session. The actor is resolved server-side from the session.
 *
 * // TODO(prod): replace the in-memory push with an INSERT into the
 * `audit_logs` table (append-only, RLS-protected) and resolve the actor from
 * the authenticated JWT rather than the mock session.
 */
export async function logAudit(entry: AuditEntry): Promise<void> {
  const profile = await getSessionProfile()
  const actor = profile ? MOCK_PROFILES.find((p) => p.id === profile.id) : null

  const log: AuditLogEntry = {
    id: crypto.randomUUID(),
    actor_id: profile?.id ?? null,
    actor_email: actor?.email ?? null,
    action: entry.action,
    target_table: entry.target_table ?? null,
    target_id: entry.target_id ?? null,
    target_label: entry.target_label ?? null,
    metadata: entry.metadata ?? {},
    created_at: new Date().toISOString(),
  }

  // Newest first so getAuditLogs (which slices from the top) shows recent
  // activity without needing to re-sort.
  MOCK_AUDIT_LOGS.unshift(log)
}
