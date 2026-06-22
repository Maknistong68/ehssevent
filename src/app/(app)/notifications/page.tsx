export const dynamic = 'force-dynamic'

import { getNotifications } from '@/lib/queries/notifications'
import { NotificationsList } from '@/components/notifications/notifications-list'

export const metadata = {
  title: 'Notifications - Event Report',
}

export default async function NotificationsPage() {
  const items = await getNotifications()
  const unread = items.filter((n) => !n.read).length

  return (
    <div className="space-y-5 p-4 md:p-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight md:text-3xl">
          Notifications
        </h1>
        <p className="text-sm text-muted-foreground">
          {unread > 0 ? `${unread} unread` : 'All caught up'}
        </p>
      </div>

      <NotificationsList initialItems={items} />
    </div>
  )
}
