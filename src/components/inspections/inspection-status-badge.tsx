import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  INSPECTION_STATUS_LABELS,
  INSPECTION_STATUS_COLORS,
  type InspectionStatus,
} from '@/types/enums'

interface InspectionStatusBadgeProps {
  status: InspectionStatus
  className?: string
}

export function InspectionStatusBadge({
  status,
  className,
}: InspectionStatusBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className={cn(INSPECTION_STATUS_COLORS[status], className)}
    >
      {INSPECTION_STATUS_LABELS[status]}
    </Badge>
  )
}
