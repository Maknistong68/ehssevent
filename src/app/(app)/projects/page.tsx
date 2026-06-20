export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { getProjects } from '@/lib/queries/projects'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/empty-state'
import { Pagination } from '@/components/shared/pagination'
import { Can } from '@/components/shared/role-gate'
import { ProjectsTable } from '@/components/projects/projects-table'
import { ProjectFilters } from '@/components/projects/project-filters'
import { Plus, FolderOpen, MapPin } from 'lucide-react'
import { sortItems, paginate, parsePageParams } from '@/lib/list-utils'
import type { Project } from '@/types/database'

export const metadata = {
  title: 'Projects - Event Report',
}

const projectAccessors = {
  name: (p: Project) => p.name,
}

interface Props {
  searchParams: Promise<{
    search?: string
    sort?: string
    dir?: string
    page?: string
    per?: string
  }>
}

export default async function ProjectsPage({ searchParams }: Props) {
  const params = await searchParams
  const allProjects = await getProjects()

  const search = params.search?.trim().toLowerCase()
  const filtered = search
    ? allProjects.filter(
        (p) =>
          p.name.toLowerCase().includes(search) ||
          p.description?.toLowerCase().includes(search) ||
          p.location?.toLowerCase().includes(search)
      )
    : allProjects

  const sorted = sortItems(filtered, params.sort, params.dir, projectAccessors)
  const { page, per } = parsePageParams(params)
  const { pageItems, total, totalPages, from, to, page: currentPage } = paginate(sorted, page, per)

  return (
    <div className="space-y-5 p-4 md:p-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight md:text-3xl">Projects</h1>
          <p className="text-sm text-muted-foreground">
            {allProjects.length} project{allProjects.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Can permission="project:manage">
          <Link href="/projects/new">
            <Button data-icon="inline-start">
              <Plus className="h-4 w-4" />
              New
            </Button>
          </Link>
        </Can>
      </div>

      <ProjectFilters />

      {filtered.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No projects found"
          description="No projects match your current filters, or none have been created yet."
          action={
            <Can permission="project:manage">
              <Link href="/projects/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Project
                </Button>
              </Link>
            </Can>
          }
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block">
            <ProjectsTable projects={pageItems} />
          </div>

          {/* Mobile cards */}
          <div className="grid gap-3 sm:grid-cols-2 md:hidden">
            {pageItems.map((project, i) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="animate-fade-up block"
                style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}
              >
                <Card
                  size="sm"
                  className="h-full transition-all duration-200 hover:-translate-y-0.5 hover:shadow-soft-lg"
                >
                  <CardContent className="space-y-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary text-brand-green-soft">
                      <FolderOpen className="h-5 w-5" />
                    </div>
                    <h3 className="font-heading font-semibold tracking-tight">{project.name}</h3>
                    {project.description && (
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {project.description}
                      </p>
                    )}
                    {project.location && (
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        {project.location}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
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
