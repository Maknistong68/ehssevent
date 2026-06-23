export const dynamic = 'force-dynamic'

import { CreateEventForm } from '@/components/events/create-event-form'
import { getAssignableUsers } from '@/lib/queries/users'

export const metadata = {
  title: 'New Event - Event Report',
}

export default async function NewEventPage() {
  const users = await getAssignableUsers()

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-6">
      <h1 className="mb-6 font-heading text-2xl font-bold tracking-tight">
        New Event
      </h1>
      <CreateEventForm users={users} />
    </div>
  )
}
