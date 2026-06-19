import { Card, CardContent } from '@/components/ui/card'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: number | string
  icon: LucideIcon
  color: string
  index?: number
}

export function StatCard({ label, value, icon: Icon, color, index = 0 }: StatCardProps) {
  return (
    <Card
      size="sm"
      className="animate-fade-up transition-transform duration-200 hover:-translate-y-0.5"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <CardContent className="flex flex-col gap-3">
        <div className={cn('flex h-11 w-11 items-center justify-center rounded-2xl', color)}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="font-heading text-3xl leading-none font-bold tracking-tight">
            {value}
          </p>
          <p className="mt-1.5 text-xs font-medium text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}
