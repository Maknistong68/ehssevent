export const dynamic = 'force-dynamic'

import { CreateCaForm } from '@/components/corrective-actions/create-ca-form'
import { getProjects } from '@/lib/queries/projects'
import { getAllProfiles } from '@/lib/queries/admin'

export const metadata = {
  title: 'New Corrective Action - Event Report',
}

interface Props {
  searchParams: Promise<{
    event_id?: string
    inspection_id?: string
    section_id?: string
    item_id?: string
    item_label?: string
  }>
}

export default async function NewCorrectiveActionPage({ searchParams }: Props) {
  const { event_id, inspection_id, section_id, item_id, item_label } =
    await searchParams
  const [projects, users] = await Promise.all([getProjects(), getAllProfiles()])

  return (
    <div className="mx-auto max-w-2xl p-4 md:p-6">
      <h1 className="mb-6 font-heading text-2xl font-bold tracking-tight">
        New Corrective Action
      </h1>
      <CreateCaForm
        projects={projects}
        users={users}
        eventId={event_id}
        inspectionId={inspection_id}
        sectionId={section_id}
        itemId={item_id}
        itemLabel={item_label}
      />
    </div>
  )
}
