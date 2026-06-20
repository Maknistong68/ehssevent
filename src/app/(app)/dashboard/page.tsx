export const dynamic = 'force-dynamic'

import {
  getDashboardStats,
  getRecentEvents,
  getOpenCorrectiveActions,
  getInspectionStats,
} from '@/lib/queries/dashboard'
import { StatCard } from '@/components/dashboard/stat-card'
import { EventCard } from '@/components/events/event-card'
import { CaCard } from '@/components/corrective-actions/ca-card'
import { Card, CardContent } from '@/components/ui/card'
import {
  Layers,
  FileText,
  Clock,
  CheckCircle2,
  ListChecks,
  AlertTriangle,
  ClipboardCheck,
  TrendingUp,
} from 'lucide-react'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

export const metadata = {
  title: 'Dashboard - Event Report',
}

export default async function DashboardPage() {
  const [stats, recentEvents, openActions, inspectionStats, t] = await Promise.all([
    getDashboardStats(),
    getRecentEvents(),
    getOpenCorrectiveActions(),
    getInspectionStats(),
    getTranslations('dashboard'),
  ])

  return (
    <div className="space-y-7 p-4 md:p-6">
      <div className="hidden md:block">
        <h1 className="font-heading text-3xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">
          {t('subtitle')}
        </p>
      </div>

      <section>
        <h2 className="mb-3 px-1 font-heading text-base font-semibold tracking-tight">
          {t('events')}
        </h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard
            label={t('total')}
            value={stats.total}
            icon={Layers}
            color="bg-indigo-100 text-indigo-700"
            index={0}
          />
          <StatCard
            label={t('draft')}
            value={stats.draft}
            icon={FileText}
            color="bg-slate-100 text-slate-700"
            index={1}
          />
          <StatCard
            label={t('inProgress')}
            value={stats.in_progress}
            icon={Clock}
            color="bg-amber-100 text-amber-700"
            index={2}
          />
          <StatCard
            label={t('closed')}
            value={stats.closed}
            icon={CheckCircle2}
            color="bg-emerald-100 text-emerald-700"
            index={3}
          />
        </div>
      </section>

      <section>
        <h2 className="mb-3 px-1 font-heading text-base font-semibold tracking-tight">
          {t('correctiveActions')}
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label={t('openActions')}
            value={stats.open_actions}
            icon={ListChecks}
            color="bg-sky-100 text-sky-700"
            index={0}
          />
          <StatCard
            label={t('overdue')}
            value={stats.overdue_actions}
            icon={AlertTriangle}
            color="bg-red-100 text-red-700"
            index={1}
          />
        </div>
      </section>

      {(inspectionStats.total > 0 || inspectionStats.completed_this_month > 0) && (
        <section>
          <h2 className="mb-3 px-1 font-heading text-base font-semibold tracking-tight">
            {t('inspections')}
          </h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <StatCard
              label={t('totalInspections')}
              value={inspectionStats.total}
              icon={ClipboardCheck}
              color="bg-indigo-100 text-indigo-700"
              index={0}
            />
            <StatCard
              label={t('completedThisMonth')}
              value={inspectionStats.completed_this_month}
              icon={CheckCircle2}
              color="bg-emerald-100 text-emerald-700"
              index={1}
            />
            <Link href="/inspections" className="animate-fade-up animate-delay-150">
              <Card size="sm" className="h-full transition-transform duration-200 hover:-translate-y-0.5">
                <CardContent className="flex flex-col gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/30 text-brand-green">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-heading text-3xl leading-none font-bold tracking-tight">
                      {inspectionStats.average_score !== null
                        ? `${inspectionStats.average_score.toFixed(1)}%`
                        : 'N/A'}
                    </p>
                    <p className="mt-1.5 text-xs font-medium text-muted-foreground">
                      {t('avgCompliance')}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </section>
      )}

      {(stats.deadline_24h_overdue > 0 || stats.deadline_3day_overdue > 0 || stats.deadline_24h_approaching > 0) && (
        <section>
          <h2 className="mb-3 px-1 font-heading text-base font-semibold tracking-tight">
            {t('deadlines')}
          </h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {stats.deadline_24h_overdue > 0 && (
              <StatCard
                label={t('overdue24h')}
                value={stats.deadline_24h_overdue}
                icon={AlertTriangle}
                color="bg-red-100 text-red-700"
                index={0}
              />
            )}
            {stats.deadline_3day_overdue > 0 && (
              <StatCard
                label={t('overdue3day')}
                value={stats.deadline_3day_overdue}
                icon={AlertTriangle}
                color="bg-orange-100 text-orange-700"
                index={1}
              />
            )}
            {stats.deadline_24h_approaching > 0 && (
              <StatCard
                label={t('approaching')}
                value={stats.deadline_24h_approaching}
                icon={Clock}
                color="bg-amber-100 text-amber-700"
                index={2}
              />
            )}
          </div>
        </section>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-heading text-base font-semibold tracking-tight">
              {t('recentEvents')}
            </h2>
            <Link
              href="/events"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              View all
            </Link>
          </div>
          {recentEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('noEvents')}</p>
          ) : (
            <div className="space-y-3">
              {recentEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-heading text-base font-semibold tracking-tight">
              {t('openCorrectiveActions')}
            </h2>
            <Link
              href="/corrective-actions"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              View all
            </Link>
          </div>
          {openActions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t('noOpenActions')}
            </p>
          ) : (
            <div className="space-y-3">
              {openActions.map((ca) => (
                <CaCard key={ca.id} correctiveAction={ca} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
