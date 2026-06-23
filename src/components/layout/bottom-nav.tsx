'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  Calendar,
  ListChecks,
  ClipboardCheck,
  User,
  Users,
  FolderOpen,
  Settings,
  MoreHorizontal,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'
import { usePermissions } from '@/components/shared/role-gate'
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from '@/components/ui/sheet'

const coreNavItems = [
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
]

export function BottomNav() {
  const pathname = usePathname()
  const t = useTranslations()
  const { can } = usePermissions()

  // Strip locale prefix for route matching
  const strippedPathname = pathname.replace(/^\/(en|ar)/, '') || '/'

  const matchRoute = (href: string) =>
    strippedPathname === href || strippedPathname.startsWith(href + '/')

  // Permission-gated modules surfaced in the "More" sheet (mirrors the sidebar).
  const moreItems = [
    { href: '/projects', labelKey: 'nav.projects' as const, icon: FolderOpen },
    ...(can('user:manage')
      ? [{ href: '/team', labelKey: 'nav.team' as const, icon: Users }]
      : []),
    ...(can('admin:access')
      ? [
          {
            href: '/admin',
            labelKey: 'nav.adminPanel' as const,
            icon: Settings,
          },
        ]
      : []),
    { href: '/profile', labelKey: 'nav.profile' as const, icon: User },
    { href: '/settings', labelKey: 'nav.settings' as const, icon: Settings },
  ]

  const moreActive = moreItems.some((item) => matchRoute(item.href))

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
      <nav className="flex w-full max-w-md items-center justify-between gap-1 rounded-full border border-border/60 bg-card/95 p-1.5 shadow-soft-lg backdrop-blur">
        {coreNavItems.map((item) => {
          const isActive = matchRoute(item.href)
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

        <Sheet>
          <SheetTrigger
            render={
              <button
                type="button"
                aria-label={t('nav.more')}
                className={cn(
                  'flex h-11 items-center justify-center gap-2 rounded-full px-3 transition-all duration-300 ease-out',
                  moreActive
                    ? 'bg-primary text-primary-foreground shadow-soft'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <MoreHorizontal
                  className={cn(
                    'h-5 w-5 shrink-0',
                    moreActive && 'stroke-[2.4]'
                  )}
                />
                <span
                  className={cn(
                    'overflow-hidden text-xs font-semibold whitespace-nowrap transition-all duration-300',
                    moreActive ? 'max-w-24 opacity-100' : 'max-w-0 opacity-0'
                  )}
                >
                  {t('nav.more')}
                </span>
              </button>
            }
          />
          <SheetContent
            side="bottom"
            className="rounded-t-3xl pb-[max(1rem,env(safe-area-inset-bottom))]"
          >
            <SheetHeader>
              <SheetTitle>{t('nav.more')}</SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-1 gap-1 px-2 pb-2">
              {moreItems.map((item) => {
                const isActive = matchRoute(item.href)
                const label = t(item.labelKey)
                return (
                  <SheetClose
                    key={item.href}
                    render={
                      <Link
                        href={item.href}
                        className={cn(
                          'flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-primary text-primary-foreground shadow-soft'
                            : 'text-foreground hover:bg-accent'
                        )}
                      >
                        <item.icon className="h-5 w-5 shrink-0" />
                        {label}
                      </Link>
                    }
                  />
                )
              })}
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </div>
  )
}
