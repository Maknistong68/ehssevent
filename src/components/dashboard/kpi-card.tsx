'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Link } from '@/i18n/navigation'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface KpiCardProps {
  label: string
  value: number
  icon: LucideIcon
  color: string
  badge?: number
  href?: string
  index?: number
}

export function KpiCard({
  label,
  value,
  icon: Icon,
  color,
  badge,
  href,
  index = 0,
}: KpiCardProps) {
  const card = (
    <Card
      size="sm"
      className="relative h-full animate-fade-up transition-transform duration-200 hover:-translate-y-0.5"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {badge && badge > 0 ? (
        <span
          aria-label={`${badge} ${label}`}
          className="absolute top-3 end-3 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white"
        >
          {badge > 99 ? '99+' : badge}
        </span>
      ) : null}
      <CardContent className="flex flex-col gap-3">
        <div
          className={cn(
            'flex h-11 w-11 items-center justify-center rounded-2xl',
            color
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="font-heading text-3xl leading-none font-bold tracking-tight">
            {value}
          </p>
          <p className="mt-1.5 text-xs font-medium text-muted-foreground">
            {label}
          </p>
        </div>
      </CardContent>
    </Card>
  )

  if (href) {
    return (
      <Link href={href} className="block h-full">
        {card}
      </Link>
    )
  }

  return card
}
