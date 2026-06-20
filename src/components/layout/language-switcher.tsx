'use client'

import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { cn } from '@/lib/utils'
import { Globe } from 'lucide-react'
import { setLocale } from '@/lib/actions/locale'

interface LanguageSwitcherProps {
  variant?: 'default' | 'compact'
  collapsed?: boolean
}

export function LanguageSwitcher({ variant = 'default', collapsed = false }: LanguageSwitcherProps) {
  const locale = useLocale()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const nextLocale = locale === 'en' ? 'ar' : 'en'
  const label = locale === 'en' ? 'العربية' : 'English'

  const handleSwitch = () => {
    startTransition(async () => {
      await setLocale(nextLocale)
      router.refresh()
    })
  }

  if (collapsed) {
    return (
      <button
        onClick={handleSwitch}
        disabled={isPending}
        title={label}
        className={cn(
          'flex w-full items-center justify-center rounded-2xl px-0 py-2.5 text-sidebar-foreground/70 transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-foreground',
          isPending && 'opacity-50'
        )}
        aria-label={`Switch to ${nextLocale === 'ar' ? 'Arabic' : 'English'}`}
      >
        <Globe className="h-5 w-5 shrink-0" />
      </button>
    )
  }

  if (variant === 'compact') {
    return (
      <button
        onClick={handleSwitch}
        disabled={isPending}
        className={cn(
          'flex h-9 items-center gap-1.5 rounded-full bg-muted/50 px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
          isPending && 'opacity-50'
        )}
        aria-label={`Switch to ${nextLocale === 'ar' ? 'Arabic' : 'English'}`}
      >
        <Globe className="h-3.5 w-3.5" />
        {label}
      </button>
    )
  }

  return (
    <button
      onClick={handleSwitch}
      disabled={isPending}
      className={cn(
        'flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground w-full',
        isPending && 'opacity-50'
      )}
      aria-label={`Switch to ${nextLocale === 'ar' ? 'Arabic' : 'English'}`}
    >
      <Globe className="h-5 w-5 shrink-0" />
      {label}
    </button>
  )
}
