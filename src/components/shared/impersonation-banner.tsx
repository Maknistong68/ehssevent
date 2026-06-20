'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, Loader2, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/components/auth/auth-provider'
import { stopImpersonation } from '@/lib/actions/impersonation'

/**
 * Sticky banner shown while an admin is viewing-as another user. Indicates the
 * read-only state and offers a one-click exit that restores the real session.
 */
export function ImpersonationBanner() {
  const { effectiveProfile, isImpersonating } = useAuth()
  const t = useTranslations()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  if (!isImpersonating || !effectiveProfile) return null

  const name =
    effectiveProfile.full_name || effectiveProfile.email || effectiveProfile.role

  const handleExit = async () => {
    setLoading(true)
    await stopImpersonation()
    router.refresh()
    // Full reload so the client auth provider re-resolves the real profile.
    window.location.reload()
  }

  return (
    <div className="sticky top-0 z-50 flex items-center justify-between gap-3 bg-amber-500 px-4 py-2 text-sm font-medium text-amber-950">
      <div className="flex min-w-0 items-center gap-2">
        <Eye className="h-4 w-4 shrink-0" />
        <span className="truncate">{t('impersonation.banner', { name })}</span>
      </div>
      <button
        type="button"
        onClick={handleExit}
        disabled={loading}
        className="flex shrink-0 items-center gap-1 rounded-full bg-amber-950/10 px-3 py-1 font-semibold transition-colors hover:bg-amber-950/20 disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
        {t('admin.exitImpersonation')}
      </button>
    </div>
  )
}
