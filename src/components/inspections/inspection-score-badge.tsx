import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface InspectionScoreBadgeProps {
  score: number | null
  className?: string
}

export function InspectionScoreBadge({
  score,
  className,
}: InspectionScoreBadgeProps) {
  if (score === null) {
    return (
      <Badge
        variant="secondary"
        className={cn('bg-slate-100 text-slate-600', className)}
      >
        N/A
      </Badge>
    )
  }

  const color =
    score >= 80
      ? 'bg-green-100 text-green-800'
      : score >= 60
        ? 'bg-amber-100 text-amber-800'
        : 'bg-red-100 text-red-800'

  return (
    <Badge variant="secondary" className={cn(color, className)}>
      {score.toFixed(1)}%
    </Badge>
  )
}
