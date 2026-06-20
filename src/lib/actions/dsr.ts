'use server'

import { MOCK_CURRENT_USER, MOCK_DSR_REQUESTS } from '@/lib/mock-data'
import { DSR_RESPONSE_DAYS, DSR_REQUEST_TYPES, DPO_EMAIL } from '@/lib/constants/legal'
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
export async function submitDsrRequest(input: SubmitDsrInput): Promise<SubmitDsrResult> {
  if (!DSR_REQUEST_TYPES.includes(input.type)) {
    return { error: 'Invalid request type.' }
  }

  const now = new Date()
  const dueAt = new Date(now.getTime() + DSR_RESPONSE_DAYS * 24 * 60 * 60 * 1000)

  // The actor is server-resolved, never taken from the client, so the requester
  // identity cannot be forged.
  // TODO(prod): replace MOCK_CURRENT_USER with the authenticated user resolved
  // from the Supabase session (auth.uid()).
  const requester = MOCK_CURRENT_USER

  const request: DsrRequest = {
    id: crypto.randomUUID(),
    requester_id: requester.id,
    requester_email: requester.email,
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
