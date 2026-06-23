import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  CA_PRIORITY_LABELS,
  CA_PRIORITY_COLORS,
  type CorrectiveActionPriority,
} from '@/types/enums'

interface CaPriorityBadgeProps {
  priority: CorrectiveActionPriority
  className?: string
}

export function CaPriorityBadge({ priority, className }: CaPriorityBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className={cn(CA_PRIORITY_COLORS[priority], className)}
    >
      {CA_PRIORITY_LABELS[priority]}
    </Badge>
  )
}
