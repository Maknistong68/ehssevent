import { MOCK_DSR_REQUESTS } from '@/lib/mock-data'
import type { DsrRequest } from '@/types/database'

/** All data-subject requests, newest first, for the admin DSR queue. */
export async function getDsrRequests(): Promise<DsrRequest[]> {
  return [...MOCK_DSR_REQUESTS].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
}
