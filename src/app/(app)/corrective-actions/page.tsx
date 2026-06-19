export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { getCorrectiveActions } from '@/lib/queries/corrective-actions'
import { CaCard } from '@/components/corrective-actions/ca-card'
import { CaFilters } from '@/components/corrective-actions/ca-filters'
import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui/button'
import { Plus, ListChecks } from 'lucide-react'
import type { CorrectiveActionStatus, CorrectiveActionPriority } from '@/types/enums'

export const metadata = {
  title: 'Corrective Actions - Event Report',
}

interface Props {
  searchParams: Promise<{
    status?: string
    priority?: string
    project_id?: string
    search?: string
  }>
}

export default async function CorrectiveActionsPage({ searchParams }: Props) {
  const params = await searchParams
  const correctiveActions = await getCorrectiveActions({
    status: params.status as CorrectiveActionStatus | undefined,
    priority: params.priority as CorrectiveActionPriority | undefined,
    project_id: params.project_id,
    search: params.search,
  })

  return (
    <div className="space-y-5 p-4 md:p-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight md:text-3xl">
            Corrective Actions
          </h1>
          <p className="text-sm text-muted-foreground">
            {correctiveActions.length} corrective action{correctiveActions.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/corrective-actions/new">
          <Button data-icon="inline-start">
            <Plus className="h-4 w-4" />
            New
          </Button>
        </Link>
      </div>

      <CaFilters />

      {correctiveActions.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="No corrective actions found"
          description="No corrective actions match your current filters, or none have been created yet."
          action={
            <Link href="/corrective-actions/new">
              <Button data-icon="inline-start">
                <Plus className="h-4 w-4" />
                Create Corrective Action
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {correctiveActions.map((ca, i) => (
            <div
              key={ca.id}
              className="animate-fade-up"
              style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}
            >
              <CaCard correctiveAction={ca} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
