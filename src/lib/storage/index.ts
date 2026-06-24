// Object-storage seam backed by Supabase Storage.
//
// Uploads run from the browser using the authenticated Supabase client; the
// `observation-photos` bucket is public, so the returned URL is a durable
// public URL that survives refresh and redeploys. Storage RLS allows any
// authenticated user to insert and anyone to read (see 0002_rls.sql).

import { createClient } from '@/lib/supabase/client'

export interface StorageObject {
  /** Storage key within the bucket, shaped like `uuid-filename`. */
  key: string
  /** Durable public URL for the uploaded object. */
  url: string
  bucket: string
  filename: string
  size: number
  content_type: string
  uploaded_at: string
}

/**
 * Uploads a file to the given bucket and returns a StorageObject whose `url`
 * is a durable public URL usable immediately by the UI.
 */
export async function uploadToStorage(
  file: File,
  bucket = 'observation-photos'
): Promise<StorageObject> {
  const supabase = createClient()
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const key = `${crypto.randomUUID()}-${safeName}`

  const { error } = await supabase.storage.from(bucket).upload(key, file, {
    cacheControl: '3600',
    contentType: file.type || undefined,
    upsert: false,
  })
  if (error) throw new Error(error.message)

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(key)

  return {
    key,
    url: publicUrl,
    bucket,
    filename: file.name,
    size: file.size,
    content_type: file.type,
    uploaded_at: new Date().toISOString(),
  }
}
