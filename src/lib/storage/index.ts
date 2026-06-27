// Object-storage seam backed by Supabase Storage.
//
// Uploads run from the browser using the authenticated Supabase client. The
// `observation-photos` bucket is PRIVATE (see 0002_rls.sql): photos can show
// injuries/faces (PDPL-sensitive data), so there is no durable public URL.
// Objects are written under an org-scoped path (`{organization_id}/{uuid-name}`)
// — storage RLS rejects writes outside the caller's own org folder — and are
// later served through the authenticated `/api/photos` proxy, which streams
// the bytes under RLS and audits each access.

import { createClient } from '@/lib/supabase/client'

/** The private bucket holding event / inspection / CA observation photos. */
export const OBSERVATION_PHOTOS_BUCKET = 'observation-photos'

export interface StorageObject {
  /** Storage key within the bucket, shaped like `{org_id}/{uuid}-filename`. */
  key: string
  /** Authenticated proxy URL for the object (`/api/photos?...`). */
  url: string
  bucket: string
  filename: string
  size: number
  content_type: string
  uploaded_at: string
}

/** Builds the authenticated proxy URL the UI stores and renders. */
export function photoProxyUrl(bucket: string, key: string): string {
  return `/api/photos?bucket=${encodeURIComponent(bucket)}&path=${encodeURIComponent(key)}`
}

/**
 * Resolves a stored photo reference back to its `{ bucket, path }` so the
 * retention/destruction job can delete the underlying object. Accepts both the
 * current proxy form (`/api/photos?bucket=..&path=..`) and any legacy Supabase
 * public URL (`/storage/v1/object/public/{bucket}/{path}`). Returns null if it
 * cannot be parsed.
 */
export function parseStoredPhotoRef(
  ref: string
): { bucket: string; path: string } | null {
  if (!ref) return null

  // Proxy form (may be relative, so guard the URL parse with a dummy origin).
  if (ref.startsWith('/api/photos') || ref.includes('/api/photos?')) {
    try {
      const u = new URL(ref, 'http://localhost')
      const bucket = u.searchParams.get('bucket')
      const path = u.searchParams.get('path')
      if (bucket && path) return { bucket, path }
    } catch {
      return null
    }
    return null
  }

  // Legacy public URL form.
  try {
    const u = new URL(ref)
    const m = u.pathname.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/)
    if (m) return { bucket: m[1], path: decodeURIComponent(m[2]) }
  } catch {
    return null
  }
  return null
}

/**
 * Uploads a file to the given private bucket and returns a StorageObject whose
 * `url` is an authenticated proxy URL (not a public URL). The object is keyed
 * under the caller's organization folder so storage RLS keeps it tenant-scoped.
 */
export async function uploadToStorage(
  file: File,
  bucket = OBSERVATION_PHOTOS_BUCKET
): Promise<StorageObject> {
  const supabase = createClient()

  // Resolve the caller's org so the object lands in the tenant-scoped folder
  // that storage RLS enforces. RLS lets a user read their own profile row.
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('You must be signed in to upload photos.')

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()
  const orgId = profile?.organization_id as string | null
  if (!orgId) {
    throw new Error('Your account is not assigned to an organization.')
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const key = `${orgId}/${crypto.randomUUID()}-${safeName}`

  const { error } = await supabase.storage.from(bucket).upload(key, file, {
    cacheControl: '3600',
    contentType: file.type || undefined,
    upsert: false,
  })
  if (error) throw new Error(error.message)

  return {
    key,
    url: photoProxyUrl(bucket, key),
    bucket,
    filename: file.name,
    size: file.size,
    content_type: file.type,
    uploaded_at: new Date().toISOString(),
  }
}
