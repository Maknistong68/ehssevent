export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { getEffectiveProfile } from '@/lib/auth/impersonation'
import {
  getNotificationPreferences,
  defaultNotificationPreferences,
} from '@/lib/queries/settings'
import { SettingsTabs } from '@/components/settings/settings-tabs'

export const metadata = {
  title: 'Settings - Event Report',
}

export default async function SettingsPage() {
  const { profile } = await getEffectiveProfile()
  if (!profile) redirect('/login')

  const preferences =
    (await getNotificationPreferences()) ??
    defaultNotificationPreferences(profile.id)

  return (
    <div className="max-w-2xl space-y-5 p-4 md:p-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight md:text-3xl">
          Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your profile and notification preferences.
        </p>
      </div>

      <SettingsTabs
        profile={profile}
        organization={profile.organization ?? null}
        preferences={preferences}
      />
    </div>
  )
}
