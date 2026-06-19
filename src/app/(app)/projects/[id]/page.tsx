export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  getProjectById,
  getProjectContractors,
  getContractorOrganizations,
} from '@/lib/queries/projects'
import { getEvents } from '@/lib/queries/events'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EventCard } from '@/components/events/event-card'
import { ContractorManager } from '@/components/projects/contractor-manager'
import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui/button'
import { ArrowLeft, MapPin, Calendar, Plus } from 'lucide-react'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const project = await getProjectById(id)
  return {
    title: project ? `${project.name} - Event Report` : 'Project - Event Report',
  }
}

export default async function ProjectDetailPage({ params }: Props) {
  const { id } = await params
  const [project, contractors, allContractors, events] = await Promise.all([
    getProjectById(id),
    getProjectContractors(id),
    getContractorOrganizations(),
    getEvents({ project_id: id }),
  ])

  if (!project) notFound()

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <Link
          href="/projects"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-card text-muted-foreground shadow-soft transition-colors hover:text-foreground"
          aria-label="Back to projects"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="font-heading text-xl font-bold tracking-tight">{project.name}</h1>
          {project.location && (
            <p className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {project.location}
            </p>
          )}
        </div>
        <Badge variant="secondary">
          {project.is_active ? 'Active' : 'Inactive'}
        </Badge>
      </div>

      {project.description && (
        <Card size="sm">
          <CardContent>
            <p className="text-sm">{project.description}</p>
          </CardContent>
        </Card>
      )}

      <ContractorManager
        projectId={project.id}
        currentContractors={contractors}
        allContractors={allContractors}
      />

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold tracking-tight">
            Events ({events.length})
          </h2>
          <Link href={`/events/new?project_id=${project.id}`}>
            <Button size="sm" data-icon="inline-start">
              <Plus className="h-4 w-4" />
              New
            </Button>
          </Link>
        </div>

        {events.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No events"
            description="No events have been reported for this project yet."
          />
        ) : (
          <div className="space-y-3">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
