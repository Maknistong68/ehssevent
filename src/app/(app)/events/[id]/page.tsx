export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getEventById, getEventResponses } from '@/lib/queries/events'
import { getEventCorrectiveActions } from '@/lib/queries/corrective-actions'
import { getAssignableUsers } from '@/lib/queries/users'
import { EventDetail } from '@/components/events/event-detail'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Event - Event Report',
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function EventPage({ params }: Props) {
  const { id } = await params
  const event = await getEventById(id)

  if (!event) {
    notFound()
  }

  const [correctiveActions, responses, users] = await Promise.all([
    getEventCorrectiveActions(id),
    getEventResponses(id),
    getAssignableUsers(),
  ])

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 md:p-6">
      <Link href="/events">
        <Button variant="ghost" size="sm" data-icon="inline-start">
          <ArrowLeft className="h-4 w-4" />
          Back to Events
        </Button>
      </Link>
      <EventDetail
        event={event}
        correctiveActions={correctiveActions}
        responses={responses}
        users={users}
      />
    </div>
  )
}
