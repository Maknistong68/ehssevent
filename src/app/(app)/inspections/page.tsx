export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { getInspections } from '@/lib/queries/inspections'
import { getTemplates } from '@/lib/queries/inspections'
import { getProjects } from '@/lib/queries/projects'
import { InspectionCard } from '@/components/inspections/inspection-card'
import { InspectionsTable } from '@/components/inspections/inspections-table'
import { InspectionFilters } from '@/components/inspections/inspection-filters'
import { EmptyState } from '@/components/shared/empty-state'
import { Pagination } from '@/components/shared/pagination'
import { Can } from '@/components/shared/role-gate'
import { Button } from '@/components/ui/button'
import { Plus, ClipboardCheck, Settings } from 'lucide-react'
import { sortItems, paginate, parsePageParams } from '@/lib/list-utils'
import type { InspectionStatus } from '@/types/enums'
import type { Inspection } from '@/types/database'

export const metadata = {
  title: 'Inspections - Event Report',
}

const STATUS_RANK: Record<InspectionStatus, number> = {
  draft: 0,
  completed: 1,
}

const inspectionAccessors = {
  reference: (i: Inspection) => i.reference_number,
  status: (i: Inspection) => STATUS_RANK[i.status],
  score: (i: Inspection) => i.score,
}

interface Props {
  searchParams: Promise<{
    status?: string
    project_id?: string
    template_id?: string
    search?: string
    sort?: string
    dir?: string
    page?: string
    per?: string
  }>
}

export default async function InspectionsPage({ searchParams }: Props) {
  const params = await searchParams
  const [inspections, templates, projects] = await Promise.all([
    getInspections({
      status: params.status as InspectionStatus | undefined,
      project_id: params.project_id,
      template_id: params.template_id,
      search: params.search,
    }),
    getTemplates(),
    getProjects(),
  ])

  const sorted = sortItems(
    inspections,
    params.sort,
    params.dir,
    inspectionAccessors
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
            Inspections
          </h1>
          <p className="text-sm text-muted-foreground">
            {inspections.length} inspection{inspections.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Can permission="inspection:templates">
            <Link href="/inspections/templates">
              <Button variant="outline" size="sm" data-icon="inline-start">
                <Settings className="h-4 w-4" />
                Templates
              </Button>
            </Link>
          </Can>
          <Link href="/inspections/new">
            <Button data-icon="inline-start">
              <Plus className="h-4 w-4" />
              New
            </Button>
          </Link>
        </div>
      </div>

      <InspectionFilters projects={projects} templates={templates} />

      {inspections.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="No inspections found"
          description="No inspections match your current filters, or none have been conducted yet."
          action={
            <Link href="/inspections/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Conduct Inspection
              </Button>
            </Link>
          }
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block">
            <InspectionsTable inspections={pageItems} />
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {pageItems.map((inspection, i) => (
              <div
                key={inspection.id}
                className="animate-fade-up"
                style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}
              >
                <InspectionCard inspection={inspection} />
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
