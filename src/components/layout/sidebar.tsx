'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  Calendar,
  ClipboardCheck,
  ListChecks,
  User,
  Users,
  ShieldCheck,
  FolderOpen,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePermissions } from '@/components/shared/role-gate'
import { useTranslations } from 'next-intl'
import { LanguageSwitcher } from '@/components/layout/language-switcher'

const mainNavItems = [
  { href: '/dashboard', labelKey: 'nav.dashboard' as const, icon: Home },
  { href: '/events', labelKey: 'nav.events' as const, icon: Calendar },
  { href: '/corrective-actions', labelKey: 'nav.correctiveActions' as const, icon: ListChecks },
  { href: '/inspections', labelKey: 'nav.inspections' as const, icon: ClipboardCheck },
  { href: '/projects', labelKey: 'nav.projects' as const, icon: FolderOpen },
]

const bottomNavItems = [{ href: '/profile', labelKey: 'nav.profile' as const, icon: User }]

function NavLink({
  href,
  label,
  icon: Icon,
  isActive,
}: {
  href: string
  label: string
  icon: typeof Home
  isActive: boolean
}) {
  return (
    <Link
      href={href}
      className={cn(
        'group/nav relative flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200',
        isActive
          ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-soft'
          : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
      )}
    >
      <Icon className={cn('h-5 w-5 shrink-0', isActive && 'stroke-[2.4]')} />
      {label}
    </Link>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const { can } = usePermissions()
  const t = useTranslations()

  const isAdmin = can('admin:access')

  // Strip locale prefix for route matching
  const strippedPathname = pathname.replace(/^\/(en|ar)/, '') || '/'

  return (
    <aside className="hidden bg-sidebar text-sidebar-foreground md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
      <div className="flex h-18 items-center gap-2.5 px-6 pt-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
          <ShieldCheck className="h-5 w-5 text-brand-yellow" />
        </span>
        <span className="font-heading text-lg font-bold tracking-tight">
          {t('common.appName')}
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {mainNavItems.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={t(item.labelKey)}
              icon={item.icon}
              isActive={
                strippedPathname === item.href || strippedPathname.startsWith(item.href + '/')
              }
            />
          ))}
        </div>

        {can('user:manage') && !isAdmin && (
          <div className="mt-6">
            <p className="mb-2 px-3.5 text-xs font-semibold tracking-wide text-sidebar-foreground/40 uppercase">
              {t('common.management')}
            </p>
            <NavLink
              href="/team"
              label={t('nav.team')}
              icon={Users}
              isActive={strippedPathname.startsWith('/team')}
            />
          </div>
        )}

        {isAdmin && (
          <div className="mt-6">
            <p className="mb-2 px-3.5 text-xs font-semibold tracking-wide text-sidebar-foreground/40 uppercase">
              {t('common.admin')}
            </p>
            <NavLink
              href="/admin"
              label={t('nav.adminPanel')}
              icon={Settings}
              isActive={strippedPathname.startsWith('/admin')}
            />
          </div>
        )}
      </nav>

      <div className="border-t border-sidebar-border px-3 py-4 space-y-2">
        {bottomNavItems.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            label={t(item.labelKey)}
            icon={item.icon}
            isActive={strippedPathname === item.href}
          />
        ))}
        <LanguageSwitcher />
      </div>
    </aside>
  )
}
