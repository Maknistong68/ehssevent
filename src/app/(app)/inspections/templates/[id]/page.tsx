export const dynamic = 'force-dynamic'

import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { requirePermission } from '@/lib/auth/guards'
import { getTemplateById } from '@/lib/queries/inspections'
import { TemplatePreview } from '@/components/inspections/template-preview'
import { ToggleTemplateButton } from './toggle-button'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Pencil, User, CalendarDays } from 'lucide-react'
import { format } from 'date-fns'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const template = await getTemplateById(id)
  return {
    title: template
      ? `${template.name} - Event Report`
      : 'Template - Event Report',
  }
}

export default async function TemplateDetailPage({ params }: Props) {
  const auth = await requirePermission('inspection:templates')
  if (!auth.ok) redirect('/dashboard')

  const { id } = await params
  const template = await getTemplateById(id)

  if (!template) notFound()

  const creator = template.creator as
    | { id: string; full_name?: string; email: string }
    | undefined

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <Link
          href="/inspections/templates"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-card text-muted-foreground shadow-soft transition-colors hover:text-foreground"
          aria-label="Back to templates"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="font-heading text-xl font-bold tracking-tight">{template.name}</h1>
          {template.description && (
            <p className="mt-0.5 text-sm text-muted-foreground">
              {template.description}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {template.is_active ? (
          <Badge variant="secondary" className="bg-green-100 text-green-800">Active</Badge>
        ) : (
          <Badge variant="secondary" className="bg-slate-100 text-slate-600">Inactive</Badge>
        )}

        <div className="flex-1" />

        <ToggleTemplateButton
          templateId={template.id}
          isActive={template.is_active}
        />

        <Link href={`/inspections/templates/${template.id}/edit`}>
          <Button variant="outline" size="sm" data-icon="inline-start">
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
        </Link>

        <Link href={`/inspections/new?template_id=${template.id}`}>
          <Button size="sm">
            Use Template
          </Button>
        </Link>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {creator && (
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" />
            Created by {creator.full_name || creator.email}
          </span>
        )}
        <span className="flex items-center gap-1">
          <CalendarDays className="h-3 w-3" />
          {format(new Date(template.created_at), 'dd MMM yyyy')}
        </span>
      </div>

      <TemplatePreview sections={template.sections} />
    </div>
  )
}
