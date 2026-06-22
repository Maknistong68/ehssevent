import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Clock } from 'lucide-react'

interface OverdueBadgeProps {
  className?: string
}

export function OverdueBadge({ className }: OverdueBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className={cn('bg-red-100 text-red-700', className)}
      data-icon="inline-start"
    >
      <Clock className="h-3 w-3" />
      Overdue
    </Badge>
  )
}
