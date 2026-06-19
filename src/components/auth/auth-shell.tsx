'use client'

import * as React from 'react'
import { ShieldCheck } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'

/** Decorative overlapping plant leaves, echoing the mockup's hero art. */
function LeafDecoration() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 220 260"
      className="pointer-events-none absolute -end-6 -top-10 h-64 w-56 opacity-90"
    >
      <g className="animate-float" style={{ transformOrigin: '60% 40%' }}>
        <path
          d="M120 240C120 160 150 70 215 25C205 110 195 200 145 245C137 252 126 250 120 240Z"
          fill="oklch(0.55 0.09 158)"
          opacity="0.7"
        />
        <path
          d="M118 244C95 170 60 110 5 95C45 165 70 215 105 248C110 253 117 251 118 244Z"
          fill="oklch(0.45 0.07 162)"
          opacity="0.85"
        />
        <path
          d="M122 246C128 150 165 80 200 60C185 140 170 210 138 250C132 257 122 255 122 246Z"
          fill="oklch(0.62 0.1 150)"
          opacity="0.55"
        />
        <path
          d="M120 250C118 175 105 110 70 70C95 150 100 205 112 252C114 258 120 257 120 250Z"
          fill="oklch(0.5 0.08 160)"
          opacity="0.6"
        />
      </g>
      <circle cx="196" cy="44" r="7" fill="var(--brand-yellow)" opacity="0.9" />
      <circle cx="32" cy="120" r="4" fill="var(--brand-yellow)" opacity="0.7" />
    </svg>
  )
}

interface AuthShellProps {
  title: React.ReactNode
  subtitle?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
}

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
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
    <div className="relative w-full max-w-md animate-scale-in overflow-hidden rounded-[2.5rem] bg-hero-green p-7 pt-9 text-white shadow-soft-lg">
      <LeafDecoration />
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
        {subtitle && (
          <p className="mt-3 text-sm text-white/65">{subtitle}</p>
        )}

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
export function AuthField({ icon, endAdornment, className, ...props }: AuthFieldProps) {
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
