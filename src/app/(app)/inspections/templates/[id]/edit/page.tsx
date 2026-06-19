export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { getTemplateById } from '@/lib/queries/inspections'
import { TemplateBuilder } from '@/components/inspections/template-builder'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const template = await getTemplateById(id)
  return {
    title: template
      ? `Edit ${template.name} - Event Report`
      : 'Edit Template - Event Report',
  }
}

export default async function EditTemplatePage({ params }: Props) {
  const { id } = await params
  const template = await getTemplateById(id)

  if (!template) notFound()

  return (
    <div className="mx-auto max-w-2xl p-4 md:p-6">
      <h1 className="mb-6 font-heading text-2xl font-bold tracking-tight md:text-3xl">Edit Template</h1>
      <TemplateBuilder template={template} />
    </div>
  )
}
