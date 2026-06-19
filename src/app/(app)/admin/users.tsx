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
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Pencil, Loader2 } from 'lucide-react'
import { updateUserProfile } from '@/lib/actions/admin'
import type { Profile, Organization } from '@/types/database'
import type { UserRole } from '@/types/enums'
import { toast } from 'sonner'

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'system_admin', label: 'System Admin' },
  { value: 'support', label: 'Support' },
  { value: 'client_admin', label: 'Client Admin' },
  { value: 'client_manager', label: 'Client Manager' },
  { value: 'client_user', label: 'Client User' },
  { value: 'contractor_user', label: 'Contractor User' },
]

interface AdminUsersProps {
  profiles: Profile[]
  organizations: Organization[]
}

export function AdminUsers({ profiles, organizations }: AdminUsersProps) {
  const [editUser, setEditUser] = useState<Profile | null>(null)
  const [role, setRole] = useState<UserRole>('client_user')
  const [orgId, setOrgId] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

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

  return (
    <div className="space-y-3">
      <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          {editUser && (
            <div className="space-y-4">
              <div>
                <p className="font-medium">{editUser.full_name || 'No name'}</p>
                <p className="text-sm text-muted-foreground">{editUser.email}</p>
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={role} onValueChange={(v) => v && setRole(v as UserRole)}>
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

              <Button onClick={handleSave} disabled={loading} className="w-full">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {profiles.map((profile, i) => {
        const org = profile.organization as
          | { id: string; name: string; org_type: string }
          | undefined

        const initials = (profile.full_name || profile.email || 'U')
          .split(/[\s._@-]+/)
          .slice(0, 2)
          .map((p) => p[0]?.toUpperCase())
          .join('')

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
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {profile.full_name || 'No name'}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {profile.email}
                  </p>
                  {org && (
                    <p className="truncate text-xs text-muted-foreground">{org.name}</p>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge variant="secondary">{profile.role}</Badge>
                {!profile.is_active && (
                  <Badge variant="destructive">Inactive</Badge>
                )}
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
