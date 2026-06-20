'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Eye, AlertTriangle, ClipboardCheck, Clock } from 'lucide-react'
import { useAuth } from '@/components/auth/auth-provider'
import { KpiCard } from '@/components/dashboard/kpi-card'
import { cn } from '@/lib/utils'
import {
  DATE_RANGES,
  inRange,
  isNew,
  referenceDate,
  type DateRange,
} from '@/lib/utils/date-range'
import type { CorrectiveAction, Event } from '@/types/database'

interface DashboardOverviewProps {
  events: Event[]
  correctiveActions: CorrectiveAction[]
}

const FILTER_LABEL_KEYS: Record<DateRange, string> = {
  all: 'filterAll',
  '6m': 'filter6m',
  '3m': 'filter3m',
  '1m': 'filter1m',
  w: 'filterWeek',
}

const pending = (ca: CorrectiveAction) =>
  ca.status !== 'approved' && ca.status !== 'rejected'

export function DashboardOverview({
  events,
  correctiveActions,
}: DashboardOverviewProps) {
  const t = useTranslations('dashboard')
  const tHeader = useTranslations('header')
  const { effectiveProfile } = useAuth()
  const [range, setRange] = useState<DateRange>('all')

  const name =
    effectiveProfile?.full_name || effectiveProfile?.email?.split('@')[0] || ''

  const ref = useMemo(
    () =>
      referenceDate([
        ...events.map((e) => e.created_at),
        ...correctiveActions.map((ca) => ca.created_at),
      ]),
    [events, correctiveActions]
  )

  const isOverdue = (ca: CorrectiveAction) =>
    ca.due_date != null && new Date(ca.due_date).getTime() < ref.getTime()

  const kpis = useMemo(() => {
    const rangeEvents = events.filter((e) => inRange(e.created_at, range, ref))
    const rangeCas = correctiveActions.filter((ca) =>
      inRange(ca.created_at, range, ref)
    )

    // Total Observations
    const totalObservations = rangeEvents.length
    const newEvents = rangeEvents.filter((e) => isNew(e.created_at, ref)).length
    const draftEvents = rangeEvents.filter(
      (e) => e.approval_level === 'draft'
    ).length
    const observationsBadge = newEvents > 0 ? newEvents : draftEvents

    // Pending CAs (Events)
    const pendingEventCas = rangeCas.filter(
      (ca) => ca.event_id != null && pending(ca)
    )
    const newEventCas = pendingEventCas.filter((ca) =>
      isNew(ca.created_at, ref)
    ).length
    const overdueEventCas = pendingEventCas.filter(isOverdue).length
    const eventCasBadge = newEventCas > 0 ? newEventCas : overdueEventCas

    // Pending CAs (Inspections)
    const pendingInspectionCas = rangeCas.filter(
      (ca) => ca.inspection_id != null && pending(ca)
    )
    const newInspectionCas = pendingInspectionCas.filter((ca) =>
      isNew(ca.created_at, ref)
    ).length
    const overdueInspectionCas = pendingInspectionCas.filter(isOverdue).length
    const inspectionCasBadge =
      newInspectionCas > 0 ? newInspectionCas : overdueInspectionCas

    // Overdue CAs
    const overdueCas = rangeCas.filter((ca) => pending(ca) && isOverdue(ca))
    const overdueBadge = overdueCas.length

    return {
      totalObservations,
      observationsBadge,
      pendingEventCas: pendingEventCas.length,
      eventCasBadge,
      pendingInspectionCas: pendingInspectionCas.length,
      inspectionCasBadge,
      overdueCas: overdueCas.length,
      overdueBadge,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, correctiveActions, range, ref])

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-muted-foreground">{tHeader('welcomeBack')},</p>
        <h1 className="font-heading text-2xl font-bold tracking-tight md:text-3xl">
          {name}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>

      <div className="-mx-1 overflow-x-auto px-1">
        <div className="inline-flex rounded-full bg-muted p-1">
          {DATE_RANGES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={cn(
                'rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors',
                range === r
                  ? 'bg-background font-semibold shadow-soft'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {t(FILTER_LABEL_KEYS[r])}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <KpiCard
          label={t('totalObservations')}
          value={kpis.totalObservations}
          icon={Eye}
          color="bg-primary/10 text-primary"
          badge={kpis.observationsBadge}
          href="/events"
          index={0}
        />
        <KpiCard
          label={t('pendingCaEvents')}
          value={kpis.pendingEventCas}
          icon={AlertTriangle}
          color="bg-amber-100 text-amber-700"
          badge={kpis.eventCasBadge}
          href="/corrective-actions"
          index={1}
        />
        <KpiCard
          label={t('pendingCaInspections')}
          value={kpis.pendingInspectionCas}
          icon={ClipboardCheck}
          color="bg-blue-100 text-blue-700"
          badge={kpis.inspectionCasBadge}
          href="/corrective-actions"
          index={2}
        />
        <KpiCard
          label={t('overdueActions')}
          value={kpis.overdueCas}
          icon={Clock}
          color="bg-red-100 text-red-700"
          badge={kpis.overdueBadge}
          href="/corrective-actions"
          index={3}
        />
      </div>
    </div>
  )
}
