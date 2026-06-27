'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Pencil,
  Loader2,
  Eye,
  ShieldCheck,
  Power,
  UserPlus,
  Check,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { updateUserProfile, inviteUser, approveUser } from '@/lib/actions/admin'
import { startImpersonation } from '@/lib/actions/impersonation'
import { ROLE_PERMISSIONS } from '@/lib/auth/permissions'
import { initials, displayName } from '@/lib/utils/people'
import type { Profile, Organization } from '@/types/database'
import type { UserRole, UserStatus } from '@/types/enums'
import { USER_STATUS_LABELS } from '@/types/enums'
import { toast } from 'sonner'

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'system_admin', label: 'System Admin' },
  { value: 'support', label: 'Support' },
  { value: 'client_admin', label: 'Client Admin' },
  { value: 'client_manager', label: 'Client Manager' },
  { value: 'client_user', label: 'Client User' },
  { value: 'contractor_user', label: 'Contractor User' },
]

const STATUS_VARIANT: Record<
  UserStatus,
  'accent' | 'secondary' | 'outline' | 'destructive'
> = {
  active: 'accent',
  pending: 'secondary',
  invited: 'outline',
  deactivated: 'destructive',
}

interface AdminUsersProps {
  profiles: Profile[]
  organizations: Organization[]
  currentUserId: string
}

export function AdminUsers({
  profiles,
  organizations,
  currentUserId,
}: AdminUsersProps) {
  const [editUser, setEditUser] = useState<Profile | null>(null)
  const [role, setRole] = useState<UserRole>('client_user')
  const [orgId, setOrgId] = useState('')
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)

  // Invite dialog state
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<UserRole>('client_user')
  const [inviteOrg, setInviteOrg] = useState('')
  const [inviting, setInviting] = useState(false)

  const router = useRouter()
  const t = useTranslations()

  const openEdit = (profile: Profile) => {
    setEditUser(profile)
    setRole(profile.role)
    setOrgId(profile.organization_id || '')
  }

  const handleSave = async () => {
    if (!editUser) return
    setLoading(true)

    const result = await updateUserProfile({
      user_id: editUser.id,
      role,
      organization_id: orgId || null,
    })

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('User updated')
      setEditUser(null)
      router.refresh()
    }
    setLoading(false)
  }

  const handleSetStatus = async (status: UserStatus) => {
    if (!editUser) return
    setBusy(true)
    const result = await updateUserProfile({ user_id: editUser.id, status })
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(status === 'active' ? 'User activated' : 'User deactivated')
      setEditUser(null)
      router.refresh()
    }
    setBusy(false)
  }

  const handleApprove = async () => {
    if (!editUser) return
    setBusy(true)
    const result = await approveUser({
      user_id: editUser.id,
      role,
      organization_id: orgId || null,
    })
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('User approved')
      setEditUser(null)
      router.refresh()
    }
    setBusy(false)
  }

  const handleInvite = async () => {
    setInviting(true)
    const result = await inviteUser({
      email: inviteEmail,
      role: inviteRole,
      organization_id: inviteOrg || null,
    })
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Invitation sent')
      setInviteOpen(false)
      setInviteEmail('')
      setInviteOrg('')
      router.refresh()
    }
    setInviting(false)
  }

  const handleViewAs = async () => {
    if (!editUser) return
    setBusy(true)
    const result = await startImpersonation(editUser.id)
    if (result.error) {
      toast.error(result.error)
      setBusy(false)
      return
    }
    // Reload so the auth provider resolves the impersonated profile.
    window.location.href = '/dashboard'
  }

  const isSelf = editUser?.id === currentUserId
  const effectivePermissions = editUser
    ? (ROLE_PERMISSIONS[editUser.role] ?? [])
    : []
  const editOrg = editUser?.organization as
    | { id: string; name: string; org_type: string }
    | undefined

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button onClick={() => setInviteOpen(true)} data-icon="inline-start">
          <UserPlus className="h-4 w-4" />
          Invite User
        </Button>
      </div>

      {/* Invite dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="name@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={inviteRole}
                onValueChange={(v) => v && setInviteRole(v as UserRole)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Organization</Label>
              <Select
                value={inviteOrg || 'none'}
                onValueChange={(v) =>
                  setInviteOrg(v === 'none' ? '' : (v ?? ''))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="No organization" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Organization</SelectItem>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name} ({org.org_type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleInvite}
              disabled={inviting || !inviteEmail.trim()}
              className="w-full"
            >
              {inviting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Invitation
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editUser}
        onOpenChange={(open) => !open && setEditUser(null)}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Troubleshooting</DialogTitle>
          </DialogHeader>
          {editUser && (
            <div className="space-y-5">
              <div className="space-y-1">
                <p className="font-medium">{displayName(editUser)}</p>
                <p className="text-sm text-muted-foreground">
                  {editUser.username}
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Badge variant="secondary">
                    {t(`roles.${editUser.role}`)}
                  </Badge>
                  <Badge variant={STATUS_VARIANT[editUser.status]}>
                    {USER_STATUS_LABELS[editUser.status]}
                  </Badge>
                  {editOrg && <Badge variant="outline">{editOrg.name}</Badge>}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={role}
                  onValueChange={(v) => v && setRole(v as UserRole)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Organization</Label>
                <Select value={orgId} onValueChange={(v) => setOrgId(v ?? '')}>
                  <SelectTrigger>
                    <SelectValue placeholder="No organization" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Organization</SelectItem>
                    {organizations.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name} ({org.org_type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleSave}
                disabled={loading}
                className="w-full"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>

              {editUser.status === 'pending' && (
                <Button
                  onClick={handleApprove}
                  disabled={busy}
                  variant="accent"
                  className="w-full"
                  data-icon="inline-start"
                >
                  <Check className="h-4 w-4" />
                  Approve Access
                </Button>
              )}

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm">
                    {t('admin.effectivePermissions')}
                  </Label>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {effectivePermissions.map((p) => (
                    <Badge
                      key={p}
                      variant="outline"
                      className="font-mono text-[11px]"
                    >
                      {p}
                    </Badge>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Button
                  variant="outline"
                  onClick={() =>
                    handleSetStatus(
                      editUser.status === 'active' ? 'deactivated' : 'active'
                    )
                  }
                  disabled={busy || isSelf}
                  data-icon="inline-start"
                >
                  <Power className="h-4 w-4" />
                  {editUser.status === 'active' ? 'Deactivate' : 'Activate'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleViewAs}
                  disabled={busy || isSelf}
                  data-icon="inline-start"
                >
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  {t('admin.viewAs')}
                </Button>
              </div>
              {isSelf && (
                <p className="text-xs text-muted-foreground">
                  You cannot deactivate or view-as your own account.
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {profiles.map((profile, i) => {
        const org = profile.organization as
          | { id: string; name: string; org_type: string }
          | undefined

        return (
          <Card
            key={profile.id}
            size="sm"
            className="animate-fade-up"
            style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}
          >
            <CardContent className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-secondary font-heading text-sm font-bold text-brand-green">
                  {initials(profile.full_name, profile.email, profile.username)}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium">{displayName(profile)}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {profile.username}
                  </p>
                  {org && (
                    <p className="truncate text-xs text-muted-foreground">
                      {org.name}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge variant="secondary">{profile.role}</Badge>
                <Badge variant={STATUS_VARIANT[profile.status]}>
                  {USER_STATUS_LABELS[profile.status]}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEdit(profile)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
