import Link from 'next/link'
import { format } from 'date-fns'
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
import { CaPriorityBadge } from './ca-priority-badge'
import type { CorrectiveAction } from '@/types/database'

export function CaTable({ correctiveActions }: { correctiveActions: CorrectiveAction[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <SortHeader sortKey="reference">Reference</SortHeader>
          <TableHead>Title</TableHead>
          <SortHeader sortKey="priority">Priority</SortHeader>
          <SortHeader sortKey="status">Status</SortHeader>
          <TableHead>Source</TableHead>
          <TableHead>Assignee</TableHead>
          <SortHeader sortKey="due">Due date</SortHeader>
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
                <CaPriorityBadge priority={ca.priority} />
              </TableCell>
              <TableCell>
                <CaStatusBadge status={ca.status} />
              </TableCell>
              <TableCell className="font-mono text-xs whitespace-nowrap text-muted-foreground">
                {source}
              </TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {ca.assignee?.full_name || ca.assignee?.email || '—'}
              </TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {ca.due_date ? format(new Date(ca.due_date), 'dd MMM yyyy') : '—'}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
