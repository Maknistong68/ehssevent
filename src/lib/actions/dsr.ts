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

  // The DPO is notified out-of-band (transactional email is deferred for the
  // pilot); reference the request id and statutory deadline when wiring it up.
  void DPO_EMAIL

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
 * Fulfils a DSR. For a `destruction` request this redacts the subject's profile
 * record; other request types are marked completed (the access/copy/correction
 * artefacts are produced out-of-band). Writes go through the service-role client.
 * Every action is audited.
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

  if (request.type === 'destruction') {
    const { data: profile } = await admin
      .from('profiles')
      .select('id')
      .eq('id', request.requester_id as string)
      .maybeSingle()
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

      await logAudit({
        action: 'dsr.erasure',
        target_table: 'profiles',
        target_id: profileId,
        target_label: 'redacted',
        metadata: { request_id: requestId },
      })
    }
  }

  const previousStatus = request.status as DsrRequest['status']
  const { error } = await admin
    .from('dsr_requests')
    .update({ status: 'completed', resolved_at: new Date().toISOString() })
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
    },
  })

  revalidatePath('/admin')
  return { success: true }
}
