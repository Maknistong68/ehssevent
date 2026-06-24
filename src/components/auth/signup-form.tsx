'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AuthShell, AuthField, AuthAlert } from '@/components/auth/auth-shell'
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Lock,
  Mail,
  User,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { signup } from '@/lib/actions/auth'

export function SignupForm() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [privacyAccepted, setPrivacyAccepted] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const t = useTranslations('auth')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!termsAccepted || !privacyAccepted) {
      setError(t('acceptTermsRequired'))
      return
    }

    if (password !== confirmPassword) {
      setError(t('passwordsNoMatch'))
      return
    }

    if (password.length < 6) {
      setError(t('passwordTooShort'))
      return
    }

    setLoading(true)

    // Send consent to the server so it can be recorded (proof of consent).
    const result = await signup({
      username,
      email,
      password,
      confirm_password: confirmPassword,
      terms_accepted: termsAccepted,
      privacy_accepted: privacyAccepted,
    })

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    setSuccess(result.success ?? t('pendingApproval'))
    setLoading(false)
  }

  return (
    <AuthShell
      title={t('createAccountTitle')}
      subtitle={t('signUpSubtitle')}
      footer={
        <p className="text-center text-sm text-white/60">
          {t('hasAccount')}{' '}
          <Link
            href="/login"
            className="font-semibold text-brand-yellow hover:underline"
          >
            {t('signIn')}
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <AuthAlert icon={<AlertCircle className="h-4 w-4" />}>
            {error}
          </AuthAlert>
        )}
        {success && (
          <AuthAlert tone="success" icon={<CheckCircle2 className="h-4 w-4" />}>
            {success}
          </AuthAlert>
        )}

        <AuthField
          icon={<User className="h-5 w-5" />}
          type="text"
          placeholder={t('usernamePlaceholder')}
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
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
          type="password"
          placeholder={t('password')}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <AuthField
          icon={<Lock className="h-5 w-5" />}
          type="password"
          placeholder={t('confirmPassword')}
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        <div className="space-y-3 pt-1">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-white/30 accent-brand-yellow"
            />
            <span className="text-sm text-white/70">
              {t('agreeTerms')}{' '}
              <Link
                href="/terms-of-service"
                target="_blank"
                className="font-semibold text-brand-yellow hover:underline"
              >
                {t('termsOfService')}
              </Link>
            </span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={privacyAccepted}
              onChange={(e) => setPrivacyAccepted(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-white/30 accent-brand-yellow"
            />
            <span className="text-sm text-white/70">
              {t('agreePrivacy')}{' '}
              <Link
                href="/privacy-policy"
                target="_blank"
                className="font-semibold text-brand-yellow hover:underline"
              >
                {t('privacyPolicy')}
              </Link>
            </span>
          </label>
        </div>

        <Button
          type="submit"
          variant="accent"
          size="lg"
          className="mt-2 w-full"
          disabled={loading}
        >
          {loading && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
          {t('createAccount')}
        </Button>
      </form>
    </AuthShell>
  )
}
