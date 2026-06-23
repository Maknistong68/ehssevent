import { env } from '@/lib/env'

/**
 * Minimal isomorphic structured logger + error-reporting seam (H-3).
 *
 * Today it emits single-line JSON to the console (greppable in server logs and
 * the browser console). It also exposes a single `reportError` entry point that
 * the app's error boundaries call, so wiring a real provider later is a
 * one-file change rather than a hunt across the codebase.
 *
 * TODO(prod): forward `reportError` to a real monitoring backend (e.g. Sentry)
 * using `env.NEXT_PUBLIC_MONITORING_DSN`, and add release/user/trace context.
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
 * it to the monitoring provider when one is configured.
 */
export function reportError(error: unknown, context?: LogContext): void {
  const err = error instanceof Error ? error : new Error(String(error))
  logger.error(err.message, {
    name: err.name,
    stack: err.stack,
    ...context,
  })

  // TODO(prod): replace with the real client/server SDK call, e.g.
  //   Sentry.captureException(err, { extra: context })
  if (env.NEXT_PUBLIC_MONITORING_DSN) {
    // Monitoring DSN is configured but no provider is wired yet (mock phase).
  }
}
