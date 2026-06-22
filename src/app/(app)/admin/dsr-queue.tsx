'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { AlertCircle, Loader2 } from 'lucide-react'
import { updateDsrStatus, fulfilDsr } from '@/lib/actions/dsr'
import type { DsrRequest } from '@/types/database'

interface DsrQueueProps {
  requests: DsrRequest[]
}

const STATUS_COLORS: Record<DsrRequest['status'], string> = {
  received: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-amber-100 text-amber-800',
  completed: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
}

const TYPE_LABELS: Record<DsrRequest['type'], string> = {
  access: 'Access',
  copy: 'Copy',
  correction: 'Correction',
  destruction: 'Destruction',
}

export function DsrQueue({ requests }: DsrQueueProps) {
  const router = useRouter()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState('')
  // Capture "now" once at mount so the render stays pure across re-renders.
  const [now] = useState(() => Date.now())

  const run = async (
    id: string,
    fn: () => Promise<{ success?: boolean; error?: string }>
  ) => {
    setError('')
    setBusyId(id)
    const result = await fn()
    setBusyId(null)
    if (result?.error) {
      setError(result.error)
      return
    }
    router.refresh()
  }

  if (requests.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No data subject requests have been submitted.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="flex items-center gap-2 rounded-2xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {requests.map((req) => {
        const busy = busyId === req.id
        const isOpen = req.status === 'received' || req.status === 'in_progress'
        const overdue = isOpen && new Date(req.due_at).getTime() < now
        return (
          <Card key={req.id} size="sm">
            <CardContent className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{TYPE_LABELS[req.type]}</Badge>
                  <Badge variant="secondary" className={STATUS_COLORS[req.status]}>
                    {req.status.replace('_', ' ')}
                  </Badge>
                  {overdue && (
                    <Badge variant="secondary" className="bg-red-100 text-red-800">
                      Overdue
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  Due {format(new Date(req.due_at), 'dd MMM yyyy')}
                </span>
              </div>

              <div className="space-y-1 text-sm">
                <p className="font-medium">{req.requester_email}</p>
                {req.note && (
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {req.note}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Submitted {format(new Date(req.created_at), 'dd MMM yyyy, h:mm a')}
                  {req.resolved_at &&
                    ` · Resolved ${format(
                      new Date(req.resolved_at),
                      'dd MMM yyyy, h:mm a'
                    )}`}
                </p>
              </div>

              {isOpen && (
                <div className="flex flex-wrap gap-2">
                  {req.status === 'received' && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busy}
                      onClick={() =>
                        run(req.id, () =>
                          updateDsrStatus(req.id, 'in_progress')
                        )
                      }
                    >
                      {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Start
                    </Button>
                  )}
                  <Button
                    size="sm"
                    disabled={busy}
                    onClick={() => run(req.id, () => fulfilDsr(req.id))}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {req.type === 'destruction' ? 'Fulfil & Erase' : 'Mark Fulfilled'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    onClick={() =>
                      run(req.id, () => updateDsrStatus(req.id, 'rejected'))
                    }
                  >
                    Reject
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
