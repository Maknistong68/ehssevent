'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { parseStoredPhotoRef } from '@/lib/storage'
import { INCIDENT_RETENTION_YEARS } from '@/lib/constants/legal'
import { logger } from '@/lib/observability/logger'

export interface RetentionPurgeSummary {
  cutoff: string
  scanned: number
  purgedEvents: number
  deletedPhotos: number
  errors: string[]
}

/** Default max events processed per run, so a backlog can't run unbounded. */
const DEFAULT_BATCH = 500

function cutoffDate(years: number): Date {
  const d = new Date()
  d.setUTCFullYear(d.getUTCFullYear() - years)
  return d
}

/**
 * Scheduled retention/destruction job (PDPL data-minimization + storage
 * limitation). Destroys HSE incident records — and their attached photos —
 * once they pass the `INCIDENT_RETENTION_YEARS` labor-law retention period,
 * writing an immutable `audit_logs` row per purge so the destruction is
 * demonstrable.
 *
 * Runs with the service-role client (no user session): it is invoked by a
 * KSA-resident scheduler via the secured `/api/cron/retention` route. Deleting
 * an event cascades to its `event_responses`; corrective actions are detached
 * (their `event_id` is nulled) and retained on their own lifecycle.
 */
export async function runRetentionPurge(
  batchSize = DEFAULT_BATCH
): Promise<RetentionPurgeSummary> {
  const admin = createAdminClient()
  const cutoff = cutoffDate(INCIDENT_RETENTION_YEARS)
  const errors: string[] = []
  let deletedPhotos = 0
  let purgedEvents = 0

  // Oldest first; records age out by creation time (always present).
  const { data: expired, error } = await admin
    .from('events')
    .select(
      'id, reference_number, creator_org_id, created_at, photo_urls, closeout_photo_urls'
    )
    .lt('created_at', cutoff.toISOString())
    .order('created_at', { ascending: true })
    .limit(batchSize)

  if (error) {
    return {
      cutoff: cutoff.toISOString(),
      scanned: 0,
      purgedEvents: 0,
      deletedPhotos: 0,
      errors: [error.message],
    }
  }

  const events = expired ?? []

  for (const event of events) {
    const eventId = event.id as string
    try {
      // Gather every photo reference for this event: the event's own photos,
      // its closeout photos, and any attached to its responses.
      const refs: string[] = [
        ...((event.photo_urls as string[] | null) ?? []),
        ...((event.closeout_photo_urls as string[] | null) ?? []),
      ]

      const { data: responses } = await admin
        .from('event_responses')
        .select('photo_urls')
        .eq('event_id', eventId)
      for (const r of responses ?? []) {
        refs.push(...((r.photo_urls as string[] | null) ?? []))
      }

      // Group storage paths by bucket and remove them.
      const byBucket = new Map<string, string[]>()
      for (const ref of refs) {
        const parsed = parseStoredPhotoRef(ref)
        if (!parsed) continue
        const list = byBucket.get(parsed.bucket) ?? []
        list.push(parsed.path)
        byBucket.set(parsed.bucket, list)
      }
      for (const [bucket, paths] of byBucket) {
        if (paths.length === 0) continue
        const { error: rmError } = await admin.storage
          .from(bucket)
          .remove(paths)
        if (rmError) {
          errors.push(
            `storage ${bucket} (event ${eventId}): ${rmError.message}`
          )
        } else {
          deletedPhotos += paths.length
        }
      }

      // Delete the event row (cascades to event_responses).
      const { error: delError } = await admin
        .from('events')
        .delete()
        .eq('id', eventId)
      if (delError) {
        errors.push(`delete event ${eventId}: ${delError.message}`)
        continue
      }
      purgedEvents += 1

      // Demonstrable destruction: write an immutable, org-scoped audit row.
      await admin.from('audit_logs').insert({
        organization_id: event.creator_org_id,
        actor_id: null,
        actor_email: 'system:retention',
        action: 'retention.purge',
        target_table: 'events',
        target_id: eventId,
        target_label: event.reference_number as string,
        metadata: {
          reason: 'incident retention period elapsed',
          retention_years: INCIDENT_RETENTION_YEARS,
          created_at: event.created_at,
          photos_deleted: byBucket.size > 0,
        },
      })
    } catch (err) {
      errors.push(
        `event ${eventId}: ${err instanceof Error ? err.message : String(err)}`
      )
    }
  }

  const summary: RetentionPurgeSummary = {
    cutoff: cutoff.toISOString(),
    scanned: events.length,
    purgedEvents,
    deletedPhotos,
    errors,
  }
  logger.info('retention.purge.complete', { ...summary, errors: errors.length })
  return summary
}
