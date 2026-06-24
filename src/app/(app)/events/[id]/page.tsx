export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getEventById } from '@/lib/queries/events'
import { getEventCorrectiveActions } from '@/lib/queries/corrective-actions'
import { getAssignableUsers } from '@/lib/queries/users'
import { getRecordAuditLog } from '@/lib/queries/audit'
import { EventDetail } from '@/components/events/event-detail'
import { AuditTimeline } from '@/components/audit/audit-timeline'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

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

  const [correctiveActions, users, auditLog] = await Promise.all([
    getEventCorrectiveActions(id),
    getAssignableUsers(),
    getRecordAuditLog('events', id),
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
        users={users}
      />
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <AuditTimeline
            entries={auditLog}
            emptyMessage="No activity recorded for this event yet."
          />
        </CardContent>
      </Card>
    </div>
  )
}
