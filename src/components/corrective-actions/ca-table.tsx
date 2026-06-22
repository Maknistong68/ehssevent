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
import { CaStatusBadge } from './ca-status-badge'
import { OverdueBadge } from './overdue-badge'
import { isCorrectiveActionOverdue } from '@/lib/utils/corrective-actions'
import type { CorrectiveAction } from '@/types/database'

export function CaTable({ correctiveActions }: { correctiveActions: CorrectiveAction[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <SortHeader sortKey="reference">Reference</SortHeader>
          <TableHead>Title</TableHead>
          <SortHeader sortKey="status">Status</SortHeader>
          <TableHead>Source</TableHead>
          <TableHead>Assignee</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {correctiveActions.map((ca) => {
          const source =
            ca.event?.reference_number || ca.inspection?.reference_number || '—'
          return (
            <TableRow key={ca.id} className="relative cursor-pointer">
              <TableCell className="font-mono text-xs whitespace-nowrap">
                <Link
                  href={`/corrective-actions/${ca.id}`}
                  className="font-medium text-foreground after:absolute after:inset-0"
                >
                  {ca.reference_number}
                </Link>
              </TableCell>
              <TableCell className="max-w-[20rem]">
                <span className="line-clamp-1">{ca.title}</span>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap items-center gap-1.5">
                  <CaStatusBadge status={ca.status} />
                  {isCorrectiveActionOverdue(ca) && <OverdueBadge />}
                </div>
              </TableCell>
              <TableCell className="font-mono text-xs whitespace-nowrap text-muted-foreground">
                {source}
              </TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {ca.assignee?.full_name || ca.assignee?.email || '—'}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
