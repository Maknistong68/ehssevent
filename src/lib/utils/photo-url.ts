const ALLOWED_BUCKETS = ['event-photos', 'observation-photos', 'inspection-photos']

/**
 * Converts a Supabase public URL to a secure proxy URL.
 * Non-Supabase URLs are returned as-is.
 *
 * Input:  https://xxx.supabase.co/storage/v1/object/public/event-photos/uploads/abc.jpg
 * Output: /api/photos?bucket=event-photos&path=uploads/abc.jpg
 */
export function toSecurePhotoUrl(publicUrl: string): string {
  try {
    const url = new URL(publicUrl)

    // Check if it's a Supabase storage URL
    const match = url.pathname.match(
      /\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/
    )
    if (!match) return publicUrl

    const [, bucket, path] = match
    if (!ALLOWED_BUCKETS.includes(bucket)) return publicUrl

    return `/api/photos?bucket=${encodeURIComponent(bucket)}&path=${encodeURIComponent(path)}`
  } catch {
    return publicUrl
  }
}
