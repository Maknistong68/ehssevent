import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Clock, CheckCircle2 } from 'lucide-react'
import type { Event } from '@/types/database'

interface DeadlineBadgeProps {
  event: Event
}

export function DeadlineBadge({ event }: DeadlineBadgeProps) {
  if (!event.reporting_deadline_24h) return null

  // Already met both deadlines
  if (event.deadline_24h_met && event.deadline_3day_met) {
    return (
      <Badge variant="secondary" className="bg-green-100 text-green-800 gap-1">
        <CheckCircle2 className="h-3 w-3" />
        On time
      </Badge>
    )
  }

  const now = new Date()
  const deadline24h = new Date(event.reporting_deadline_24h)
  const deadline3day = event.reporting_deadline_3day
    ? new Date(event.reporting_deadline_3day)
    : null

  // 24h deadline overdue
  if (!event.deadline_24h_met && deadline24h < now) {
    return (
      <Badge variant="secondary" className="bg-red-100 text-red-800 gap-1">
        <AlertTriangle className="h-3 w-3" />
        24h overdue
      </Badge>
    )
  }

  // 3-day deadline overdue
  if (!event.deadline_3day_met && deadline3day && deadline3day < now) {
    return (
      <Badge variant="secondary" className="bg-orange-100 text-orange-800 gap-1">
        <AlertTriangle className="h-3 w-3" />
        3-day overdue
      </Badge>
    )
  }

  // Approaching 24h deadline (within 4 hours)
  if (!event.deadline_24h_met) {
    const hoursLeft = Math.max(0, Math.floor((deadline24h.getTime() - now.getTime()) / (1000 * 60 * 60)))
    if (hoursLeft <= 4) {
      return (
        <Badge variant="secondary" className="bg-amber-100 text-amber-800 gap-1">
          <Clock className="h-3 w-3" />
          {hoursLeft}h left
        </Badge>
      )
    }
  }

  return null
}
