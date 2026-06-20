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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Pencil, Loader2, Power } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { updateTeamMember } from '@/lib/actions/team'
import { ROLE_PERMISSIONS } from '@/lib/auth/permissions'
import type { Profile } from '@/types/database'
import type { UserRole } from '@/types/enums'
import { toast } from 'sonner'

// Roles a client_admin can assign (no platform-admin roles)
const ASSIGNABLE_ROLES: { value: UserRole; label: string }[] = [
  { value: 'client_admin', label: 'Client Admin' },
  { value: 'client_manager', label: 'Client Manager' },
  { value: 'client_user', label: 'Client User' },
  { value: 'contractor_user', label: 'Contractor User' },
]

interface TeamMembersProps {
  members: Profile[]
  currentUserId: string
}

export function TeamMembers({ members, currentUserId }: TeamMembersProps) {
  const [editUser, setEditUser] = useState<Profile | null>(null)
  const [role, setRole] = useState<UserRole>('client_user')
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const router = useRouter()
  const t = useTranslations()

  const openEdit = (profile: Profile) => {
    setEditUser(profile)
    setRole(profile.role)
  }

  const handleSave = async () => {
    if (!editUser) return
    setLoading(true)

    const result = await updateTeamMember({
      user_id: editUser.id,
      role,
    })

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Member updated')
      setEditUser(null)
      router.refresh()
    }
    setLoading(false)
  }

  const handleToggleActive = async () => {
    if (!editUser) return
    setBusy(true)
    const result = await updateTeamMember({
      user_id: editUser.id,
      is_active: !editUser.is_active,
    })
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(editUser.is_active ? 'Member deactivated' : 'Member activated')
      setEditUser(null)
      router.refresh()
    }
    setBusy(false)
  }

  const isSelf = editUser?.id === currentUserId
  const effectivePermissions = editUser ? ROLE_PERMISSIONS[editUser.role] ?? [] : []

  return (
    <div className="space-y-3">
      <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('team.editMember')}</DialogTitle>
          </DialogHeader>
          {editUser && (
            <div className="space-y-5">
              <div className="space-y-1">
                <p className="font-medium">{editUser.full_name || 'No name'}</p>
                <p className="text-sm text-muted-foreground">{editUser.email}</p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Badge variant="secondary">{t(`roles.${editUser.role}`)}</Badge>
                  <Badge variant={editUser.is_active ? 'accent' : 'destructive'}>
                    {editUser.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>{t('team.role')}</Label>
                <Select value={role} onValueChange={(v) => v && setRole(v as UserRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSIGNABLE_ROLES.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleSave} disabled={loading || isSelf} className="w-full">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('team.saveChanges')}
              </Button>

              <Separator />

              <div className="space-y-2">
                <Label className="text-sm">{t('team.permissions')}</Label>
                <div className="flex flex-wrap gap-1.5">
                  {effectivePermissions.map((p) => (
                    <Badge key={p} variant="outline" className="font-mono text-[11px]">
                      {p}
                    </Badge>
                  ))}
                </div>
              </div>

              <Separator />

              <Button
                variant="outline"
                onClick={handleToggleActive}
                disabled={busy || isSelf}
                className="w-full"
                data-icon="inline-start"
              >
                <Power className="h-4 w-4" />
                {editUser.is_active ? t('team.deactivate') : t('team.activate')}
              </Button>
              {isSelf && (
                <p className="text-xs text-muted-foreground">
                  {t('team.cannotEditSelf')}
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {members.map((member, i) => {
        const initials = (member.full_name || member.email || 'U')
          .split(/[\s._@-]+/)
          .slice(0, 2)
          .map((p) => p[0]?.toUpperCase())
          .join('')

        return (
          <Card
            key={member.id}
            size="sm"
            className="animate-fade-up"
            style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}
          >
            <CardContent className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-secondary font-heading text-sm font-bold text-brand-green">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {member.full_name || 'No name'}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {member.email}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge variant="secondary">{t(`roles.${member.role}`)}</Badge>
                {!member.is_active && (
                  <Badge variant="destructive">Inactive</Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEdit(member)}
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
