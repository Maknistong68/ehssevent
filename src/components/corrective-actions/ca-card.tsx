import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { CaStatusBadge } from './ca-status-badge'
import { CaPriorityBadge } from './ca-priority-badge'
import { User, CalendarDays, FileText, ClipboardCheck } from 'lucide-react'
import { format } from 'date-fns'
import type { CorrectiveAction } from '@/types/database'

interface CaCardProps {
  correctiveAction: CorrectiveAction
}

export function CaCard({ correctiveAction }: CaCardProps) {
  const assignee = correctiveAction.assignee
  const event = correctiveAction.event
  const inspection = correctiveAction.inspection

  return (
    <Link href={`/corrective-actions/${correctiveAction.id}`} className="block">
      <Card
        size="sm"
        className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-soft-lg active:scale-[0.99]"
      >
        <CardContent className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[0.7rem] tracking-wide text-muted-foreground">
                {correctiveAction.reference_number}
              </p>
              <h3 className="mt-1 line-clamp-2 font-heading text-sm font-semibold tracking-tight">
                {correctiveAction.title}
              </h3>
            </div>
            <CaStatusBadge status={correctiveAction.status} />
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
            <CaPriorityBadge priority={correctiveAction.priority} />
            {event?.reference_number && (
              <span className="flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                {event.reference_number}
              </span>
            )}
            {inspection?.reference_number && (
              <span className="flex items-center gap-1.5">
                <ClipboardCheck className="h-3.5 w-3.5" />
                {inspection.reference_number}
                {correctiveAction.item_label && (
                  <span className="text-muted-foreground/80">
                    · {correctiveAction.item_label}
                  </span>
                )}
              </span>
            )}
            {assignee && (
              <span className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                {assignee.full_name || assignee.email}
              </span>
            )}
            {correctiveAction.due_date && (
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                {format(new Date(correctiveAction.due_date), 'dd MMM yyyy')}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
