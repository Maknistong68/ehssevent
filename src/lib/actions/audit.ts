'use server'

import { getSessionProfile } from '@/lib/auth/guards'
import { createAdminClient } from '@/lib/supabase/admin'

export interface AuditEntry {
  action: string
  target_table?: string | null
  target_id?: string | null
  target_label?: string | null
  metadata?: Record<string, unknown>
}

/**
 * Records an audit entry as a permanent, append-only row in `audit_logs`.
 * Writes go through the service-role admin client because the table is
 * read-only to the app (RLS allows SELECT only) and database triggers block
 * UPDATE/DELETE. The actor is resolved server-side from the real session, and
 * the row is scoped to the actor's organization for org-level audit reads.
 */
export async function logAudit(entry: AuditEntry): Promise<void> {
  const profile = await getSessionProfile()
  const admin = createAdminClient()

  let actorEmail: string | null = null
  const organizationId = profile?.organization_id ?? null
  if (profile) {
    const { data } = await admin
      .from('profiles')
      .select('email')
      .eq('id', profile.id)
      .single()
    actorEmail = (data?.email as string | null) ?? null
  }

  await admin.from('audit_logs').insert({
    organization_id: organizationId,
    actor_id: profile?.id ?? null,
    actor_email: actorEmail,
    action: entry.action,
    target_table: entry.target_table ?? null,
    target_id: entry.target_id ?? null,
    target_label: entry.target_label ?? null,
    metadata: entry.metadata ?? {},
  })
}
