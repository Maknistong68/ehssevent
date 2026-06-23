'use server'

import { revalidatePath } from 'next/cache'
import {
  MOCK_CURRENT_USER,
  MOCK_DSR_REQUESTS,
  MOCK_PROFILES,
} from '@/lib/mock-data'
import {
  DSR_RESPONSE_DAYS,
  DSR_REQUEST_TYPES,
  DPO_EMAIL,
} from '@/lib/constants/legal'
import { requirePermission } from '@/lib/auth/guards'
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
 * Mock mode: appends to the in-memory MOCK_DSR_REQUESTS store and writes an
 * audit entry so the demo shows a real, accountable workflow. The statutory
 * response deadline (created_at + DSR_RESPONSE_DAYS) is computed and surfaced
 * to the user.
 */
export async function submitDsrRequest(
  input: SubmitDsrInput
): Promise<SubmitDsrResult> {
  if (!DSR_REQUEST_TYPES.includes(input.type)) {
    return { error: 'Invalid request type.' }
  }

  const now = new Date()
  const dueAt = new Date(
    now.getTime() + DSR_RESPONSE_DAYS * 24 * 60 * 60 * 1000
  )

  // The actor is server-resolved, never taken from the client, so the requester
  // identity cannot be forged.
  // TODO(prod): replace MOCK_CURRENT_USER with the authenticated user resolved
  // from the Supabase session (auth.uid()).
  const requester = MOCK_CURRENT_USER

  const request: DsrRequest = {
    id: crypto.randomUUID(),
    requester_id: requester.id,
    requester_email: requester.email ?? '',
    type: input.type,
    note: input.note?.trim() || null,
    status: 'received',
    created_at: now.toISOString(),
    due_at: dueAt.toISOString(),
    resolved_at: null,
  }

  // TODO(prod): INSERT the request into the `dsr_requests` table (RLS: a user
  // can read only their own requests; the DPO/admin role can read all).
  MOCK_DSR_REQUESTS.push(request)

  // TODO(prod): email the DPO (DPO_EMAIL) and send the requester an
  // acknowledgement, e.g. via a transactional email provider. Reference the
  // request id and the statutory deadline.
  void DPO_EMAIL

  // Accountability: log the request to the audit trail.
  await logAudit({
    action: `dsr.${input.type}`,
    target_table: 'dsr_requests',
    target_id: request.id,
    target_label: requester.email,
    metadata: { status: request.status, due_at: request.due_at },
  })

  return { success: true, request, responseDays: DSR_RESPONSE_DAYS }
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
 * completed/rejected). Each change is written to the audit trail.
 */
export async function updateDsrStatus(
  requestId: string,
  status: DsrRequest['status'],
  note?: string
): Promise<{ success?: boolean; error?: string }> {
  const auth = await requirePermission('dsr:manage')
  if (!auth.ok) return { error: auth.error }

  if (!DSR_STATUSES.includes(status)) return { error: 'Invalid status.' }

  const request = MOCK_DSR_REQUESTS.find((r) => r.id === requestId)
  if (!request) return { error: 'Request not found.' }

  const previousStatus = request.status
  request.status = status
  if (status === 'completed' || status === 'rejected') {
    request.resolved_at = new Date().toISOString()
  }

  await logAudit({
    action: `dsr.status_${status}`,
    target_table: 'dsr_requests',
    target_id: request.id,
    target_label: request.requester_email,
    metadata: {
      status: { from: previousStatus, to: status },
      reason: note?.trim() || null,
    },
  })

  revalidatePath('/admin')
  return { success: true }
}

/**
 * Fulfils a DSR. For a `destruction` request this performs a mock
 * erasure/redaction of the subject's profile record; other request types are
 * marked completed (the access/copy/correction artefacts are produced
 * out-of-band). Every action is audited.
 *
 * TODO(prod): replace the in-memory redaction with a real, transactional
 * erasure across all tables holding the subject's personal data, and generate
 * the access/copy export or apply the requested correction.
 */
export async function fulfilDsr(
  requestId: string
): Promise<{ success?: boolean; error?: string }> {
  const auth = await requirePermission('dsr:manage')
  if (!auth.ok) return { error: auth.error }

  const request = MOCK_DSR_REQUESTS.find((r) => r.id === requestId)
  if (!request) return { error: 'Request not found.' }

  if (request.type === 'destruction') {
    const profile = MOCK_PROFILES.find((p) => p.id === request.requester_id)
    if (profile) {
      profile.full_name = null
      profile.email = `redacted+${profile.id.slice(0, 8)}@deleted.local`
      profile.status = 'deactivated'
      profile.updated_at = new Date().toISOString()

      await logAudit({
        action: 'dsr.erasure',
        target_table: 'profiles',
        target_id: profile.id,
        target_label: 'redacted',
        metadata: { request_id: request.id },
      })
    }
  }

  const now = new Date().toISOString()
  const previousStatus = request.status
  request.status = 'completed'
  request.resolved_at = now

  await logAudit({
    action: 'dsr.fulfilled',
    target_table: 'dsr_requests',
    target_id: request.id,
    target_label: request.requester_email,
    metadata: {
      type: request.type,
      status: { from: previousStatus, to: 'completed' },
    },
  })

  revalidatePath('/admin')
  return { success: true }
}
