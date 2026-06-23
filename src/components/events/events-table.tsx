import Link from 'next/link'
import { format } from 'date-fns'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { SortHeader } from '@/components/shared/sort-header'
import { ApprovalBadge } from './approval-badge'
import { EVENT_TYPE_LABELS, EVENT_CLASSIFICATION_LABELS } from '@/types/enums'
import type { Event } from '@/types/database'

export function EventsTable({ events }: { events: Event[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <SortHeader sortKey="reference">Reference</SortHeader>
          <TableHead>Type</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Classification</TableHead>
          <TableHead>Area</TableHead>
          <SortHeader sortKey="date">Date</SortHeader>
          <SortHeader sortKey="approval">Approval</SortHeader>
        </TableRow>
      </TableHeader>
      <TableBody>
        {events.map((event) => {
          const title =
            event.event_description?.trim() ||
            EVENT_CLASSIFICATION_LABELS[event.classification]
          return (
            <TableRow key={event.id} className="relative cursor-pointer">
              <TableCell className="font-mono text-xs whitespace-nowrap">
                <Link
                  href={`/events/${event.id}`}
                  className="font-medium text-foreground after:absolute after:inset-0"
                >
                  {event.reference_number}
                </Link>
              </TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {EVENT_TYPE_LABELS[event.type]}
              </TableCell>
              <TableCell className="max-w-[18rem]">
                <span className="line-clamp-1">{title}</span>
              </TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {EVENT_CLASSIFICATION_LABELS[event.classification]}
              </TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {event.specific_area || '—'}
              </TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {event.event_date
                  ? format(new Date(event.event_date), 'dd MMM yyyy')
                  : '—'}
              </TableCell>
              <TableCell>
                <ApprovalBadge level={event.approval_level} />
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
