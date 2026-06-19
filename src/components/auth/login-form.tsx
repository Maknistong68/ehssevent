'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { AuthShell, AuthField, AuthAlert } from '@/components/auth/auth-shell'
import { AlertCircle, Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react'
import { useTranslations } from 'next-intl'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const t = useTranslations('auth')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <AuthShell
      title={t('welcomeBack')}
      subtitle={t('signInSubtitle')}
      footer={
        <p className="text-center text-sm text-white/60">
          {t('noAccount')}{' '}
          <Link href="/signup" className="font-semibold text-brand-yellow hover:underline">
            {t('signUp')}
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <AuthAlert icon={<AlertCircle className="h-4 w-4" />}>{error}</AuthAlert>
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

        <AuthField
          icon={<Lock className="h-5 w-5" />}
          type={showPassword ? 'text' : 'password'}
          placeholder={t('password')}
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          endAdornment={
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="text-white/55 transition-colors hover:text-white"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          }
        />

        <Button
          type="submit"
          variant="accent"
          size="lg"
          className="mt-2 w-full"
          disabled={loading}
        >
          {loading && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
          {t('login')}
        </Button>

        <div className="pt-1 text-center">
          <Link
            href="/forgot-password"
            className="text-sm text-white/60 transition-colors hover:text-white"
          >
            {t('forgotPassword')}
          </Link>
        </div>
      </form>
    </AuthShell>
  )
}
