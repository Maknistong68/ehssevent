'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { Profile } from '@/types/database'

interface AuthUser {
  id: string
  email: string | null
}

interface AuthContextType {
  user: AuthUser | null
  profile: Profile | null
  effectiveProfile: Profile | null
  isImpersonating: boolean
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  effectiveProfile: null,
  isImpersonating: false,
  loading: true,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  // `profile` is the real signed-in identity; `effectiveProfile` is what the UI
  // renders as — they differ while an admin is impersonating ("view as"). Both
  // are resolved from the server (which reads the Supabase session), so nothing
  // here is hardcoded.
  const [state, setState] = useState<AuthContextType>({
    user: null,
    profile: null,
    effectiveProfile: null,
    isImpersonating: false,
    loading: true,
  })

  useEffect(() => {
    let active = true

    fetch('/api/effective-profile')
      .then((res) => (res.ok ? res.json() : null))
      .then(
        (
          data: { profile: Profile | null; isImpersonating: boolean } | null
        ) => {
          if (!active) return
          const profile = data?.profile ?? null
          setState({
            user: profile ? { id: profile.id, email: profile.email } : null,
            profile,
            effectiveProfile: profile,
            isImpersonating: Boolean(data?.isImpersonating),
            loading: false,
          })
        }
      )
      .catch(() => {
        if (!active) return
        setState((prev) => ({ ...prev, loading: false }))
      })

    return () => {
      active = false
    }
  }, [])

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
