import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { InspectionStatusBadge } from './inspection-status-badge'
import { InspectionScoreBadge } from './inspection-score-badge'
import { MapPin, User, FileText } from 'lucide-react'
import type { Inspection } from '@/types/database'

interface InspectionCardProps {
  inspection: Inspection
}

export function InspectionCard({ inspection }: InspectionCardProps) {
  const project = inspection.project as { id: string; name: string; location?: string } | undefined
  const conductor = inspection.conductor as { id: string; full_name?: string; email: string } | undefined
  const template = inspection.template as { id: string; name: string } | undefined

  return (
    <Link href={`/inspections/${inspection.id}`}>
      <Card
        size="sm"
        className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-soft-lg active:scale-[0.99]"
      >
        <CardContent className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="font-mono text-xs text-muted-foreground">
                {inspection.reference_number}
              </p>
              {template && (
                <h3 className="mt-0.5 line-clamp-1 font-heading text-sm font-semibold tracking-tight">
                  {template.name}
                </h3>
              )}
            </div>
            <div className="flex flex-col gap-1 items-end shrink-0">
              <InspectionStatusBadge status={inspection.status} />
              <InspectionScoreBadge score={inspection.score} />
            </div>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {project?.name && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {project.name}
              </span>
            )}
            {conductor && (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {conductor.full_name || conductor.email}
              </span>
            )}
            <span className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              {inspection.total_items} items
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
