import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { INSPECTION_FIELD_TYPE_LABELS } from '@/types/enums'
import type { InspectionFieldType } from '@/types/enums'
import type { TemplateSection } from '@/types/database'

interface TemplatePreviewProps {
  sections: TemplateSection[]
}

export function TemplatePreview({ sections }: TemplatePreviewProps) {
  return (
    <div className="space-y-4">
      {sections.map((section) => (
        <Card key={section.id}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{section.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {section.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-sm">{item.label}</span>
                  {item.required && (
                    <span className="text-xs text-red-500">*</span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className="text-xs">
                    {
                      INSPECTION_FIELD_TYPE_LABELS[
                        item.field_type as InspectionFieldType
                      ]
                    }
                  </Badge>
                  {item.field_type === 'dropdown' && item.options && (
                    <span className="text-xs text-muted-foreground">
                      {item.options.length} options
                    </span>
                  )}
                  {item.field_type === 'compliance' && (
                    <span className="text-xs text-muted-foreground">
                      scored · 4 levels
                    </span>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
