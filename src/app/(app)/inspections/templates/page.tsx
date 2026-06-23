export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { requirePermission } from '@/lib/auth/guards'
import { getAllTemplates } from '@/lib/queries/inspections'
import { TemplateCard } from '@/components/inspections/template-card'
import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui/button'
import { Plus, FileText, ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Inspection Templates - Event Report',
}

export default async function TemplatesPage() {
  const auth = await requirePermission('inspection:templates')
  if (!auth.ok) redirect('/dashboard')

  const templates = await getAllTemplates()

  return (
    <div className="space-y-5 p-4 md:p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/inspections"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-card text-muted-foreground shadow-soft transition-colors hover:text-foreground"
            aria-label="Back to inspections"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0">
            <h1 className="font-heading text-2xl font-bold tracking-tight md:text-3xl">
              Templates
            </h1>
            <p className="text-sm text-muted-foreground">
              {templates.length} template{templates.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <Link href="/inspections/templates/new">
          <Button data-icon="inline-start">
            <Plus className="h-4 w-4" />
            New
          </Button>
        </Link>
      </div>

      {templates.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No templates yet"
          description="Create your first inspection template to get started."
          action={
            <Link href="/inspections/templates/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Template
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {templates.map((template, i) => (
            <div
              key={template.id}
              className="animate-fade-up"
              style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}
            >
              <TemplateCard template={template} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
