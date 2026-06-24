'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Can } from '@/components/shared/role-gate'
import {
  updateNotificationPreferences,
  updateOrganization,
} from '@/lib/actions/settings'
import type {
  Profile,
  Organization,
  NotificationPreferences,
} from '@/types/database'

const ROLE_LABELS: Record<string, string> = {
  system_admin: 'System Admin',
  support: 'Support',
  client_admin: 'Client Admin',
  client_manager: 'Client Manager',
  client_user: 'Client User',
  contractor_user: 'Contractor User',
}

interface SettingsTabsProps {
  profile: Profile
  organization: Organization | null
  preferences: NotificationPreferences
}

export function SettingsTabs({
  profile,
  organization,
  preferences,
}: SettingsTabsProps) {
  return (
    <Tabs defaultValue="profile">
      <TabsList>
        <TabsTrigger value="profile">Profile</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
        <Can permission="org:manage">
          <TabsTrigger value="organization">Organization</TabsTrigger>
        </Can>
      </TabsList>

      <TabsContent value="profile" className="mt-4">
        <ProfilePanel profile={profile} />
      </TabsContent>

      <TabsContent value="notifications" className="mt-4">
        <NotificationsPanel preferences={preferences} />
      </TabsContent>

      <Can permission="org:manage">
        <TabsContent value="organization" className="mt-4">
          <OrganizationPanel organization={organization} />
        </TabsContent>
      </Can>
    </Tabs>
  )
}

// ---------------------------------------------------------------------------

function ProfilePanel({ profile }: { profile: Profile }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Profile</CardTitle>
        <CardDescription>Your account details.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="full_name">Full name</Label>
          <Input
            id="full_name"
            value={profile.full_name ?? ''}
            disabled
            readOnly
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={profile.email ?? ''} disabled readOnly />
        </div>

        <div className="space-y-1.5">
          <Label>Role</Label>
          <div>
            <Badge variant="secondary">
              {ROLE_LABELS[profile.role] ?? profile.role}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------

const PREF_FIELDS: {
  key: keyof Omit<NotificationPreferences, 'user_id'>
  label: string
  description: string
}[] = [
  {
    key: 'ca_assigned',
    label: 'Corrective action assigned',
    description: 'When a corrective action is assigned to you.',
  },
  {
    key: 'ca_status',
    label: 'Corrective action status',
    description: 'When a corrective action you raised is approved or rejected.',
  },
  {
    key: 'event_stage',
    label: 'Event stage changes',
    description: 'When an event you are involved in advances a stage.',
  },
]

function NotificationsPanel({
  preferences,
}: {
  preferences: NotificationPreferences
}) {
  const router = useRouter()
  const [prefs, setPrefs] = useState(preferences)
  const [pending, startTransition] = useTransition()

  const toggle = (key: keyof Omit<NotificationPreferences, 'user_id'>) =>
    setPrefs((p) => ({ ...p, [key]: !p[key] }))

  const save = () => {
    startTransition(async () => {
      const result = await updateNotificationPreferences({
        ca_assigned: prefs.ca_assigned,
        ca_status: prefs.ca_status,
        event_stage: prefs.event_stage,
      })
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Preferences saved')
        router.refresh()
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Notification preferences</CardTitle>
        <CardDescription>
          Choose which notifications you want to receive.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {PREF_FIELDS.map((field, i) => (
            <div key={field.key}>
              {i > 0 && <Separator className="mb-3" />}
              <label className="flex items-start gap-3">
                <Checkbox
                  checked={prefs[field.key]}
                  onCheckedChange={() => toggle(field.key)}
                  className="mt-0.5"
                />
                <span>
                  <span className="block text-sm font-medium">
                    {field.label}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {field.description}
                  </span>
                </span>
              </label>
            </div>
          ))}
        </div>

        <Button onClick={save} disabled={pending}>
          {pending && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
          Save preferences
        </Button>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------

function OrganizationPanel({
  organization,
}: {
  organization: Organization | null
}) {
  const router = useRouter()
  const [name, setName] = useState(organization?.name ?? '')
  const [email, setEmail] = useState(organization?.contact_email ?? '')
  const [pending, startTransition] = useTransition()

  if (!organization) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-sm text-muted-foreground">
          No organization is associated with your account.
        </CardContent>
      </Card>
    )
  }

  const save = () => {
    startTransition(async () => {
      const result = await updateOrganization({
        id: organization.id,
        name,
        contact_email: email,
      })
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Organization updated')
        router.refresh()
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Organization</CardTitle>
        <CardDescription>
          Manage your organization&apos;s details.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="org_name">Name</Label>
          <Input
            id="org_name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="org_email">Contact email</Label>
          <Input
            id="org_email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="contact@example.com"
          />
        </div>
        <Button onClick={save} disabled={pending || !name.trim()}>
          {pending && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
          Save changes
        </Button>
      </CardContent>
    </Card>
  )
}
