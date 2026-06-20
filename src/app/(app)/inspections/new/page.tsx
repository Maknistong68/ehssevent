export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { getTemplates } from '@/lib/queries/inspections'
import { getProjects } from '@/lib/queries/projects'
import { getAssignableUsers } from '@/lib/queries/users'
import { InspectionForm } from '@/components/inspections/inspection-form'
import { EmptyState } from '@/components/shared/empty-state'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ClipboardCheck } from 'lucide-react'
import { MOCK_CURRENT_USER, MOCK_ORGANIZATIONS } from '@/lib/mock-data'

export const metadata = {
  title: 'New Inspection - Event Report',
}

interface Props {
  searchParams: Promise<{ template_id?: string }>
}

export default async function NewInspectionPage({ searchParams }: Props) {
  const params = await searchParams
  const [templates, projects, assignableUsers] = await Promise.all([
    getTemplates(),
    getProjects(),
    getAssignableUsers(),
  ])

  const organizationName = MOCK_ORGANIZATIONS[0]?.name || 'Unknown Organization'
  const conductedByName = MOCK_CURRENT_USER.full_name || MOCK_CURRENT_USER.email

  // If template_id is in search params, use that template
  const selectedTemplate = params.template_id
    ? templates.find((t) => t.id === params.template_id)
    : null

  if (templates.length === 0) {
    return (
      <div className="mx-auto max-w-2xl p-4 md:p-6">
        <h1 className="mb-6 font-heading text-2xl font-bold tracking-tight md:text-3xl">New Inspection</h1>
        <EmptyState
          icon={ClipboardCheck}
          title="No templates available"
          description="An inspection template must be created before you can conduct an inspection."
        />
      </div>
    )
  }

  if (selectedTemplate) {
    return (
      <div className="mx-auto max-w-3xl p-4 md:p-6">
        <h1 className="mb-6 font-heading text-2xl font-bold tracking-tight md:text-3xl">New Inspection</h1>
        <InspectionForm
          template={selectedTemplate}
          projects={projects}
          organizationName={organizationName}
          conductedByName={conductedByName}
          assignableUsers={assignableUsers}
        />
      </div>
    )
  }

  // Show template selection
  return (
    <div className="mx-auto max-w-2xl p-4 md:p-6">
      <h1 className="mb-6 font-heading text-2xl font-bold tracking-tight md:text-3xl">Select a Template</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        Choose an inspection template to begin.
      </p>
      <div className="space-y-3">
        {templates.map((template, i) => {
          const sectionCount = template.sections?.length || 0
          const itemCount = template.sections?.reduce((sum, s) => sum + (s.items?.length || 0), 0) || 0
          return (
            <Link
              key={template.id}
              href={`/inspections/new?template_id=${template.id}`}
              className="animate-fade-up block"
              style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}
            >
              <Card
                size="sm"
                className="cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-soft-lg active:scale-[0.99]"
              >
                <CardContent>
                  <h3 className="font-heading font-semibold tracking-tight">{template.name}</h3>
                  {template.description && (
                    <p className="mt-1 text-sm text-muted-foreground">{template.description}</p>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">
                    {sectionCount} section{sectionCount !== 1 ? 's' : ''} &middot;{' '}
                    {itemCount} item{itemCount !== 1 ? 's' : ''}
                  </p>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
