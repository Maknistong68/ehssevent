import {
  EVENT_APPROVAL_SEQUENCE,
  EVENT_STAGE_OWNER,
  type EventApprovalLevel,
  type UserRole,
} from '@/types/enums'

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
  // Advance a contractor-owned workflow stage (contractor_review,
  // contractor_investigation). Held by contractor actors and, as oversight,
  // by client managers/admins.
  | 'event:review'
  | 'event:manage'
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
  | 'notification:view'
  | 'admin:access'
  | 'audit:view'
  | 'dsr:manage'
  | 'impersonate:use'

// Permissions granted to every role (baseline viewer + creator experience).
const BASE_PERMISSIONS: Permission[] = [
  'event:view',
  'event:create',
  'ca:view',
  'ca:create',
  'inspection:view',
  'inspection:conduct',
  'project:view',
  'notification:view',
]

// Additional permissions for client managers / admins (advance approvals,
// closeouts, CA approvals, inspection templates, project management).
// `event:review` is included so client managers can oversee/unblock the
// contractor-owned stages in addition to their own client stages.
const MANAGER_PERMISSIONS: Permission[] = [
  'event:review',
  'event:manage',
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
  'dsr:manage',
  'impersonate:use',
]

// Every permission, in display order (grouped by resource). Kept beside the
// matrix so a single edit to a role's capabilities is reflected everywhere,
// including the read-only admin permission matrix.
export const ALL_PERMISSIONS: Permission[] = [
  'event:view',
  'event:create',
  'event:review',
  'event:manage',
  'ca:view',
  'ca:create',
  'ca:approve',
  'ca:manage',
  'inspection:view',
  'inspection:conduct',
  'inspection:templates',
  'project:view',
  'project:manage',
  'team:view',
  'notification:view',
  'org:manage',
  'user:manage',
  'admin:access',
  'audit:view',
  'dsr:manage',
  'impersonate:use',
]

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  system_admin: [
    ...BASE_PERMISSIONS,
    ...MANAGER_PERMISSIONS,
    ...ADMIN_PERMISSIONS,
  ],
  support: [...BASE_PERMISSIONS, ...MANAGER_PERMISSIONS, ...ADMIN_PERMISSIONS],
  // client_admin may also manage users within its own org (org-scoped, enforced
  // by updateUserProfile + migration 019); the platform admin panel stays
  // admin-only, so 'admin:access' is intentionally not granted here.
  client_admin: [
    ...BASE_PERMISSIONS,
    ...MANAGER_PERMISSIONS,
    'user:manage',
    'team:view',
  ],
  client_manager: [...BASE_PERMISSIONS, ...MANAGER_PERMISSIONS],
  client_user: [...BASE_PERMISSIONS],
  // Contractors own the contractor_review / contractor_investigation stages,
  // so they get event:review (but not event:manage — the client owns sign-off).
  contractor_user: [...BASE_PERMISSIONS, 'event:review'],
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

// ============================================================
// Event approval workflow — authorization derived from the data
// ============================================================

/**
 * The next stage in the canonical lifecycle, or `null` if `level` is terminal
 * (`closed`) or unknown. Derived purely from `EVENT_APPROVAL_SEQUENCE`.
 */
export function nextEventStage(
  level: EventApprovalLevel
): EventApprovalLevel | null {
  const i = EVENT_APPROVAL_SEQUENCE.indexOf(level)
  if (i < 0 || i >= EVENT_APPROVAL_SEQUENCE.length - 1) return null
  return EVENT_APPROVAL_SEQUENCE[i + 1]
}

/**
 * The permission required to *leave* a given stage, derived from the stage's
 * owning organization type in the data model:
 *   - contractor-owned stage → `event:review`
 *   - client-owned stage     → `event:manage`
 *   - boundary stage (draft) → `event:create` (the reporter submits their report)
 * `closed` is terminal/immutable and has no leave permission.
 */
export function requiredPermissionToLeaveStage(
  level: EventApprovalLevel
): Permission | null {
  if (level === 'closed') return null
  const owner = EVENT_STAGE_OWNER[level]
  if (owner === 'contractor') return 'event:review'
  if (owner === 'client') return 'event:manage'
  return 'event:create'
}

/**
 * The set of approval levels `role` may transition an event *to*, given its
 * current `level`.
 *
 * - `closed` events are immutable: no transitions.
 * - A user must hold the permission required to leave the current stage.
 * - Holders of `event:manage` get full lifecycle override (any other stage),
 *   matching the oversight role of client managers/admins.
 * - Everyone else may only advance one step forward along the canonical
 *   sequence.
 *
 * Row-level ownership (e.g. which contractor org the event belongs to) is
 * enforced separately by database RLS, not here.
 */
export function allowedEventTransitions(
  role: UserRole | undefined,
  level: EventApprovalLevel
): EventApprovalLevel[] {
  if (!role || level === 'closed') return []

  const required = requiredPermissionToLeaveStage(level)
  if (!required || !can(role, required)) return []

  if (can(role, 'event:manage')) {
    return EVENT_APPROVAL_SEQUENCE.filter((s) => s !== level)
  }

  const next = nextEventStage(level)
  return next ? [next] : []
}

/**
 * Whether `role` may move an event from `level` to `target`. Single source of
 * truth shared by the server action and the UI control.
 */
export function canTransitionEvent(
  role: UserRole | undefined,
  level: EventApprovalLevel,
  target: EventApprovalLevel
): boolean {
  return allowedEventTransitions(role, level).includes(target)
}
