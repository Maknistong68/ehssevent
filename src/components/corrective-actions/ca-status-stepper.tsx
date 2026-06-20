import { Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CorrectiveActionStatus } from '@/types/enums'

const STEPS = ['Open', 'Ready for Approval', 'Approved'] as const

function currentIndex(status: CorrectiveActionStatus): number {
  switch (status) {
    case 'open':
    case 'in_progress':
      return 0
    case 'pending_approval':
      return 1
    case 'approved':
    case 'rejected':
      return 2
  }
}

export function CaStatusStepper({ status }: { status: CorrectiveActionStatus }) {
  const active = currentIndex(status)
  const rejected = status === 'rejected'

  return (
    <div className="flex items-center gap-1">
      {STEPS.map((step, i) => {
        const isLast = i === STEPS.length - 1
        const isRejectedNode = isLast && rejected
        const completed = i < active || (i === active && status === 'approved')
        const isCurrent = i === active
        const label = isRejectedNode ? 'Rejected' : step

        return (
          <div key={step} className="flex items-center gap-1">
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[0.65rem] font-semibold transition-colors',
                  isRejectedNode
                    ? 'border-red-600 bg-red-600 text-white'
                    : completed
                      ? 'border-primary bg-primary text-primary-foreground'
                      : isCurrent
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-muted-foreground/30 bg-transparent text-muted-foreground/50'
                )}
              >
                {isRejectedNode ? (
                  <X className="h-3 w-3" />
                ) : completed ? (
                  <Check className="h-3 w-3" />
                ) : (
                  i + 1
                )}
              </span>
              <span
                className={cn(
                  'whitespace-nowrap text-xs font-medium',
                  isRejectedNode
                    ? 'text-red-600'
                    : completed || isCurrent
                      ? 'text-foreground'
                      : 'text-muted-foreground/50'
                )}
              >
                {label}
              </span>
            </div>
            {!isLast && (
              <span
                className={cn(
                  'h-px w-5 shrink-0',
                  i < active ? 'bg-primary' : 'bg-muted-foreground/25'
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
