export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { requirePermission } from '@/lib/auth/guards'
import { NewProjectForm } from './form'

export const metadata = {
  title: 'New Project - Event Report',
}

export default async function NewProjectPage() {
  const auth = await requirePermission('project:manage')
  if (!auth.ok) redirect('/dashboard')

  return (
    <div className="mx-auto max-w-2xl p-4 md:p-6">
      <h1 className="mb-6 font-heading text-2xl font-bold tracking-tight md:text-3xl">New Project</h1>
      <NewProjectForm />
    </div>
  )
}
