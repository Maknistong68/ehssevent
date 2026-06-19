import { cn } from '@/lib/utils'
import { EVENT_APPROVAL_LABELS, EVENT_APPROVAL_COLORS } from '@/types/enums'
import type { EventApprovalLevel } from '@/types/enums'

export function ApprovalBadge({ level }: { level: EventApprovalLevel }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        EVENT_APPROVAL_COLORS[level]
      )}
    >
      {EVENT_APPROVAL_LABELS[level]}
    </span>
  )
}
