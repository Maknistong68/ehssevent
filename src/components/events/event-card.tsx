import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { ApprovalBadge } from './approval-badge'
import { MapPin, CalendarDays } from 'lucide-react'
import { format } from 'date-fns'
import { EVENT_TYPE_LABELS, EVENT_CLASSIFICATION_LABELS } from '@/types/enums'
import type { Event } from '@/types/database'

export function EventCard({ event }: { event: Event }) {
  const classificationLabel = event.classification
    ? EVENT_CLASSIFICATION_LABELS[event.classification]
    : ''
  const title = event.event_description?.trim() || classificationLabel

  return (
    <Link href={`/events/${event.id}`} className="block">
      <Card
        size="sm"
        className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-soft-lg active:scale-[0.99]"
      >
        <CardContent className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[0.7rem] tracking-wide text-muted-foreground">
                {event.reference_number} · {EVENT_TYPE_LABELS[event.type]}
              </p>
              <h3 className="mt-1 line-clamp-2 font-heading text-sm font-semibold tracking-tight">
                {title}
              </h3>
            </div>
            <ApprovalBadge level={event.approval_level} />
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
            {classificationLabel && (
              <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 font-medium">
                {classificationLabel}
              </span>
            )}
            {event.specific_area && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {event.specific_area}
              </span>
            )}
            {event.event_date && (
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                {format(new Date(event.event_date), 'dd MMM yyyy')}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
