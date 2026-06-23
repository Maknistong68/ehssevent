'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { MOCK_CURRENT_USER } from '@/lib/mock-data'
import type { Profile } from '@/types/database'

interface MockUser {
  id: string
  email: string
}

interface AuthContextType {
  user: MockUser | null
  profile: Profile | null
  effectiveProfile: Profile | null
  isImpersonating: boolean
  loading: boolean
}

const mockUser: MockUser = {
  id: MOCK_CURRENT_USER.id,
  email: MOCK_CURRENT_USER.email,
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
  // renders as — they differ while an admin is impersonating ("view as").
  const [state, setState] = useState<AuthContextType>({
    user: mockUser,
    profile: MOCK_CURRENT_USER,
    effectiveProfile: MOCK_CURRENT_USER,
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
          setState({
            user: mockUser,
            profile: MOCK_CURRENT_USER,
            effectiveProfile: data?.profile ?? MOCK_CURRENT_USER,
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
