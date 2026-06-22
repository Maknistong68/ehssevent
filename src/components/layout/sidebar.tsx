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
  Plus,
  PanelLeftClose,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePermissions } from '@/components/shared/role-gate'
import { useAuth } from '@/components/auth/auth-provider'
import { useTranslations } from 'next-intl'
import { LanguageSwitcher } from '@/components/layout/language-switcher'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { logout } from '@/lib/actions/auth'
import { initials } from '@/lib/utils/people'

const mainNavItems = [
  { href: '/dashboard', labelKey: 'nav.dashboard' as const, icon: Home },
  { href: '/events', labelKey: 'nav.events' as const, icon: Calendar },
  { href: '/corrective-actions', labelKey: 'nav.correctiveActions' as const, icon: ListChecks },
  { href: '/inspections', labelKey: 'nav.inspections' as const, icon: ClipboardCheck },
]

function NavLink({
  href,
  label,
  icon: Icon,
  isActive,
  collapsed,
}: {
  href: string
  label: string
  icon: typeof Home
  isActive: boolean
  collapsed: boolean
}) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={cn(
        'group/nav relative flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200',
        collapsed && 'justify-center px-0',
        isActive
          ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-soft'
          : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
      )}
    >
      <Icon className={cn('h-5 w-5 shrink-0', isActive && 'stroke-[2.4]')} />
      {!collapsed && label}
    </Link>
  )
}

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const { can } = usePermissions()
  const { effectiveProfile } = useAuth()
  const t = useTranslations()

  const isAdmin = can('admin:access')

  // Strip locale prefix for route matching
  const strippedPathname = pathname.replace(/^\/(en|ar)/, '') || '/'

  const canCreateEvent = can('event:create')
  const canCreateCa = can('ca:create')
  const canCreateInspection = can('inspection:conduct')
  const showQuickCreate = canCreateEvent || canCreateCa || canCreateInspection

  const displayName = effectiveProfile?.full_name || effectiveProfile?.email?.split('@')[0] || 'User'
  const roleLabel = effectiveProfile ? t(`roles.${effectiveProfile.role}`) : ''

  return (
    <aside
      className={cn(
        'hidden bg-sidebar text-sidebar-foreground transition-[width] duration-300 ease-out md:fixed md:inset-y-0 md:flex md:flex-col',
        collapsed ? 'md:w-[4.75rem]' : 'md:w-64'
      )}
    >
      {/* Brand + collapse toggle */}
      <div
        className={cn(
          'flex h-18 items-center px-3 pt-2',
          collapsed ? 'justify-center' : 'gap-2.5 px-6'
        )}
      >
        {collapsed ? (
          <button
            type="button"
            onClick={onToggle}
            title={t('nav.expandSidebar')}
            aria-label={t('nav.expandSidebar')}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 transition-colors hover:bg-white/20"
          >
            <ShieldCheck className="h-5 w-5 text-brand-yellow" />
          </button>
        ) : (
          <>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
              <ShieldCheck className="h-5 w-5 text-brand-yellow" />
            </span>
            <span className="font-heading text-lg font-bold tracking-tight">
              {t('common.appName')}
            </span>
            <button
              type="button"
              onClick={onToggle}
              title={t('nav.collapseSidebar')}
              aria-label={t('nav.collapseSidebar')}
              className="ms-auto flex h-8 w-8 items-center justify-center rounded-lg text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
            >
              <PanelLeftClose className="h-4.5 w-4.5" />
            </button>
          </>
        )}
      </div>

      {/* Quick create */}
      {showQuickCreate && (
        <div className={cn('px-3 pb-1', !collapsed && 'px-4')}>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                collapsed ? (
                  <Button
                    size="icon"
                    title={t('nav.newCreate')}
                    aria-label={t('nav.newCreate')}
                    className="mx-auto"
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                ) : (
                  <Button className="w-full" data-icon="inline-start">
                    <Plus className="h-4 w-4" />
                    {t('nav.newCreate')}
                  </Button>
                )
              }
            />
            <DropdownMenuContent align="start" className="w-52">
              {canCreateEvent && (
                <DropdownMenuItem render={<Link href="/events/new" />}>
                  <Calendar className="h-4 w-4" />
                  {t('nav.newEvent')}
                </DropdownMenuItem>
              )}
              {canCreateCa && (
                <DropdownMenuItem render={<Link href="/corrective-actions/new" />}>
                  <ListChecks className="h-4 w-4" />
                  {t('nav.newCorrectiveAction')}
                </DropdownMenuItem>
              )}
              {canCreateInspection && (
                <DropdownMenuItem render={<Link href="/inspections/new" />}>
                  <ClipboardCheck className="h-4 w-4" />
                  {t('nav.newInspection')}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {mainNavItems.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={t(item.labelKey)}
              icon={item.icon}
              collapsed={collapsed}
              isActive={
                strippedPathname === item.href || strippedPathname.startsWith(item.href + '/')
              }
            />
          ))}
        </div>

        <div className="mt-6">
          {!collapsed && (
            <p className="mb-2 px-3.5 text-xs font-semibold tracking-wide text-sidebar-foreground/40 uppercase">
              {t('common.management')}
            </p>
          )}
          <NavLink
            href="/projects"
            label={t('nav.projects')}
            icon={FolderOpen}
            collapsed={collapsed}
            isActive={strippedPathname === '/projects' || strippedPathname.startsWith('/projects/')}
          />
          {can('user:manage') && (
            <NavLink
              href="/team"
              label={t('nav.team')}
              icon={Users}
              collapsed={collapsed}
              isActive={strippedPathname.startsWith('/team')}
            />
          )}
        </div>

        {isAdmin && (
          <div className="mt-6">
            {!collapsed && (
              <p className="mb-2 px-3.5 text-xs font-semibold tracking-wide text-sidebar-foreground/40 uppercase">
                {t('common.admin')}
              </p>
            )}
            <NavLink
              href="/admin"
              label={t('nav.adminPanel')}
              icon={Settings}
              collapsed={collapsed}
              isActive={strippedPathname.startsWith('/admin')}
            />
          </div>
        )}
      </nav>

      {/* Language toggle */}
      <div className="px-3 pb-1">
        <LanguageSwitcher collapsed={collapsed} />
      </div>

      {/* Account section */}
      <div className="border-t border-sidebar-border p-3">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                title={collapsed ? displayName : undefined}
                className={cn(
                  'flex w-full items-center gap-3 rounded-2xl p-2 text-start transition-colors hover:bg-sidebar-accent',
                  collapsed && 'justify-center'
                )}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-sm font-semibold text-sidebar-primary-foreground">
                  {initials(effectiveProfile?.full_name, effectiveProfile?.email)}
                </span>
                {!collapsed && (
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-sidebar-foreground">
                      {displayName}
                    </span>
                    <span className="block truncate text-xs text-sidebar-foreground/60">
                      {roleLabel}
                    </span>
                  </span>
                )}
              </button>
            }
          />
          <DropdownMenuContent side="top" align="start" className="w-56">
            <DropdownMenuLabel>
              <span className="block truncate font-semibold text-foreground">{displayName}</span>
              <span className="block truncate text-xs font-normal text-muted-foreground">
                {effectiveProfile?.email}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href="/profile" />}>
              <User className="h-4 w-4" />
              {t('nav.profile')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <form action={logout}>
              <DropdownMenuItem variant="destructive" render={<button type="submit" />} className="w-full">
                <LogOut className="h-4 w-4" />
                {t('profile.signOut')}
              </DropdownMenuItem>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  )
}
