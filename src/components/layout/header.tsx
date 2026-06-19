'use client'

import Link from 'next/link'
import { useAuth } from '@/components/auth/auth-provider'
import { useTranslations } from 'next-intl'
import { LanguageSwitcher } from '@/components/layout/language-switcher'

function initials(name?: string | null, email?: string | null) {
  const source = name?.trim() || email?.split('@')[0] || 'U'
  return source
    .split(/[\s._-]+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
}

export function Header() {
  const { profile } = useAuth()
  const t = useTranslations()
  const displayName = profile?.full_name || profile?.email?.split('@')[0]

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur md:hidden">
      <div className="flex h-16 items-center justify-between px-5">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{t('header.welcomeBack')}</p>
          <p className="truncate font-heading text-lg font-bold tracking-tight">
            {displayName || t('common.appName')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher variant="compact" />
          <Link
            href="/profile"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground shadow-soft"
            aria-label={t('nav.profile')}
          >
            {initials(profile?.full_name, profile?.email)}
          </Link>
        </div>
      </div>
    </header>
  )
}
