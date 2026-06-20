export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { getEvents } from '@/lib/queries/events'
import { EventCard } from '@/components/events/event-card'
import { EventsTable } from '@/components/events/events-table'
import { EventFilters } from '@/components/events/event-filters'
import { EmptyState } from '@/components/shared/empty-state'
import { Pagination } from '@/components/shared/pagination'
import { Button } from '@/components/ui/button'
import { Plus, Calendar } from 'lucide-react'
import { sortItems, paginate, parsePageParams } from '@/lib/list-utils'
import { EVENT_APPROVAL_LABELS } from '@/types/enums'
import type {
  EventApprovalLevel,
  EventType,
  EventClassification,
} from '@/types/enums'
import type { Event } from '@/types/database'

export const metadata = {
  title: 'Events - Event Report',
}

const APPROVAL_ORDER = Object.keys(EVENT_APPROVAL_LABELS) as EventApprovalLevel[]

const eventAccessors = {
  reference: (e: Event) => e.reference_number,
  date: (e: Event) => (e.event_date ? new Date(e.event_date) : null),
  approval: (e: Event) => APPROVAL_ORDER.indexOf(e.approval_level),
}

interface Props {
  searchParams: Promise<{
    approval_level?: string
    type?: string
    classification?: string
    project_id?: string
    search?: string
    sort?: string
    dir?: string
    page?: string
    per?: string
  }>
}

export default async function EventsPage({ searchParams }: Props) {
  const params = await searchParams

  const events = await getEvents({
    approval_level: params.approval_level as EventApprovalLevel | undefined,
    type: params.type as EventType | undefined,
    classification: params.classification as EventClassification | undefined,
    project_id: params.project_id,
    search: params.search,
  })

  const sorted = sortItems(events, params.sort, params.dir, eventAccessors)
  const { page, per } = parsePageParams(params)
  const { pageItems, total, totalPages, from, to, page: currentPage } = paginate(sorted, page, per)

  return (
    <div className="space-y-5 p-4 md:p-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight md:text-3xl">
            Events
          </h1>
          <p className="text-sm text-muted-foreground">
            {events.length} event{events.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/events/new">
            <Button data-icon="inline-start">
              <Plus className="h-4 w-4" />
              New
            </Button>
          </Link>
        </div>
      </div>

      <EventFilters />

      {events.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No events found"
          description="No events match your current filters, or none have been created yet."
          action={
            <Link href="/events/new">
              <Button data-icon="inline-start">
                <Plus className="h-4 w-4" />
                Create Event
              </Button>
            </Link>
          }
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block">
            <EventsTable events={pageItems} />
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {pageItems.map((event, i) => (
              <div
                key={event.id}
                className="animate-fade-up"
                style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}
              >
                <EventCard event={event} />
              </div>
            ))}
          </div>

          <Pagination
            total={total}
            page={currentPage}
            per={per}
            totalPages={totalPages}
            from={from}
            to={to}
          />
        </>
      )}
    </div>
  )
}
