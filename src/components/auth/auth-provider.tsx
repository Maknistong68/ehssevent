'use client'

import { createContext, useContext, type ReactNode } from 'react'
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
  return (
    <AuthContext.Provider
      value={{
        user: mockUser,
        profile: MOCK_CURRENT_USER,
        effectiveProfile: MOCK_CURRENT_USER,
        isImpersonating: false,
        loading: false,
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
