'use server'

import { revalidatePath } from 'next/cache'
import {
  DSR_RESPONSE_DAYS,
  DSR_REQUEST_TYPES,
  DPO_EMAIL,
} from '@/lib/constants/legal'
import { requireUser, requirePermission } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logAudit } from '@/lib/actions/audit'
import { notifyDpoOfDsr } from '@/lib/email'
import type { DsrRequest } from '@/types/database'

export interface SubmitDsrInput {
  type: DsrRequest['type']
  note?: string
}

export interface SubmitDsrResult {
  success?: boolean
  error?: string
  request?: DsrRequest
  responseDays?: number
}

/**
 * Records a PDPL Data Subject Request and notifies the Data Protection Officer.
 *
 * The actor is resolved server-side from the Supabase session, so the requester
 * identity cannot be forged. The row is inserted under RLS (a user may insert
 * only their own request). The statutory response deadline
 * (created_at + DSR_RESPONSE_DAYS) is computed and surfaced to the user.
 */
export async function submitDsrRequest(
  input: SubmitDsrInput
): Promise<SubmitDsrResult> {
  const auth = await requireUser()
  if (!auth.ok) return { error: auth.error }

  if (!DSR_REQUEST_TYPES.includes(input.type)) {
    return { error: 'Invalid request type.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const requesterEmail = user?.email ?? ''

  const now = new Date()
  const dueAt = new Date(
    now.getTime() + DSR_RESPONSE_DAYS * 24 * 60 * 60 * 1000
  )

  const { data: request, error } = await supabase
    .from('dsr_requests')
    .insert({
      requester_id: auth.profile.id,
      requester_email: requesterEmail,
      type: input.type,
      note: input.note?.trim() || null,
      status: 'received',
      due_at: dueAt.toISOString(),
    })
    .select('*')
    .single()
  if (error || !request) {
    return { error: error?.message ?? 'Failed to submit request.' }
  }

  // Notify the DPO so the statutory response clock is actioned. Best-effort:
  // a failed/!configured email must not fail the (already-persisted) request.
  await notifyDpoOfDsr({
    dpoEmail: DPO_EMAIL,
    requestId: request.id as string,
    type: input.type,
    requesterEmail,
    dueAt: request.due_at as string,
  })

  // Accountability: log the request to the audit trail.
  await logAudit({
    action: `dsr.${input.type}`,
    target_table: 'dsr_requests',
    target_id: request.id as string,
    target_label: requesterEmail,
    metadata: { status: request.status, due_at: request.due_at },
  })

  return {
    success: true,
    request: request as unknown as DsrRequest,
    responseDays: DSR_RESPONSE_DAYS,
  }
}

// Valid forward transitions for the DPO/admin processing the request.
const DSR_STATUSES: DsrRequest['status'][] = [
  'received',
  'in_progress',
  'completed',
  'rejected',
]

/**
 * Moves a DSR through its lifecycle (received → in_progress →
 * completed/rejected). Writes go through the service-role client because
 * dsr_requests has no update RLS policy. Each change is audited.
 */
export async function updateDsrStatus(
  requestId: string,
  status: DsrRequest['status'],
  note?: string
): Promise<{ success?: boolean; error?: string }> {
  const auth = await requirePermission('dsr:manage')
  if (!auth.ok) return { error: auth.error }

  if (!DSR_STATUSES.includes(status)) return { error: 'Invalid status.' }

  const admin = createAdminClient()
  const { data: request } = await admin
    .from('dsr_requests')
    .select('id, requester_email, status')
    .eq('id', requestId)
    .maybeSingle()
  if (!request) return { error: 'Request not found.' }

  const previousStatus = request.status as DsrRequest['status']
  const patch: Record<string, unknown> = { status }
  if (status === 'completed' || status === 'rejected') {
    patch.resolved_at = new Date().toISOString()
    // Persist the reason on the request so the data subject can read why their
    // request was rejected/resolved (PDPL transparency). Visible via RLS.
    if (note?.trim()) patch.resolution_note = note.trim()
  }

  const { error } = await admin
    .from('dsr_requests')
    .update(patch)
    .eq('id', requestId)
  if (error) return { error: error.message }

  await logAudit({
    action: `dsr.status_${status}`,
    target_table: 'dsr_requests',
    target_id: requestId,
    target_label: request.requester_email as string,
    metadata: {
      status: { from: previousStatus, to: status },
      reason: note?.trim() || null,
    },
  })

  revalidatePath('/admin')
  return { success: true }
}

/**
 * Counts the statutory HSE records authored by / about a data subject that must
 * be RETAINED (incident records carry a labor-law retention duty), so a
 * destruction request can be honored for erasable PII while documenting what is
 * lawfully kept. Counts are header-only (no row data leaves the DB).
 */
async function countRetainedRecords(
  admin: ReturnType<typeof createAdminClient>,
  subjectId: string
): Promise<Record<string, number>> {
  const head = { count: 'exact' as const, head: true }
  const [events, responses, caCreated, caAssigned, inspections] =
    await Promise.all([
      admin.from('events').select('id', head).eq('created_by', subjectId),
      admin
        .from('event_responses')
        .select('id', head)
        .eq('responded_by', subjectId),
      admin
        .from('corrective_actions')
        .select('id', head)
        .eq('created_by', subjectId),
      admin
        .from('corrective_actions')
        .select('id', head)
        .eq('assigned_to', subjectId),
      admin
        .from('inspections')
        .select('id', head)
        .eq('conducted_by', subjectId),
    ])
  return {
    events: events.count ?? 0,
    event_responses: responses.count ?? 0,
    corrective_actions_created: caCreated.count ?? 0,
    corrective_actions_assigned: caAssigned.count ?? 0,
    inspections: inspections.count ?? 0,
  }
}

/**
 * Fulfils a DSR. Writes go through the service-role client; every action is
 * audited.
 *
 * For a `destruction` request this performs a **partial erasure**: the
 * subject's directly-identifying profile PII (name, email) is redacted and the
 * account deactivated, but statutory HSE records they authored (incidents,
 * responses, corrective actions, inspections) are **retained** under the
 * 10-year labor-law retention duty. PDPL permits refusing erasure of
 * legally-mandated records, but the refusal must be documented and
 * communicated — so the scope and reason are written to `resolution_note`
 * (visible to the requester) and to the immutable audit trail.
 *
 * Other request types are marked completed (access/copy/correction artefacts
 * are produced out-of-band).
 */
export async function fulfilDsr(
  requestId: string
): Promise<{ success?: boolean; error?: string }> {
  const auth = await requirePermission('dsr:manage')
  if (!auth.ok) return { error: auth.error }

  const admin = createAdminClient()
  const { data: request } = await admin
    .from('dsr_requests')
    .select('id, requester_id, requester_email, type, status')
    .eq('id', requestId)
    .maybeSingle()
  if (!request) return { error: 'Request not found.' }

  const previousStatus = request.status as DsrRequest['status']
  let resolutionNote: string | null = null

  if (request.type === 'destruction') {
    const subjectId = request.requester_id as string

    // Tally statutory records BEFORE redacting so the refusal reason is exact.
    const retained = await countRetainedRecords(admin, subjectId)
    const retainedTotal = Object.values(retained).reduce((a, b) => a + b, 0)

    const { data: profile } = await admin
      .from('profiles')
      .select('id')
      .eq('id', subjectId)
      .maybeSingle()

    let profileRedacted = false
    if (profile) {
      const profileId = profile.id as string
      await admin
        .from('profiles')
        .update({
          full_name: null,
          email: `redacted+${profileId.slice(0, 8)}@deleted.local`,
          status: 'deactivated',
        })
        .eq('id', profileId)
      profileRedacted = true

      await logAudit({
        action: 'dsr.erasure',
        target_table: 'profiles',
        target_id: profileId,
        target_label: 'redacted',
        metadata: { request_id: requestId, retained },
      })
    }

    resolutionNote =
      retainedTotal > 0
        ? `Your account profile (name, email) has been erased and the account deactivated. ` +
          `However, ${retainedTotal} statutory health & safety incident record(s) you are referenced in are RETAINED ` +
          `under the labor-law requirement to keep incident records for 10 years (PDPL permits refusing erasure of ` +
          `records the controller is legally obliged to retain). These will be destroyed when their retention period expires.`
        : `Your account profile (name, email) has been erased and the account deactivated. ` +
          `No statutory incident records referencing you were found.`

    if (!profileRedacted) {
      resolutionNote = `No matching profile was found to erase. ${resolutionNote}`
    }
  }

  const { error } = await admin
    .from('dsr_requests')
    .update({
      status: 'completed',
      resolved_at: new Date().toISOString(),
      resolution_note: resolutionNote,
    })
    .eq('id', requestId)
  if (error) return { error: error.message }

  await logAudit({
    action: 'dsr.fulfilled',
    target_table: 'dsr_requests',
    target_id: requestId,
    target_label: request.requester_email as string,
    metadata: {
      type: request.type,
      status: { from: previousStatus, to: 'completed' },
      resolution_note: resolutionNote,
    },
  })

  revalidatePath('/admin')
  return { success: true }
}
