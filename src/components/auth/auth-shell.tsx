'use client'

import * as React from 'react'
import { ShieldCheck } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'

interface AuthShellProps {
  title: React.ReactNode
  subtitle?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
}

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: AuthShellProps) {
  const t = useTranslations('common')

  // Support multiline title strings (from translations with \n)
  const renderTitle = () => {
    if (typeof title === 'string' && title.includes('\n')) {
      return title.split('\n').map((line, i, arr) => (
        <React.Fragment key={i}>
          {line}
          {i < arr.length - 1 && <br />}
        </React.Fragment>
      ))
    }
    return title
  }

  return (
    <div className="w-full max-w-md animate-scale-in p-7 pt-9 text-white">
      <div className="relative z-10">
        <div className="mb-10 flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 backdrop-blur">
            <ShieldCheck className="h-5 w-5 text-brand-yellow" />
          </span>
          <span className="font-heading text-sm font-semibold tracking-wide text-white/90">
            {t('appName')}
          </span>
        </div>

        <h1 className="font-heading text-[2.75rem] leading-[1.02] font-bold lowercase tracking-tight">
          {renderTitle()}
        </h1>
        {subtitle && <p className="mt-3 text-sm text-white/65">{subtitle}</p>}

        <div className="mt-9">{children}</div>
        {footer && <div className="mt-7">{footer}</div>}
      </div>
    </div>
  )
}

interface AuthFieldProps extends React.ComponentProps<typeof Input> {
  icon: React.ReactNode
  endAdornment?: React.ReactNode
}

/** Input styled for the dark green hero panel: translucent, icon-leading. */
export function AuthField({
  icon,
  endAdornment,
  className,
  ...props
}: AuthFieldProps) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-white/55">
        {icon}
      </span>
      <Input
        className={cn(
          'h-13 rounded-2xl border-white/15 bg-white/10 ps-12 text-white placeholder:text-white/45 focus-visible:border-white/35 focus-visible:bg-white/15 focus-visible:ring-white/20 dark:bg-white/10',
          endAdornment && 'pe-12',
          className
        )}
        {...props}
      />
      {endAdornment && (
        <span className="absolute end-3 top-1/2 -translate-y-1/2 text-white/55">
          {endAdornment}
        </span>
      )}
    </div>
  )
}

/** Inline alert tuned for the dark panel. */
export function AuthAlert({
  tone = 'error',
  icon,
  children,
}: {
  tone?: 'error' | 'success'
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium backdrop-blur',
        tone === 'error'
          ? 'bg-red-500/20 text-red-100'
          : 'bg-brand-yellow/20 text-brand-yellow'
      )}
    >
      <span className="shrink-0">{icon}</span>
      {children}
    </div>
  )
}
