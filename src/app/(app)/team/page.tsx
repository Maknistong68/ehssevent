export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { requirePermission } from '@/lib/auth/guards'
import { getOrgMembers } from '@/lib/queries/team'
import { TeamMembers } from './team-members'

export const metadata = {
  title: 'Team - Event Report',
}

export default async function TeamPage() {
  const auth = await requirePermission('user:manage')
  if (!auth.ok) redirect('/dashboard')

  if (!auth.profile.organization_id) {
    redirect('/dashboard')
  }

  const members = await getOrgMembers(auth.profile.organization_id)

  return (
    <div className="space-y-5 p-4 md:p-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight md:text-3xl">Team</h1>
        <p className="text-sm text-muted-foreground">
          Manage members in your organization ({members.length} member{members.length !== 1 ? 's' : ''})
        </p>
      </div>

      <TeamMembers members={members} currentUserId={auth.profile.id} />
    </div>
  )
}
