import { NextResponse, type NextRequest } from 'next/server'
import { enforceRateLimit } from '@/lib/rate-limit'
import { requireUser } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { logAudit } from '@/lib/actions/audit'
import { ADMIN_ROLES } from '@/types/enums'

// Buckets the proxy is willing to serve. `observation-photos` is private and
// org-scoped (see 0002_rls.sql); the legacy names are accepted only so any
// pre-existing references still resolve through the same authenticated path.
const ALLOWED_BUCKETS = new Set([
  'observation-photos',
  'event-photos',
  'inspection-photos',
])

/**
 * Authenticated proxy for PDPL-sensitive observation photos.
 *
 * Photos can contain injuries/faces, so the bucket is private. This handler
 * resolves the real session, then downloads the object through the RLS-bound
 * server client — storage RLS guarantees a user can only read objects under
 * their own organization's folder (platform admins excepted). As defence in
 * depth we also reject paths whose leading folder is not the caller's org.
 * Each successful read is written to the immutable audit log.
 */
export async function GET(request: NextRequest) {
  const limited = enforceRateLimit(request, {
    name: 'photos',
    limit: 120,
    windowMs: 60_000,
  })
  if (limited) return limited

  const auth = await requireUser()
  if (!auth.ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const bucket = searchParams.get('bucket') ?? ''
  const path = searchParams.get('path') ?? ''

  if (!ALLOWED_BUCKETS.has(bucket) || !path) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  // Reject traversal / absolute paths outright.
  if (path.includes('..') || path.startsWith('/')) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Defence in depth: the object's leading folder must be the caller's org,
  // unless they are a platform admin. RLS enforces this too, but failing fast
  // avoids leaking the existence of cross-tenant objects.
  const isPlatformAdmin = ADMIN_ROLES.includes(auth.profile.role)
  const orgFolder = path.split('/')[0]
  if (!isPlatformAdmin && orgFolder !== auth.profile.organization_id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase.storage.from(bucket).download(path)
  if (error || !data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Accountability: record sensitive-photo access. Best-effort — never block
  // (or fail) the response on an audit-write error.
  try {
    await logAudit({
      action: 'photo.access',
      target_table: 'storage.objects',
      target_id: `${bucket}/${path}`,
      target_label: orgFolder,
      metadata: { bucket },
    })
  } catch {
    // swallow — audit must not break image delivery
  }

  const buffer = await data.arrayBuffer()
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': data.type || 'application/octet-stream',
      // Private, per-user content: do not let shared caches store it.
      'Cache-Control': 'private, max-age=300',
      'X-Content-Type-Options': 'nosniff',
      'Content-Disposition': 'inline',
    },
  })
}
