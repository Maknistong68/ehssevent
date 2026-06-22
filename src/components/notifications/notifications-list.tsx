'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, CheckCheck } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/empty-state'
import {
  markNotificationRead,
  markAllNotificationsRead,
} from '@/lib/actions/notifications'
import type { Notification } from '@/types/database'

interface NotificationsListProps {
  initialItems: Notification[]
}

export function NotificationsList({ initialItems }: NotificationsListProps) {
  const router = useRouter()
  const [items, setItems] = useState<Notification[]>(initialItems)
  const [pending, startTransition] = useTransition()

  const unread = items.filter((n) => !n.read).length

  const handleItem = (n: Notification) => {
    if (!n.read) {
      setItems((prev) =>
        prev.map((i) => (i.id === n.id ? { ...i, read: true } : i))
      )
      startTransition(() => {
        markNotificationRead(n.id)
      })
    }
    if (n.link) router.push(n.link)
  }

  const handleMarkAll = () => {
    setItems((prev) => prev.map((i) => ({ ...i, read: true })))
    startTransition(() => {
      markAllNotificationsRead()
    })
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Bell}
        title="No notifications"
        description="You're all caught up. New activity will appear here."
      />
    )
  }

  return (
    <div className="space-y-3">
      {unread > 0 && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAll}
            disabled={pending}
            data-icon="inline-start"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </Button>
        </div>
      )}

      <ul className="divide-y divide-border overflow-hidden rounded-2xl border bg-card">
        {items.map((n) => (
          <li key={n.id}>
            <button
              type="button"
              onClick={() => handleItem(n)}
              className="flex w-full items-start gap-3 px-4 py-3.5 text-start transition-colors hover:bg-accent"
            >
              <span
                className={cn(
                  'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                  n.read ? 'bg-transparent' : 'bg-primary'
                )}
              />
              <span className="min-w-0 flex-1">
                <span
                  className={cn(
                    'block text-sm',
                    n.read ? 'text-muted-foreground' : 'font-medium'
                  )}
                >
                  {n.title}
                </span>
                {n.body && (
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {n.body}
                  </span>
                )}
                <span className="mt-1 block text-[0.7rem] text-muted-foreground/80">
                  {formatDistanceToNow(new Date(n.created_at), {
                    addSuffix: true,
                  })}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
