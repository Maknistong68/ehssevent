'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AuthShell, AuthField, AuthAlert } from '@/components/auth/auth-shell'
import { AlertCircle, Eye, EyeOff, Loader2, Lock, User } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { loginAs } from '@/lib/actions/auth'

// Mock role launcher config. Usernames are generic and intentionally decoupled
// from the seed profiles' real names/emails, so no PII is shown on the login
// surface. `profileId` maps to the corresponding MOCK_PROFILES entry.
interface RoleOption {
  profileId: string
  username: string
  label: string
  description: string
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    profileId: '00000000-0000-0000-0000-000000000100',
    username: 'sysadmin01',
    label: 'System Admin',
    description: 'Full platform access including the /admin panel.',
  },
  {
    profileId: '00000000-0000-0000-0000-000000000101',
    username: 'support01',
    label: 'Support',
    description: 'Platform support with /admin access.',
  },
  {
    profileId: '00000000-0000-0000-0000-000000000001',
    username: 'clientadmin01',
    label: 'Client Admin',
    description: 'Manage org users plus all manager actions.',
  },
  {
    profileId: '00000000-0000-0000-0000-000000000002',
    username: 'manager01',
    label: 'Client Manager',
    description: 'Review and approve events; no user management.',
  },
  {
    profileId: '00000000-0000-0000-0000-000000000003',
    username: 'user01',
    label: 'Client User',
    description: 'Create and respond to events only.',
  },
  {
    profileId: '00000000-0000-0000-0000-000000000006',
    username: 'contractor01',
    label: 'Contractor User',
    description: 'Advance contractor-stage events only.',
  },
]

export function LoginForm() {
  const [selected, setSelected] = useState<RoleOption>(ROLE_OPTIONS[0])
  const [username, setUsername] = useState(ROLE_OPTIONS[0].username)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const t = useTranslations('auth')

  const handleSelect = (option: RoleOption) => {
    setSelected(option)
    setUsername(option.username)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    // loginAs sets the mock-session cookie and redirects to /dashboard. It only
    // returns when the selected id is invalid.
    const result = await loginAs(selected.profileId)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title={t('welcomeBack')}
      subtitle={t('signInSubtitle')}
      footer={
        <p className="text-center text-sm text-white/60">
          {t('noAccount')}{' '}
          <Link
            href="/signup"
            className="font-semibold text-brand-yellow hover:underline"
          >
            {t('signUp')}
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

        <div className="grid grid-cols-2 gap-2">
          {ROLE_OPTIONS.map((option) => {
            const active = option.profileId === selected.profileId
            return (
              <button
                key={option.profileId}
                type="button"
                onClick={() => handleSelect(option)}
                aria-pressed={active}
                className={[
                  'rounded-2xl border p-3 text-start transition-colors',
                  active
                    ? 'border-brand-yellow bg-brand-yellow/15'
                    : 'border-white/15 bg-white/5 hover:bg-white/10',
                ].join(' ')}
              >
                <span className="block text-sm font-semibold text-white">
                  {option.label}
                </span>
                <span className="mt-0.5 block text-xs text-white/55">
                  {option.username}
                </span>
                <span className="mt-1 block text-xs leading-snug text-white/70">
                  {option.description}
                </span>
              </button>
            )
          })}
        </div>

        <AuthField
          icon={<User className="h-5 w-5" />}
          type="text"
          placeholder="username"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        <AuthField
          icon={<Lock className="h-5 w-5" />}
          type={showPassword ? 'text' : 'password'}
          placeholder={t('password')}
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          endAdornment={
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="text-white/55 transition-colors hover:text-white"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
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
