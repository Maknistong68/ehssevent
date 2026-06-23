import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, ExternalLink } from 'lucide-react'
import { CaCard } from '@/components/corrective-actions/ca-card'
import {
  INSPECTION_FIELD_TYPE_LABELS,
  COMPLIANCE_LABELS,
  COMPLIANCE_COLORS,
  CA_STATUS_LABELS,
  CA_STATUS_COLORS,
} from '@/types/enums'
import type { InspectionFieldType, ComplianceValue } from '@/types/enums'
import type {
  Inspection,
  InspectionResponse,
  TemplateSection,
  CorrectiveAction,
} from '@/types/database'
import { PhotoGrid } from '@/components/shared/photo-lightbox'

interface InspectionDetailProps {
  inspection: Inspection
  responses: InspectionResponse[]
  correctiveActions?: CorrectiveAction[]
  canRaiseCa?: boolean
}

const FAILING_COMPLIANCE: ComplianceValue[] = [
  'non_compliant',
  'partially_compliant',
]

function getValueDisplay(
  response: InspectionResponse | undefined,
  fieldType: InspectionFieldType
) {
  if (!response)
    return <span className="text-muted-foreground text-sm">No response</span>

  if (fieldType === 'photo') {
    if (!response.photo_urls || response.photo_urls.length === 0) {
      return <span className="text-muted-foreground text-sm">No photos</span>
    }
    return <PhotoGrid photos={response.photo_urls} thumbClassName="h-20 w-20" />
  }

  if (!response.value) {
    return <span className="text-muted-foreground text-sm">-</span>
  }

  if (fieldType === 'yes_no') {
    return (
      <Badge
        variant="secondary"
        className={
          response.value === 'yes'
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }
      >
        {response.value === 'yes' ? 'Yes' : 'No'}
      </Badge>
    )
  }

  if (fieldType === 'pass_fail') {
    return (
      <Badge
        variant="secondary"
        className={
          response.value === 'pass'
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }
      >
        {response.value === 'pass' ? 'Pass' : 'Fail'}
      </Badge>
    )
  }

  if (fieldType === 'compliance') {
    const value = response.value as ComplianceValue
    return (
      <Badge variant="secondary" className={COMPLIANCE_COLORS[value] ?? ''}>
        {COMPLIANCE_LABELS[value] ?? response.value}
      </Badge>
    )
  }

  return <span className="text-sm">{response.value}</span>
}

export function InspectionDetail({
  inspection,
  responses,
  correctiveActions = [],
  canRaiseCa = false,
}: InspectionDetailProps) {
  const template = inspection.template
  const sections = (template?.sections || []) as TemplateSection[]

  return (
    <div className="space-y-4">
      {inspection.score !== null && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Compliance Score
                </p>
                <p className="text-3xl font-bold">
                  {inspection.score?.toFixed(1)}%
                </p>
              </div>
              <div className="text-right text-sm text-muted-foreground">
                <p>
                  {inspection.compliant_items} / {inspection.scorable_items}{' '}
                  compliant
                </p>
                <p>{inspection.total_items} total items</p>
              </div>
            </div>
            <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  (inspection.score ?? 0) >= 80
                    ? 'bg-green-500'
                    : (inspection.score ?? 0) >= 60
                      ? 'bg-amber-500'
                      : 'bg-red-500'
                }`}
                style={{ width: `${inspection.score ?? 0}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {sections.map((section) => (
        <Card key={section.id}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base">{section.title}</CardTitle>
              <Badge variant="secondary" className="shrink-0 text-[11px]">
                {section.items.length}{' '}
                {section.items.length === 1 ? 'item' : 'items'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {section.items.map((item) => {
              const response = responses.find(
                (r) => r.section_id === section.id && r.item_id === item.id
              )
              const isFailing =
                item.field_type === 'compliance' &&
                FAILING_COMPLIANCE.includes(response?.value as ComplianceValue)
              const linkedCa = correctiveActions.find(
                (ca) => ca.section_id === section.id && ca.item_id === item.id
              )
              const caHref =
                `/corrective-actions/new?inspection_id=${inspection.id}` +
                `&section_id=${encodeURIComponent(section.id)}` +
                `&item_id=${encodeURIComponent(item.id)}` +
                `&item_label=${encodeURIComponent(item.label)}`
              const hasExtra =
                response?.comment ||
                response?.observation ||
                response?.action_plan
              return (
                <div
                  key={item.id}
                  className={`flex flex-col gap-3 rounded-xl border p-3 transition-colors ${
                    isFailing
                      ? 'border-red-200 bg-red-50/60 dark:border-red-900/50 dark:bg-red-950/20'
                      : 'border-border/60 bg-card'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <p className="text-sm font-medium leading-snug break-words">
                        {item.label}
                      </p>
                      <Badge
                        variant="outline"
                        className="text-[10px] font-normal text-muted-foreground"
                      >
                        {
                          INSPECTION_FIELD_TYPE_LABELS[
                            item.field_type as InspectionFieldType
                          ]
                        }
                      </Badge>
                    </div>
                    <div className="flex shrink-0 justify-end text-right">
                      {getValueDisplay(
                        response,
                        item.field_type as InspectionFieldType
                      )}
                    </div>
                  </div>
                  {hasExtra && (
                    <div className="grid grid-cols-1 gap-3 border-t border-border/60 pt-3 sm:grid-cols-3">
                      {response?.comment && (
                        <div className="space-y-0.5">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Comment
                          </p>
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {response.comment}
                          </p>
                        </div>
                      )}
                      {response?.observation && (
                        <div className="space-y-0.5">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Observation
                          </p>
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {response.observation}
                          </p>
                        </div>
                      )}
                      {response?.action_plan && (
                        <div className="space-y-0.5">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Action Plan
                          </p>
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {response.action_plan}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  {isFailing && linkedCa && (
                    <Link
                      href={`/corrective-actions/${linkedCa.id}`}
                      className="inline-flex w-fit"
                    >
                      <Badge
                        variant="secondary"
                        className={`${CA_STATUS_COLORS[linkedCa.status]} cursor-pointer inline-flex items-center gap-1`}
                      >
                        {linkedCa.reference_number} &middot;{' '}
                        {CA_STATUS_LABELS[linkedCa.status]}
                        <ExternalLink className="h-3 w-3" />
                      </Badge>
                    </Link>
                  )}
                  {isFailing && !linkedCa && canRaiseCa && (
                    <Link href={caHref} className="inline-flex w-fit">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                      >
                        <AlertTriangle className="mr-1 h-3 w-3" />
                        Raise Corrective Action
                      </Button>
                    </Link>
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>
      ))}

      {inspection.notes && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{inspection.notes}</p>
          </CardContent>
        </Card>
      )}

      {correctiveActions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Corrective Actions ({correctiveActions.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {correctiveActions.map((ca) => (
              <CaCard key={ca.id} correctiveAction={ca} />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
