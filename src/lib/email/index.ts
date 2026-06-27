import { env } from '@/lib/env'
import { logger } from '@/lib/observability/logger'

/**
 * Transactional-email seam.
 *
 * Like the observability seam, this is the single place email leaves the app,
 * so binding a real provider is a one-file change. Delivery is configured via
 * `EMAIL_API_KEY` + `EMAIL_FROM` (server-only secrets). When unconfigured the
 * sender is a safe no-op that logs the dropped message rather than throwing —
 * a missing provider must never break the workflow that triggered the email.
 *
 * PDPL note: the chosen provider must be **KSA-resident** (In-Kingdom hosting),
 * because messages such as DSR/breach notices reference personal data and must
 * not be transferred outside the Kingdom (PDPL Art. 29).
 */

export interface EmailMessage {
  to: string | string[]
  subject: string
  /** Plain-text body. */
  text: string
  /** Optional HTML body. */
  html?: string
}

export interface EmailResult {
  /** True when the message was handed to the provider. */
  sent: boolean
  /** True when no provider is configured and the message was dropped. */
  skipped?: boolean
  error?: string
}

function isConfigured(): boolean {
  return Boolean(env.EMAIL_API_KEY && env.EMAIL_FROM)
}

/**
 * Sends a transactional email. Never throws: returns a result the caller may
 * log/ignore so notification failures don't fail the underlying action.
 */
export async function sendEmail(message: EmailMessage): Promise<EmailResult> {
  const recipients = Array.isArray(message.to) ? message.to : [message.to]
  if (recipients.length === 0) {
    return { sent: false, skipped: true }
  }

  if (!isConfigured()) {
    logger.warn('email.skipped — provider not configured', {
      subject: message.subject,
      recipients: recipients.length,
    })
    return { sent: false, skipped: true }
  }

  try {
    await deliver(recipients, message)
    logger.info('email.sent', {
      subject: message.subject,
      recipients: recipients.length,
    })
    return { sent: true }
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    logger.error('email.failed', { subject: message.subject, error })
    return { sent: false, error }
  }
}

/**
 * Provider-specific delivery. Binds `EMAIL_API_KEY` / `EMAIL_FROM` to the chosen
 * KSA-resident provider's HTTP API.
 *
 * TODO(prod): replace this body with the provider's SDK/REST call. It is kept
 * as a single function so swapping providers touches nothing else.
 */
async function deliver(
  recipients: string[],
  message: EmailMessage
): Promise<void> {
  void recipients
  void message
  // Configured but no concrete provider bound yet — surface loudly so this is
  // wired before relying on email for PDPL notifications.
  throw new Error(
    'Email provider not bound: implement deliver() for the KSA provider'
  )
}

/**
 * Notifies the Data Protection Officer that a new DSR was received, so the
 * statutory response clock is actioned. Returns the send result (best-effort).
 */
export async function notifyDpoOfDsr(params: {
  dpoEmail: string
  requestId: string
  type: string
  requesterEmail: string
  dueAt: string
}): Promise<EmailResult> {
  const { dpoEmail, requestId, type, requesterEmail, dueAt } = params
  const due = new Date(dueAt).toISOString().slice(0, 10)
  return sendEmail({
    to: dpoEmail,
    subject: `New PDPL data-subject request (${type})`,
    text: [
      `A new data-subject request has been received.`,
      ``,
      `Type:       ${type}`,
      `Request ID: ${requestId}`,
      `Requester:  ${requesterEmail}`,
      `Respond by: ${due} (statutory deadline)`,
      ``,
      `Action it from the admin console.`,
    ].join('\n'),
  })
}
