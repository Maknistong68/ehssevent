import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: React.ReactNode
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex animate-fade-up flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card/50 px-4 py-12 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary text-brand-green-soft">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="mb-1 font-heading text-lg font-semibold tracking-tight">{title}</h3>
      <p className="mb-4 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action}
    </div>
  )
}
