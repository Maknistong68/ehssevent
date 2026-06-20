export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { getCorrectiveActions } from '@/lib/queries/corrective-actions'
import { CaCard } from '@/components/corrective-actions/ca-card'
import { CaTable } from '@/components/corrective-actions/ca-table'
import { CaFilters } from '@/components/corrective-actions/ca-filters'
import { EmptyState } from '@/components/shared/empty-state'
import { Pagination } from '@/components/shared/pagination'
import { Button } from '@/components/ui/button'
import { Plus, ListChecks } from 'lucide-react'
import { sortItems, paginate, parsePageParams } from '@/lib/list-utils'
import type { CorrectiveActionStatus, CorrectiveActionPriority } from '@/types/enums'
import type { CorrectiveAction } from '@/types/database'

export const metadata = {
  title: 'Corrective Actions - Event Report',
}

const PRIORITY_RANK: Record<CorrectiveActionPriority, number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
}

const STATUS_RANK: Record<CorrectiveActionStatus, number> = {
  open: 0,
  in_progress: 1,
  pending_approval: 2,
  approved: 3,
  rejected: 4,
}

const caAccessors = {
  reference: (c: CorrectiveAction) => c.reference_number,
  priority: (c: CorrectiveAction) => PRIORITY_RANK[c.priority],
  status: (c: CorrectiveAction) => STATUS_RANK[c.status],
  due: (c: CorrectiveAction) => (c.due_date ? new Date(c.due_date) : null),
}

interface Props {
  searchParams: Promise<{
    status?: string
    priority?: string
    project_id?: string
    search?: string
    sort?: string
    dir?: string
    page?: string
    per?: string
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

  const sorted = sortItems(correctiveActions, params.sort, params.dir, caAccessors)
  const { page, per } = parsePageParams(params)
  const { pageItems, total, totalPages, from, to, page: currentPage } = paginate(sorted, page, per)

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
        <>
          {/* Desktop table */}
          <div className="hidden md:block">
            <CaTable correctiveActions={pageItems} />
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {pageItems.map((ca, i) => (
              <div
                key={ca.id}
                className="animate-fade-up"
                style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}
              >
                <CaCard correctiveAction={ca} />
              </div>
            ))}
          </div>

          <Pagination
            total={total}
            page={currentPage}
            per={per}
            totalPages={totalPages}
            from={from}
            to={to}
          />
        </>
      )}
    </div>
  )
}
