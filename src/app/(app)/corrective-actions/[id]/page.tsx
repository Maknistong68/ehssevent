export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCorrectiveActionById } from '@/lib/queries/corrective-actions'
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
  const supabase = await createClient()

  const [
    {
      data: { user },
    },
    ca,
  ] = await Promise.all([supabase.auth.getUser(), getCorrectiveActionById(id)])

  if (!ca) notFound()

  let isAdmin = false
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    isAdmin = profile?.role === 'system_admin' || profile?.role === 'support'
  }

  return (
    <CaDetail
      correctiveAction={ca}
      currentUserId={user?.id ?? ''}
      isAdmin={isAdmin}
    />
  )
}
