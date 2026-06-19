'use client'

import { useAuth } from '@/components/auth/auth-provider'
import type { UserRole } from '@/types/enums'

interface RoleGateProps {
  allowedRoles: UserRole[]
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function RoleGate({ allowedRoles, children, fallback = null }: RoleGateProps) {
  const { profile, loading } = useAuth()

  if (loading) return null

  if (!profile || !allowedRoles.includes(profile.role)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
