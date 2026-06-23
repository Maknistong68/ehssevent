import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  CA_STATUS_LABELS,
  CA_STATUS_COLORS,
  type CorrectiveActionStatus,
} from '@/types/enums'

interface CaStatusBadgeProps {
  status: CorrectiveActionStatus
  className?: string
}

export function CaStatusBadge({ status, className }: CaStatusBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className={cn(CA_STATUS_COLORS[status], className)}
    >
      {CA_STATUS_LABELS[status]}
    </Badge>
  )
}
