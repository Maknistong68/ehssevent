export const dynamic = 'force-dynamic'

import { notFound, redirect } from 'next/navigation'
import { getSessionProfile } from '@/lib/auth/guards'
import { getCorrectiveActionById } from '@/lib/queries/corrective-actions'
import { getAssignableUsers } from '@/lib/queries/users'
import { getRecordAuditLog } from '@/lib/queries/audit'
import { CaDetail } from '@/components/corrective-actions/ca-detail'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const ca = await getCorrectiveActionById(id)
  return {
    title: ca
      ? `${ca.reference_number} - Event Report`
      : 'Corrective Action - Event Report',
  }
}

export default async function CorrectiveActionDetailPage({ params }: Props) {
  const { id } = await params
  const profile = await getSessionProfile()
  if (!profile) redirect('/login')

  const [ca, users, auditLog] = await Promise.all([
    getCorrectiveActionById(id),
    getAssignableUsers(),
    getRecordAuditLog('corrective_actions', id),
  ])

  if (!ca) notFound()

  const isAdmin =
    profile.role === 'system_admin' || profile.role === 'support'

  return (
    <CaDetail
      correctiveAction={ca}
      currentUserId={profile.id}
      isAdmin={isAdmin}
      users={users}
      auditLog={auditLog}
    />
  )
}
