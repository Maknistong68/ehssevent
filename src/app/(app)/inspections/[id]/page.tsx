export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getInspectionById, getInspectionResponses } from '@/lib/queries/inspections'
import { getInspectionCorrectiveActions } from '@/lib/queries/corrective-actions'
import { InspectionStatusBadge } from '@/components/inspections/inspection-status-badge'
import { InspectionScoreBadge } from '@/components/inspections/inspection-score-badge'
import { InspectionDetail } from '@/components/inspections/inspection-detail'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, MapPin, User, CalendarDays, FileText } from 'lucide-react'
import { format } from 'date-fns'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const inspection = await getInspectionById(id)
  return {
    title: inspection
      ? `${inspection.reference_number} - Event Report`
      : 'Inspection - Event Report',
  }
}

export default async function InspectionDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const [{ data: { user } }, inspection, responses, correctiveActions] =
    await Promise.all([
      supabase.auth.getUser(),
      getInspectionById(id),
      getInspectionResponses(id),
      getInspectionCorrectiveActions(id),
    ])

  if (!inspection) notFound()

  const canRaiseCa = !!user && user.id === inspection.conducted_by

  const project = inspection.project as
    | { id: string; name: string; location?: string }
    | undefined
  const conductor = inspection.conductor as
    | { id: string; full_name?: string; email: string }
    | undefined
  const template = inspection.template as
    | { id: string; name: string }
    | undefined

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <Link
          href="/inspections"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-card text-muted-foreground shadow-soft transition-colors hover:text-foreground"
          aria-label="Back to inspections"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-xs text-muted-foreground">
            {inspection.reference_number}
          </p>
          <h1 className="font-heading text-xl font-bold tracking-tight">
            {template?.name || 'Inspection'}
          </h1>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <InspectionStatusBadge status={inspection.status} />
        <InspectionScoreBadge score={inspection.score} />
      </div>

      <Card size="sm">
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            {project && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Project</p>
                  <p className="text-muted-foreground">{project.name}</p>
                  {project.location && (
                    <p className="text-xs text-muted-foreground">{project.location}</p>
                  )}
                </div>
              </div>
            )}

            {conductor && (
              <div className="flex items-start gap-2">
                <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Conducted By</p>
                  <p className="text-muted-foreground">
                    {conductor.full_name || conductor.email}
                  </p>
                </div>
              </div>
            )}

            {template && (
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Template</p>
                  <p className="text-muted-foreground">{template.name}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">
                  {inspection.completed_at ? 'Completed' : 'Created'}
                </p>
                <p className="text-muted-foreground">
                  {format(
                    new Date(inspection.completed_at || inspection.created_at),
                    'dd MMM yyyy HH:mm'
                  )}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <InspectionDetail
        inspection={inspection}
        responses={responses}
        correctiveActions={correctiveActions}
        canRaiseCa={canRaiseCa}
      />
    </div>
  )
}
