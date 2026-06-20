export const dynamic = 'force-dynamic'

import { getMyPendingCorrectiveActions } from '@/lib/queries/dashboard'
import { CaCard } from '@/components/corrective-actions/ca-card'
import { CaStatusStepper } from '@/components/corrective-actions/ca-status-stepper'
import { MyCaTable } from '@/components/dashboard/my-ca-table'
import { getTranslations } from 'next-intl/server'

export const metadata = {
  title: 'Dashboard - Event Report',
}

export default async function DashboardPage() {
  const [myActions, t] = await Promise.all([
    getMyPendingCorrectiveActions(),
    getTranslations('dashboard'),
  ])

  return (
    <div className="space-y-7 p-4 md:p-6">
      <div className="hidden md:block">
        <h1 className="font-heading text-3xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>

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
