export const dynamic = 'force-dynamic'

import { CreateEventForm } from '@/components/events/create-event-form'
import { getProjects } from '@/lib/queries/projects'

export const metadata = {
  title: 'New Event - Event Report',
}

interface Props {
  searchParams: Promise<{ project_id?: string }>
}

export default async function NewEventPage({ searchParams }: Props) {
  const [{ project_id }, projects] = await Promise.all([searchParams, getProjects()])

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-6">
      <h1 className="mb-6 font-heading text-2xl font-bold tracking-tight">
        New Event
      </h1>
      <CreateEventForm projects={projects} defaultProjectId={project_id ?? ''} />
    </div>
  )
}
