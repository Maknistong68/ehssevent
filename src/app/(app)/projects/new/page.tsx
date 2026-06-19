export const dynamic = 'force-dynamic'

import { NewProjectForm } from './form'

export const metadata = {
  title: 'New Project - Event Report',
}

export default function NewProjectPage() {
  return (
    <div className="mx-auto max-w-2xl p-4 md:p-6">
      <h1 className="mb-6 font-heading text-2xl font-bold tracking-tight md:text-3xl">New Project</h1>
      <NewProjectForm />
    </div>
  )
}
