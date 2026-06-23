'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AuthShell, AuthField, AuthAlert } from '@/components/auth/auth-shell'
import { AlertCircle, CheckCircle2, Loader2, Lock, User } from 'lucide-react'
import { acceptInvite } from '@/lib/actions/auth'

export function AcceptInviteForm() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    const result = await acceptInvite({ username })
    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }
    setSuccess(result.success ?? 'Your account is now active.')
    setLoading(false)
  }

  return (
    <AuthShell
      title={'accept\ninvite'}
      subtitle="Set a password to activate your invited account"
      footer={
        <p className="text-center text-sm text-white/60">
          <Link
            href="/login"
            className="font-semibold text-brand-yellow hover:underline"
          >
            Back to sign in
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
          placeholder="username"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <AuthField
          icon={<Lock className="h-5 w-5" />}
          type="password"
          placeholder="New password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <AuthField
          icon={<Lock className="h-5 w-5" />}
          type="password"
          placeholder="Confirm password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
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
          Activate Account
        </Button>
      </form>
    </AuthShell>
  )
}
