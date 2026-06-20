import type { UserRole } from '@/types/enums'

/**
 * Permission matrix — single source of truth for authorization, shared by
 * both server guards and UI gating. Permission keys are `resource:action`.
 *
 * A role's listed permissions describe what actions it may attempt; ownership
 * and organization scoping are still enforced underneath by database RLS.
 */
export type Permission =
  | 'event:view'
  | 'event:create'
  | 'event:respond'
  | 'event:manage'
  | 'event:export'
  | 'ca:view'
  | 'ca:create'
  | 'ca:approve'
  | 'ca:manage'
  | 'inspection:view'
  | 'inspection:conduct'
  | 'inspection:templates'
  | 'project:view'
  | 'project:manage'
  | 'org:manage'
  | 'user:manage'
  | 'team:view'
  | 'admin:access'
  | 'audit:view'
  | 'impersonate:use'

// Permissions granted to every role (baseline viewer + creator experience).
const BASE_PERMISSIONS: Permission[] = [
  'event:view',
  'event:create',
  'event:respond',
  'ca:view',
  'ca:create',
  'inspection:view',
  'inspection:conduct',
  'project:view',
]

// Additional permissions for client managers / admins (advance approvals,
// closeouts, CA approvals, inspection templates, project management).
const MANAGER_PERMISSIONS: Permission[] = [
  'event:manage',
  'event:export',
  'ca:approve',
  'ca:manage',
  'inspection:templates',
  'project:manage',
]

// Platform-admin capabilities (system_admin, support).
const ADMIN_PERMISSIONS: Permission[] = [
  'org:manage',
  'user:manage',
  'admin:access',
  'audit:view',
  'impersonate:use',
]

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  system_admin: [...BASE_PERMISSIONS, ...MANAGER_PERMISSIONS, ...ADMIN_PERMISSIONS],
  support: [...BASE_PERMISSIONS, ...MANAGER_PERMISSIONS, ...ADMIN_PERMISSIONS],
  // client_admin may also manage users within its own org (org-scoped, enforced
  // by updateUserProfile + migration 019); the platform admin panel stays
  // admin-only, so 'admin:access' is intentionally not granted here.
  client_admin: [...BASE_PERMISSIONS, ...MANAGER_PERMISSIONS, 'user:manage', 'team:view'],
  client_manager: [...BASE_PERMISSIONS, ...MANAGER_PERMISSIONS],
  client_user: [...BASE_PERMISSIONS],
  contractor_user: [...BASE_PERMISSIONS],
}

/**
 * Returns whether the given role is granted the permission.
 * An undefined role (not signed in / not loaded) is never authorized.
 */
export function can(role: UserRole | undefined, p: Permission): boolean {
  if (!role) return false
  return ROLE_PERMISSIONS[role]?.includes(p) ?? false
}

/**
 * A read-only ("view") permission is one whose action segment is `view`.
 * Used by impersonation to disable mutation UI while viewing as another user.
 */
export function isViewPermission(p: Permission): boolean {
  return p.endsWith(':view')
}
