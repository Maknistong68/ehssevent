export const dynamic = 'force-dynamic'

import {
  getAllCorrectiveActions,
  getAllEvents,
  getMyPendingCorrectiveActions,
} from '@/lib/queries/dashboard'
import { CaCard } from '@/components/corrective-actions/ca-card'
import { CaStatusStepper } from '@/components/corrective-actions/ca-status-stepper'
import { MyCaTable } from '@/components/dashboard/my-ca-table'
import { DashboardOverview } from '@/components/dashboard/dashboard-overview'
import { getTranslations } from 'next-intl/server'

export const metadata = {
  title: 'Dashboard - Event Report',
}

export default async function DashboardPage() {
  const [myActions, events, correctiveActions, t] = await Promise.all([
    getMyPendingCorrectiveActions(),
    getAllEvents(),
    getAllCorrectiveActions(),
    getTranslations('dashboard'),
  ])

  return (
    <div className="space-y-7 p-4 md:p-6">
      <DashboardOverview events={events} correctiveActions={correctiveActions} />

      <div className="space-y-3">
        <h2 className="font-heading text-base font-semibold tracking-tight px-1">
          {t('myCorrectiveActions')}
        </h2>

        {myActions.length === 0 ? (
          <p className="text-sm text-muted-foreground px-1">{t('noMyActions')}</p>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block">
              <MyCaTable correctiveActions={myActions} />
            </div>

            {/* Mobile cards */}
            <div className="space-y-3 md:hidden">
              {myActions.map((ca) => (
                <div key={ca.id} className="space-y-2">
                  <CaCard correctiveAction={ca} />
                  <div className="px-1">
                    <CaStatusStepper status={ca.status} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
