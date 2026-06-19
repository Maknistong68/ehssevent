import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, Layers, User } from 'lucide-react'
import type { InspectionTemplate } from '@/types/database'

interface TemplateCardProps {
  template: InspectionTemplate
}

export function TemplateCard({ template }: TemplateCardProps) {
  const creator = template.creator as { id: string; full_name?: string; email: string } | undefined
  const sectionCount = template.sections?.length || 0
  const itemCount = template.sections?.reduce((sum, s) => sum + (s.items?.length || 0), 0) || 0

  return (
    <Link href={`/inspections/templates/${template.id}`}>
      <Card
        size="sm"
        className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-soft-lg active:scale-[0.99]"
      >
        <CardContent className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="line-clamp-1 font-heading text-sm font-semibold tracking-tight">{template.name}</h3>
              {template.description && (
                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                  {template.description}
                </p>
              )}
            </div>
            <div className="shrink-0">
              {template.is_active ? (
                <Badge variant="secondary" className="bg-green-100 text-green-800">Active</Badge>
              ) : (
                <Badge variant="secondary" className="bg-slate-100 text-slate-600">Inactive</Badge>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Layers className="h-3 w-3" />
              {sectionCount} section{sectionCount !== 1 ? 's' : ''}
            </span>
            <span className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              {itemCount} item{itemCount !== 1 ? 's' : ''}
            </span>
            {creator && (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {creator.full_name || creator.email}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
