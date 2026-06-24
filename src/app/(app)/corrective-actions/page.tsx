export const dynamic = 'force-dynamic'

import {
  getCorrectiveActions,
  getCorrectiveActionPeople,
} from '@/lib/queries/corrective-actions'
import { CaCard } from '@/components/corrective-actions/ca-card'
import { CaTable } from '@/components/corrective-actions/ca-table'
import { CaFilters } from '@/components/corrective-actions/ca-filters'
import { EmptyState } from '@/components/shared/empty-state'
import { Pagination } from '@/components/shared/pagination'
import { ExportButton } from '@/components/shared/export-button'
import { ListChecks } from 'lucide-react'
import { sortItems, paginate, parsePageParams } from '@/lib/list-utils'
import type {
  CorrectiveActionStatus,
  CorrectiveActionPriority,
} from '@/types/enums'
import type { CorrectiveAction } from '@/types/database'

export const metadata = {
  title: 'Corrective Actions - Event Report',
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
  status: (c: CorrectiveAction) => STATUS_RANK[c.status],
  creator: (c: CorrectiveAction) => c.creator?.full_name ?? null,
  assignee: (c: CorrectiveAction) => c.assignee?.full_name ?? null,
}

interface Props {
  searchParams: Promise<{
    status?: string
    priority?: string
    search?: string
    overdue?: string
    created_by?: string
    assigned_to?: string
    date_from?: string
    date_to?: string
    sort?: string
    dir?: string
    page?: string
    per?: string
  }>
}

export default async function CorrectiveActionsPage({ searchParams }: Props) {
  const params = await searchParams
  const [correctiveActions, people] = await Promise.all([
    getCorrectiveActions({
      status: params.status as CorrectiveActionStatus | undefined,
      priority: params.priority as CorrectiveActionPriority | undefined,
      overdue: params.overdue === '1',
      created_by: params.created_by ? params.created_by.split(',') : undefined,
      assigned_to: params.assigned_to
        ? params.assigned_to.split(',')
        : undefined,
      date_from: params.date_from,
      date_to: params.date_to,
      search: params.search,
    }),
    getCorrectiveActionPeople(),
  ])

  const sorted = sortItems(
    correctiveActions,
    params.sort,
    params.dir,
    caAccessors
  )
  const { page, per } = parsePageParams(params)
  const {
    pageItems,
    total,
    totalPages,
    from,
    to,
    page: currentPage,
  } = paginate(sorted, page, per)

  return (
    <div className="space-y-5 p-4 md:p-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight md:text-3xl">
            Corrective Actions
          </h1>
          <p className="text-sm text-muted-foreground">
            {correctiveActions.length} corrective action
            {correctiveActions.length !== 1 ? 's' : ''}
          </p>
        </div>
        <ExportButton
          type="corrective-actions"
          params={{
            status: params.status,
            priority: params.priority,
            overdue: params.overdue,
            date_from: params.date_from,
            date_to: params.date_to,
            search: params.search,
          }}
        />
      </div>

      <CaFilters creators={people.creators} assignees={people.assignees} />

      {correctiveActions.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="No corrective actions found"
          description="Raise corrective actions from an event or inspection."
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
