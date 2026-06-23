import { redirect } from 'next/navigation'
import { requirePermission } from '@/lib/auth/guards'
import { TemplateBuilder } from '@/components/inspections/template-builder'

export const metadata = {
  title: 'New Template - Event Report',
}

export default async function NewTemplatePage() {
  const auth = await requirePermission('inspection:templates')
  if (!auth.ok) redirect('/dashboard')

  return (
    <div className="mx-auto max-w-2xl p-4 md:p-6">
      <h1 className="mb-6 font-heading text-2xl font-bold tracking-tight md:text-3xl">
        New Inspection Template
      </h1>
      <TemplateBuilder />
    </div>
  )
}
