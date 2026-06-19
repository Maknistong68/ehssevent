'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { AuthShell, AuthField, AuthAlert } from '@/components/auth/auth-shell'
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2, Mail } from 'lucide-react'
import { useTranslations } from 'next-intl'

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const t = useTranslations('auth')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/profile`,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess(t('checkEmailReset'))
    setLoading(false)
  }

  return (
    <AuthShell
      title={t('resetTitle')}
      subtitle={t('resetSubtitle')}
      footer={
        <Link
          href="/login"
          className="flex items-center justify-center gap-2 text-sm text-white/60 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('backToSignIn')}
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <AuthAlert icon={<AlertCircle className="h-4 w-4" />}>{error}</AuthAlert>
        )}
        {success && (
          <AuthAlert tone="success" icon={<CheckCircle2 className="h-4 w-4" />}>
            {success}
          </AuthAlert>
        )}

        <AuthField
          icon={<Mail className="h-5 w-5" />}
          type="email"
          placeholder={t('emailPlaceholder')}
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Button
          type="submit"
          variant="accent"
          size="lg"
          className="mt-2 w-full"
          disabled={loading}
        >
          {loading && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
          {t('sendResetLink')}
        </Button>
      </form>
    </AuthShell>
  )
}
