import Link from 'next/link'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { CaStatusStepper } from '@/components/corrective-actions/ca-status-stepper'
import type { CorrectiveAction } from '@/types/database'

export function MyCaTable({ correctiveActions }: { correctiveActions: CorrectiveAction[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Reference</TableHead>
          <TableHead>Title</TableHead>
          <TableHead>Source</TableHead>
          <TableHead>Progress</TableHead>
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
              <TableCell className="font-mono text-xs whitespace-nowrap text-muted-foreground">
                {source}
              </TableCell>
              <TableCell>
                <CaStatusStepper status={ca.status} />
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
