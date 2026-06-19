import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'
import { CaCard } from '@/components/corrective-actions/ca-card'
import {
  INSPECTION_FIELD_TYPE_LABELS,
  COMPLIANCE_LABELS,
  COMPLIANCE_COLORS,
} from '@/types/enums'
import type { InspectionFieldType, ComplianceValue } from '@/types/enums'
import type {
  Inspection,
  InspectionResponse,
  TemplateSection,
  CorrectiveAction,
} from '@/types/database'
import Image from 'next/image'
import { toSecurePhotoUrl } from '@/lib/utils/photo-url'

interface InspectionDetailProps {
  inspection: Inspection
  responses: InspectionResponse[]
  correctiveActions?: CorrectiveAction[]
  canRaiseCa?: boolean
}

const FAILING_COMPLIANCE: ComplianceValue[] = ['non_compliant', 'partially_compliant']

function getValueDisplay(response: InspectionResponse | undefined, fieldType: InspectionFieldType) {
  if (!response) return <span className="text-muted-foreground text-sm">No response</span>

  if (fieldType === 'photo') {
    if (!response.photo_urls || response.photo_urls.length === 0) {
      return <span className="text-muted-foreground text-sm">No photos</span>
    }
    return (
      <div className="flex flex-wrap gap-2">
        {response.photo_urls.map((url, i) => (
          <div key={i} className="relative h-20 w-20 rounded-md overflow-hidden border">
            <Image src={toSecurePhotoUrl(url)} alt={`Photo ${i + 1}`} fill className="object-cover" />
          </div>
        ))}
      </div>
    )
  }

  if (!response.value) {
    return <span className="text-muted-foreground text-sm">-</span>
  }

  if (fieldType === 'yes_no') {
    return (
      <Badge
        variant="secondary"
        className={response.value === 'yes' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
      >
        {response.value === 'yes' ? 'Yes' : 'No'}
      </Badge>
    )
  }

  if (fieldType === 'pass_fail') {
    return (
      <Badge
        variant="secondary"
        className={response.value === 'pass' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
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
                <p className="text-sm text-muted-foreground">Compliance Score</p>
                <p className="text-3xl font-bold">{inspection.score?.toFixed(1)}%</p>
              </div>
              <div className="text-right text-sm text-muted-foreground">
                <p>{inspection.compliant_items} / {inspection.scorable_items} compliant</p>
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
            <CardTitle className="text-base">{section.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {section.items.map((item) => {
              const response = responses.find(
                (r) => r.section_id === section.id && r.item_id === item.id
              )
              const isFailing =
                item.field_type === 'compliance' &&
                FAILING_COMPLIANCE.includes(response?.value as ComplianceValue)
              const caHref =
                `/corrective-actions/new?inspection_id=${inspection.id}` +
                `&section_id=${encodeURIComponent(section.id)}` +
                `&item_id=${encodeURIComponent(item.id)}` +
                `&item_label=${encodeURIComponent(item.label)}`
              return (
                <div
                  key={item.id}
                  className="flex flex-col gap-2 py-2 border-b last:border-0"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-medium">{item.label}</span>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {INSPECTION_FIELD_TYPE_LABELS[item.field_type as InspectionFieldType]}
                      </Badge>
                    </div>
                    <div className="shrink-0">
                      {getValueDisplay(response, item.field_type as InspectionFieldType)}
                    </div>
                  </div>
                  {isFailing && canRaiseCa && (
                    <div>
                      <Link href={caHref}>
                        <Button variant="outline" size="sm" className="h-7 text-xs">
                          <AlertTriangle className="mr-1 h-3 w-3" />
                          Raise Corrective Action
                        </Button>
                      </Link>
                    </div>
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
