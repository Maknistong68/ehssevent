export const dynamic = 'force-dynamic'

import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getEventById } from '@/lib/queries/events'
import { getAssignableUsers } from '@/lib/queries/users'
import { EditEventForm } from '@/components/events/edit-event-form'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Edit Event - Event Report',
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditEventPage({ params }: Props) {
  const { id } = await params
  const event = await getEventById(id)

  if (!event) {
    notFound()
  }

  // Closed events are immutable — there is nothing to edit, so send the user
  // back to the read-only detail view.
  if (event.approval_level === 'closed') {
    redirect(`/events/${id}`)
  }

  const users = await getAssignableUsers()

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 md:p-6">
      <Link href={`/events/${id}`}>
        <Button variant="ghost" size="sm" data-icon="inline-start">
          <ArrowLeft className="h-4 w-4" />
          Back to Event
        </Button>
      </Link>
      <h1 className="font-heading text-2xl font-bold tracking-tight">
        Edit {event.reference_number}
      </h1>
      <EditEventForm event={event} users={users} />
    </div>
  )
}
