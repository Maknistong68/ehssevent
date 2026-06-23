'use client'

import { useAuth } from '@/components/auth/auth-provider'
import {
  can as roleCan,
  isViewPermission,
  type Permission,
} from '@/lib/auth/permissions'
import type { UserRole } from '@/types/enums'

interface RoleGateProps {
  allowedRoles: UserRole[]
  children: React.ReactNode
  fallback?: React.ReactNode
}

/**
 * Legacy role-list gate. Prefer <Can permission="..."> for new code.
 */
export function RoleGate({
  allowedRoles,
  children,
  fallback = null,
}: RoleGateProps) {
  const { effectiveProfile, loading } = useAuth()

  if (loading) return null

  if (!effectiveProfile || !allowedRoles.includes(effectiveProfile.role)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

/**
 * Permission-aware hook driven by the matrix (single source of truth).
 * While impersonating, only `:view` permissions are granted so the simulated
 * session stays strictly read-only.
 */
export function usePermissions() {
  const { effectiveProfile, isImpersonating, loading } = useAuth()

  const can = (p: Permission): boolean => {
    if (!effectiveProfile) return false
    if (isImpersonating && !isViewPermission(p)) return false
    return roleCan(effectiveProfile.role, p)
  }

  return { can, loading, isImpersonating }
}

interface CanProps {
  permission: Permission
  children: React.ReactNode
  fallback?: React.ReactNode
}

/**
 * Renders children only when the effective role holds the given permission.
 */
export function Can({ permission, children, fallback = null }: CanProps) {
  const { can, loading } = usePermissions()

  if (loading) return null
  return can(permission) ? <>{children}</> : <>{fallback}</>
}
