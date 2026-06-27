import { NextResponse, type NextRequest } from 'next/server'
import { env } from '@/lib/env'
import { runRetentionPurge } from '@/lib/actions/retention'

/**
 * Secured trigger for the scheduled retention/destruction job (B8). A
 * KSA-resident scheduler calls this with the shared `CRON_SECRET` as a Bearer
 * token (or `x-cron-secret` header). Destroys HSE incident records past their
 * 10-year retention period and audit-logs each purge.
 *
 * Returns 404 (not 401) when the secret is unset/incorrect so the endpoint's
 * existence isn't advertised to unauthenticated callers.
 */
export async function POST(request: NextRequest) {
  const secret = env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const bearer = request.headers
    .get('authorization')
    ?.replace(/^Bearer\s+/i, '')
  const provided = bearer || request.headers.get('x-cron-secret')
  if (provided !== secret) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const summary = await runRetentionPurge()
  return NextResponse.json(summary, { status: 200 })
}
