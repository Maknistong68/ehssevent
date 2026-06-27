import { env } from '@/lib/env'

/**
 * Minimal isomorphic structured logger + error-reporting seam (H-3).
 *
 * It emits single-line JSON to the console (greppable in server logs and the
 * browser console) AND, when `NEXT_PUBLIC_MONITORING_DSN` is configured,
 * forwards each `reportError` to that collector as a best-effort JSON beacon.
 * `reportError` is the single entry point the app's error boundaries call, so
 * swapping the collector for a vendor SDK later is a one-file change.
 *
 * PDPL note: error monitoring underpins the controller's ability to *detect*
 * a security incident and meet the 72-hour SDAIA breach-notification duty (see
 * docs/breach-response-sop.md). The DSN must point at a KSA-resident collector
 * so error payloads (which may reference personal data) don't leave the Kingdom.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export type LogContext = Record<string, unknown>

function emit(level: LogLevel, message: string, context?: LogContext): void {
  const payload = {
    level,
    message,
    ts: new Date().toISOString(),
    ...context,
  }
  const line = JSON.stringify(payload)
  if (level === 'error') console.error(line)
  else if (level === 'warn') console.warn(line)
  else console.info(line)
}

export const logger = {
  debug: (message: string, context?: LogContext) =>
    emit('debug', message, context),
  info: (message: string, context?: LogContext) =>
    emit('info', message, context),
  warn: (message: string, context?: LogContext) =>
    emit('warn', message, context),
  error: (message: string, context?: LogContext) =>
    emit('error', message, context),
}

/**
 * Normalizes any thrown value to an Error, logs it with context, and forwards
 * it to the monitoring collector when one is configured.
 *
 * Delivery is fire-and-forget and fully swallowed: monitoring must never throw
 * back into the error path it is observing. The collector receives a vendor-
 * neutral JSON envelope, so a real SDK can replace `forwardToMonitoring`
 * without touching any caller.
 */
export function reportError(error: unknown, context?: LogContext): void {
  const err = error instanceof Error ? error : new Error(String(error))
  logger.error(err.message, {
    name: err.name,
    stack: err.stack,
    ...context,
  })

  forwardToMonitoring(err, context)
}

function forwardToMonitoring(err: Error, context?: LogContext): void {
  const dsn = env.NEXT_PUBLIC_MONITORING_DSN
  if (!dsn) return

  const payload = JSON.stringify({
    message: err.message,
    name: err.name,
    stack: err.stack,
    ts: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    ...context,
  })

  try {
    // Prefer the non-blocking Beacon API in the browser so reporting never
    // delays navigation; fall back to a keepalive fetch on server/edge.
    if (
      typeof navigator !== 'undefined' &&
      typeof navigator.sendBeacon === 'function'
    ) {
      navigator.sendBeacon(dsn, payload)
      return
    }
    void fetch(dsn, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    }).catch(() => {
      // Best-effort: a failed report must not surface to the user.
    })
  } catch {
    // Never let monitoring throw into the error path it observes.
  }
}
