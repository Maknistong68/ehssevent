'use client'

import { Check, Minus } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ALL_PERMISSIONS,
  ROLE_PERMISSIONS,
  type Permission,
} from '@/lib/auth/permissions'
import type { UserRole } from '@/types/enums'

// Columns ordered from least to most privileged so the spread of capabilities
// reads left-to-right.
const MATRIX_ROLES: UserRole[] = [
  'contractor_user',
  'client_user',
  'client_manager',
  'client_admin',
  'support',
  'system_admin',
]

const ROLE_LABELS: Record<UserRole, string> = {
  contractor_user: 'Contractor',
  client_user: 'Client User',
  client_manager: 'Client Manager',
  client_admin: 'Client Admin',
  support: 'Support',
  system_admin: 'System Admin',
}

const PERMISSION_LABELS: Record<Permission, string> = {
  'event:view': 'View events',
  'event:create': 'Create / report events',
  'event:review': 'Advance contractor stages',
  'event:manage': 'Advance client stages / close out',
  'ca:view': 'View corrective actions',
  'ca:create': 'Raise corrective actions',
  'ca:approve': 'Approve corrective actions',
  'ca:manage': 'Manage corrective actions',
  'inspection:view': 'View inspections',
  'inspection:conduct': 'Conduct inspections',
  'inspection:templates': 'Manage inspection templates',
  'project:view': 'View projects',
  'project:manage': 'Manage projects',
  'team:view': 'View team',
  'notification:view': 'View notifications',
  'org:manage': 'Manage organizations',
  'user:manage': 'Manage users',
  'admin:access': 'Access admin panel',
  'audit:view': 'View audit log',
  'dsr:manage': 'Manage data subject requests',
  'impersonate:use': 'Impersonate ("view as")',
}

// Human-readable section headers, keyed by the permission's resource prefix.
const GROUP_LABELS: Record<string, string> = {
  event: 'Events',
  ca: 'Corrective Actions',
  inspection: 'Inspections',
  project: 'Projects',
  team: 'Team',
  notification: 'Notifications',
  org: 'Administration',
  user: 'Administration',
  admin: 'Administration',
  audit: 'Administration',
  dsr: 'Administration',
  impersonate: 'Administration',
}

function groupOf(p: Permission): string {
  return GROUP_LABELS[p.split(':')[0]] ?? 'Other'
}

const ROLE_HAS = (role: UserRole, p: Permission): boolean =>
  ROLE_PERMISSIONS[role]?.includes(p) ?? false

export function PermissionMatrix() {
  // Build ordered groups while preserving ALL_PERMISSIONS order.
  const groups: { label: string; permissions: Permission[] }[] = []
  for (const p of ALL_PERMISSIONS) {
    const label = groupOf(p)
    const last = groups[groups.length - 1]
    if (last && last.label === label) last.permissions.push(p)
    else groups.push({ label, permissions: [p] })
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-secondary/40 p-3 text-xs text-muted-foreground ring-1 ring-foreground/[0.04]">
        Read-only. Roles and their permissions are defined in code (
        <span className="font-mono">src/lib/auth/permissions.ts</span>) and are
        the single source of truth enforced by server guards, database RLS, and
        the UI. Assign a role to a user in the{' '}
        <span className="font-medium">Users</span> tab.
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 z-10 bg-card">
              Permission
            </TableHead>
            {MATRIX_ROLES.map((role) => (
              <TableHead key={role} className="text-center">
                {ROLE_LABELS[role]}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {groups.map((group) => (
            <GroupRows key={group.label} group={group} />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function GroupRows({
  group,
}: {
  group: { label: string; permissions: Permission[] }
}) {
  return (
    <>
      <TableRow className="hover:bg-transparent">
        <TableCell
          colSpan={MATRIX_ROLES.length + 1}
          className="sticky left-0 bg-muted/40 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
        >
          {group.label}
        </TableCell>
      </TableRow>
      {group.permissions.map((p) => (
        <TableRow key={p}>
          <TableCell className="sticky left-0 z-10 bg-card">
            <span className="text-sm">{PERMISSION_LABELS[p]}</span>
            <span className="ml-2 font-mono text-[11px] text-muted-foreground">
              {p}
            </span>
          </TableCell>
          {MATRIX_ROLES.map((role) => (
            <TableCell key={role} className="text-center">
              {ROLE_HAS(role, p) ? (
                <Check
                  className="mx-auto h-4 w-4 text-brand-green"
                  aria-label="granted"
                />
              ) : (
                <Minus
                  className="mx-auto h-4 w-4 text-muted-foreground/40"
                  aria-label="not granted"
                />
              )}
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}
