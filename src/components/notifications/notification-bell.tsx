'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bell, CheckCheck } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  loadNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '@/lib/actions/notifications'
import type { Notification } from '@/types/database'

interface NotificationBellProps {
  // Visual variant: sidebar (full-width nav row) or compact (icon only).
  variant?: 'sidebar' | 'compact'
  label: string
  collapsed?: boolean
}

export function NotificationBell({
  variant = 'compact',
  label,
  collapsed = false,
}: NotificationBellProps) {
  const router = useRouter()
  const [items, setItems] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)

  const refresh = useCallback(async () => {
    const data = await loadNotifications(10)
    setItems(data.items)
    setUnread(data.unread)
  }, [])

  useEffect(() => {
    let active = true
    void (async () => {
      const data = await loadNotifications(10)
      if (active) {
        setItems(data.items)
        setUnread(data.unread)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  const handleOpen = (open: boolean) => {
    if (open) refresh()
  }

  const handleItem = async (n: Notification) => {
    if (!n.read) {
      await markNotificationRead(n.id)
      await refresh()
    }
    if (n.link) router.push(n.link)
  }

  const handleMarkAll = async () => {
    await markAllNotificationsRead()
    await refresh()
  }

  return (
    <DropdownMenu onOpenChange={handleOpen}>
      <DropdownMenuTrigger
        render={
          variant === 'sidebar' && !collapsed ? (
            <button
              type="button"
              className="group/nav relative flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            >
              <span className="relative">
                <Bell className="h-5 w-5 shrink-0" />
                {unread > 0 && (
                  <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-destructive" />
                )}
              </span>
              {label}
              {unread > 0 && (
                <span className="ms-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-semibold text-destructive-foreground">
                  {unread}
                </span>
              )}
            </button>
          ) : (
            <button
              type="button"
              aria-label={label}
              title={label}
              className={cn(
                'relative flex shrink-0 items-center justify-center rounded-full transition-colors',
                variant === 'sidebar'
                  ? 'mx-auto h-9 w-9 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                  : 'h-11 w-11 bg-card text-muted-foreground shadow-soft hover:text-foreground'
              )}
            >
              <Bell className="h-5 w-5" />
              {unread > 0 && (
                <span className="absolute right-2 top-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[0.625rem] font-semibold text-destructive-foreground">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>
          )
        }
      />
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between gap-2">
          <span className="font-semibold">{label}</span>
          {unread > 0 && (
            <button
              type="button"
              onClick={handleMarkAll}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {items.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">
            You&apos;re all caught up.
          </p>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {items.map((n) => (
              <DropdownMenuItem
                key={n.id}
                onClick={() => handleItem(n)}
                className="flex flex-col items-start gap-0.5 whitespace-normal"
              >
                <span className="flex w-full items-start gap-2">
                  {!n.read && (
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  )}
                  <span
                    className={cn(
                      'flex-1 text-sm',
                      n.read ? 'text-muted-foreground' : 'font-medium'
                    )}
                  >
                    {n.title}
                  </span>
                </span>
                {n.body && (
                  <span className="line-clamp-2 ps-4 text-xs text-muted-foreground">
                    {n.body}
                  </span>
                )}
                <span className="ps-4 text-[0.7rem] text-muted-foreground/80">
                  {formatDistanceToNow(new Date(n.created_at), {
                    addSuffix: true,
                  })}
                </span>
              </DropdownMenuItem>
            ))}
          </div>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/notifications" />}>
          View all notifications
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
