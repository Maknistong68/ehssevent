// Mock object-storage seam.
//
// In mock mode an "upload" creates a local object URL and a fake storage key,
// recording an access-log entry so uploads are observable during the running
// session. This keeps the call sites identical to a real storage backend.
//
// TODO(prod): replace with real object storage (e.g. Supabase Storage):
//   - upload the File to `bucket` under a server-generated key,
//   - return the durable public/signed URL + key,
//   - write the access-log entry server-side (RLS-protected, append-only).

export interface StorageObject {
  /** Fake storage key, shaped like `bucket/uuid-filename`. */
  key: string
  /** Accessible URL for the uploaded object (an object URL in mock mode). */
  url: string
  bucket: string
  filename: string
  size: number
  content_type: string
  uploaded_at: string
}

// In-memory access log of uploads performed this session (mock only).
export const STORAGE_ACCESS_LOG: StorageObject[] = []

/**
 * "Uploads" a file to the given bucket. Returns a StorageObject whose `url` is
 * usable immediately by the UI. The upload is recorded in STORAGE_ACCESS_LOG.
 */
export function uploadToStorage(
  file: File,
  bucket = 'observation-photos'
): StorageObject {
  const key = `${bucket}/${crypto.randomUUID()}-${file.name}`
  const record: StorageObject = {
    key,
    url: URL.createObjectURL(file),
    bucket,
    filename: file.name,
    size: file.size,
    content_type: file.type,
    uploaded_at: new Date().toISOString(),
  }
  STORAGE_ACCESS_LOG.push(record)
  return record
}
