'use client'

import { useMemo } from 'react'
import { format, subMonths, startOfMonth } from 'date-fns'
import { Card, CardContent } from '@/components/ui/card'
import {
  CA_STATUS_LABELS,
  EVENT_CLASSIFICATION_LABELS,
  type CorrectiveActionStatus,
} from '@/types/enums'
import type { CorrectiveAction, Event } from '@/types/database'

interface DashboardChartsProps {
  events: Event[]
  correctiveActions: CorrectiveAction[]
}

const STATUS_ORDER: CorrectiveActionStatus[] = [
  'open',
  'in_progress',
  'pending_approval',
  'approved',
  'rejected',
]

const STATUS_BAR_COLORS: Record<CorrectiveActionStatus, string> = {
  open: 'bg-blue-500',
  in_progress: 'bg-amber-500',
  pending_approval: 'bg-purple-500',
  approved: 'bg-emerald-500',
  rejected: 'bg-red-500',
}

function ChartCard({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <h3 className="font-heading text-sm font-semibold tracking-tight">
          {title}
        </h3>
        {children}
      </CardContent>
    </Card>
  )
}

// Vertical bar chart of event counts over the last 6 months.
function EventsOverTime({ events }: { events: Event[] }) {
  const data = useMemo(() => {
    const now = new Date()
    const buckets = Array.from({ length: 6 }, (_, i) => {
      const month = startOfMonth(subMonths(now, 5 - i))
      return { key: format(month, 'yyyy-MM'), label: format(month, 'MMM'), count: 0 }
    })
    const index = new Map(buckets.map((b, i) => [b.key, i]))
    for (const e of events) {
      const key = e.created_at.slice(0, 7)
      const i = index.get(key)
      if (i !== undefined) buckets[i].count += 1
    }
    return buckets
  }, [events])

  const max = Math.max(1, ...data.map((d) => d.count))

  return (
    <div className="flex h-40 items-end gap-2">
      {data.map((d) => (
        <div key={d.key} className="flex flex-1 flex-col items-center gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            {d.count}
          </span>
          <div className="flex w-full flex-1 items-end">
            <div
              className="w-full rounded-t-md bg-primary transition-all"
              style={{ height: `${(d.count / max) * 100}%`, minHeight: d.count > 0 ? '4px' : '0' }}
            />
          </div>
          <span className="text-xs text-muted-foreground">{d.label}</span>
        </div>
      ))}
    </div>
  )
}

// Horizontal distribution bars with a colored swatch per category.
function DistributionBars({
  rows,
}: {
  rows: { key: string; label: string; count: number; color: string }[]
}) {
  const total = rows.reduce((sum, r) => sum + r.count, 0)

  if (total === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No data yet.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {rows.map((r) => {
        const pct = Math.round((r.count / total) * 100)
        return (
          <div key={r.key} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium">{r.label}</span>
              <span className="text-muted-foreground">
                {r.count} ({pct}%)
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full ${r.color}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function DashboardCharts({
  events,
  correctiveActions,
}: DashboardChartsProps) {
  const statusRows = useMemo(
    () =>
      STATUS_ORDER.map((status) => ({
        key: status,
        label: CA_STATUS_LABELS[status],
        count: correctiveActions.filter((ca) => ca.status === status).length,
        color: STATUS_BAR_COLORS[status],
      })),
    [correctiveActions]
  )

  const classificationRows = useMemo(() => {
    const counts = new Map<string, number>()
    for (const e of events) {
      if (e.classification) {
        counts.set(e.classification, (counts.get(e.classification) ?? 0) + 1)
      }
    }
    return Array.from(counts.entries())
      .map(([key, count]) => ({
        key,
        label:
          EVENT_CLASSIFICATION_LABELS[
            key as keyof typeof EVENT_CLASSIFICATION_LABELS
          ] ?? key,
        count,
        color: 'bg-primary',
      }))
      .sort((a, b) => b.count - a.count)
  }, [events])

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <ChartCard title="Events over time">
        <EventsOverTime events={events} />
      </ChartCard>
      <ChartCard title="Corrective action status">
        <DistributionBars rows={statusRows} />
      </ChartCard>
      <ChartCard title="Event classification">
        <DistributionBars rows={classificationRows} />
      </ChartCard>
    </div>
  )
}
