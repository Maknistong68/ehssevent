import Link from 'next/link'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { SortHeader } from '@/components/shared/sort-header'
import { InspectionStatusBadge } from './inspection-status-badge'
import { InspectionScoreBadge } from './inspection-score-badge'
import type { Inspection } from '@/types/database'

export function InspectionsTable({
  inspections,
}: {
  inspections: Inspection[]
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <SortHeader sortKey="reference">Reference</SortHeader>
          <TableHead>Template</TableHead>
          <SortHeader sortKey="status">Status</SortHeader>
          <SortHeader sortKey="score">Score</SortHeader>
          <TableHead>Project</TableHead>
          <SortHeader sortKey="conductor">Conductor</SortHeader>
          <TableHead>Items</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {inspections.map((inspection) => {
          const project = inspection.project as { name?: string } | undefined
          const conductor = inspection.conductor as
            | { full_name?: string; email?: string }
            | undefined
          const template = inspection.template as { name?: string } | undefined
          return (
            <TableRow key={inspection.id} className="relative cursor-pointer">
              <TableCell className="font-mono text-xs whitespace-nowrap">
                <Link
                  href={`/inspections/${inspection.id}`}
                  className="font-medium text-foreground after:absolute after:inset-0"
                >
                  {inspection.reference_number}
                </Link>
              </TableCell>
              <TableCell className="max-w-[18rem]">
                <span className="line-clamp-1">{template?.name || '—'}</span>
              </TableCell>
              <TableCell>
                <InspectionStatusBadge status={inspection.status} />
              </TableCell>
              <TableCell>
                <InspectionScoreBadge score={inspection.score} />
              </TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {project?.name || '—'}
              </TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {conductor?.full_name || conductor?.email || '—'}
              </TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {inspection.total_items}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
