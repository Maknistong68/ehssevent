'use client'

import { useState } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { LogOut, Mail, Building2, Shield, FileText, Lock, Pencil, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { DsrRequestDialog } from '@/components/profile/dsr-request-dialog'
import { DPO_EMAIL } from '@/lib/constants/legal'
import { updateProfile } from '@/lib/actions/profile'
import { toast } from 'sonner'

const ROLE_LABELS: Record<string, string> = {
  system_admin: 'System Admin',
  support: 'Support',
  client_admin: 'Client Admin',
  client_manager: 'Client Manager',
  client_user: 'Client User',
  contractor_user: 'Contractor User',
}

export default function ProfilePage() {
  const { profile, loading } = useAuth()
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [saving, setSaving] = useState(false)

  const handleLogout = async () => {
    router.push('/login')
    router.refresh()
  }

  const handleStartEdit = () => {
    setEditName(profile?.full_name || '')
    setEditing(true)
  }

  const handleCancelEdit = () => {
    setEditing(false)
    setEditName('')
  }

  const handleSave = async () => {
    setSaving(true)
    const result = await updateProfile({ full_name: editName })
    setSaving(false)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Profile updated successfully')
      setEditing(false)
      router.refresh()
    }
  }

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  const initials = (profile?.full_name || profile?.email || 'U')
    .split(/[\s._@-]+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')

  return (
    <div className="max-w-2xl p-4 md:p-6 space-y-6">
      <h1 className="mb-6 font-heading text-2xl font-bold tracking-tight md:text-3xl">Profile</h1>

      <Card className="animate-fade-up">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary font-heading text-xl font-bold text-primary-foreground shadow-soft">
                {initials}
              </div>
              <div>
                {editing ? (
                  <div className="space-y-2">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Full name"
                      className="h-9"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSave} disabled={saving || !editName.trim()}>
                        {saving && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancelEdit} disabled={saving}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <CardTitle className="text-lg">{profile?.full_name || 'No name set'}</CardTitle>
                    <CardDescription>{profile?.email}</CardDescription>
                  </>
                )}
              </div>
            </div>
            {!editing && (
              <Button variant="outline" size="sm" onClick={handleStartEdit}>
                <Pencil className="mr-1 h-3 w-3" />
                Edit Profile
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Separator />

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-muted-foreground">{profile?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Role</p>
                <Badge variant="secondary">
                  {ROLE_LABELS[profile?.role || ''] || profile?.role}
                </Badge>
              </div>
            </div>

            {profile?.organization && (
              <div className="flex items-center gap-3">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Organization</p>
                  <p className="text-sm text-muted-foreground">
                    {(profile.organization as { name: string }).name}
                  </p>
                </div>
              </div>
            )}
          </div>

          <Separator />

          <Button variant="destructive" onClick={handleLogout} className="w-full">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </CardContent>
      </Card>

      <Card className="animate-fade-up animate-delay-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lock className="h-4 w-4" />
            Privacy & Data
          </CardTitle>
          <CardDescription>
            Your data rights under the Saudi Personal Data Protection Law (PDPL)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Terms of Service</p>
                <p className="text-sm text-muted-foreground">
                  {profile?.terms_accepted_at
                    ? `Accepted on ${format(new Date(profile.terms_accepted_at), 'dd MMM yyyy')} (v${profile.terms_version || '1.0'})`
                    : 'Not recorded'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Privacy Policy (PDPL)</p>
                <p className="text-sm text-muted-foreground">
                  {profile?.privacy_accepted_at
                    ? `Accepted on ${format(new Date(profile.privacy_accepted_at), 'dd MMM yyyy')} (v${profile.privacy_version || '1.0'})`
                    : 'Not recorded'}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="rounded-2xl bg-muted/50 p-4">
            <h4 className="text-sm font-semibold mb-2">Your PDPL Data Rights (Article 4)</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>- Right to be informed about how your data is used</li>
              <li>- Right to access your personal data</li>
              <li>- Right to obtain a copy of your data</li>
              <li>- Right to correct inaccurate data</li>
              <li>- Right to request destruction of your data</li>
            </ul>
          </div>

          <DsrRequestDialog />
          <p className="text-xs text-center text-muted-foreground">
            Contact {DPO_EMAIL} for data requests
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
