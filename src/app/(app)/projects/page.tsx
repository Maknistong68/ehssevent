export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { getProjects } from '@/lib/queries/projects'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/empty-state'
import { Can } from '@/components/shared/role-gate'
import { Plus, FolderOpen, MapPin } from 'lucide-react'

export const metadata = {
  title: 'Projects - Event Report',
}

export default async function ProjectsPage() {
  const projects = await getProjects()

  return (
    <div className="space-y-5 p-4 md:p-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight md:text-3xl">Projects</h1>
          <p className="text-sm text-muted-foreground">
            {projects.length} project{projects.length !== 1 ? 's' : ''}
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

      {projects.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No projects yet"
          description="Create your first project to start tracking events."
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
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, i) => (
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
      )}
    </div>
  )
}
