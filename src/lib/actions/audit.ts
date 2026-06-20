'use server'

import { createClient } from '@/lib/supabase/server'

export interface AuditEntry {
  action: string
  target_table?: string | null
  target_id?: string | null
  target_label?: string | null
  metadata?: Record<string, unknown>
}

/**
 * Records a privileged action in the audit log via the SECURITY DEFINER RPC.
 * The actor is derived server-side from the authenticated session, so this is
 * best-effort and never throws into the calling action.
 */
export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    const supabase = await createClient()
    await supabase.rpc('write_audit_log', {
      p_action: entry.action,
      p_target_table: entry.target_table ?? null,
      p_target_id: entry.target_id ?? null,
      p_target_label: entry.target_label ?? null,
      p_metadata: entry.metadata ?? {},
    })
  } catch {
    // Audit logging must never block the primary action.
  }
}
