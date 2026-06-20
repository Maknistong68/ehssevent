'use client'

import { createContext, useContext, useCallback, useEffect, useState, type ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/types/database'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  /** Profile that drives UI gating — the impersonated target when viewing-as. */
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
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [effectiveProfile, setEffectiveProfile] = useState<Profile | null>(null)
  const [isImpersonating, setIsImpersonating] = useState(false)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // Resolve the effective (possibly impersonated) profile from the server,
  // since the impersonation cookie is httpOnly and unreadable on the client.
  const refreshEffectiveProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/effective-profile', { cache: 'no-store' })
      if (!res.ok) return
      const data = (await res.json()) as {
        profile: Profile | null
        isImpersonating: boolean
      }
      setEffectiveProfile(data.profile)
      setIsImpersonating(data.isImpersonating)
    } catch {
      // Ignore — gating falls back to the real profile.
    }
  }, [])

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*, organization:organizations(*)')
          .eq('id', user.id)
          .single()
        setProfile(data)
        await refreshEffectiveProfile()
      }

      setLoading(false)
    }

    getUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)

      if (session?.user) {
        const { data } = await supabase
          .from('profiles')
          .select('*, organization:organizations(*)')
          .eq('id', session.user.id)
          .single()
        setProfile(data)
        await refreshEffectiveProfile()
      } else {
        setProfile(null)
        setEffectiveProfile(null)
        setIsImpersonating(false)
      }

      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase, refreshEffectiveProfile])

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        effectiveProfile: effectiveProfile ?? profile,
        isImpersonating,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
