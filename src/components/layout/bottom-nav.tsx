'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Calendar, ListChecks, ClipboardCheck, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'

const navItems = [
  { href: '/dashboard', labelKey: 'nav.home' as const, icon: Home },
  { href: '/events', labelKey: 'nav.events' as const, icon: Calendar },
  {
    href: '/corrective-actions',
    labelKey: 'nav.actions' as const,
    icon: ListChecks,
  },
  {
    href: '/inspections',
    labelKey: 'nav.inspections' as const,
    icon: ClipboardCheck,
  },
  { href: '/profile', labelKey: 'nav.profile' as const, icon: User },
]

export function BottomNav() {
  const pathname = usePathname()
  const t = useTranslations()

  // Strip locale prefix for route matching
  const strippedPathname = pathname.replace(/^\/(en|ar)/, '') || '/'

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
      <nav className="flex w-full max-w-md items-center justify-between gap-1 rounded-full border border-border/60 bg-card/95 p-1.5 shadow-soft-lg backdrop-blur">
        {navItems.map((item) => {
          const isActive =
            strippedPathname === item.href ||
            strippedPathname.startsWith(item.href + '/')
          const label = t(item.labelKey)
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={label}
              className={cn(
                'flex h-11 items-center justify-center gap-2 rounded-full px-3 transition-all duration-300 ease-out',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-soft'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <item.icon
                className={cn('h-5 w-5 shrink-0', isActive && 'stroke-[2.4]')}
              />
              <span
                className={cn(
                  'overflow-hidden text-xs font-semibold whitespace-nowrap transition-all duration-300',
                  isActive ? 'max-w-24 opacity-100' : 'max-w-0 opacity-0'
                )}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
