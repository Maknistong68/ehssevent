'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import type { AuditLogEntry } from '@/lib/queries/audit'

interface AuditLogProps {
  entries: AuditLogEntry[]
}

const ACTION_COLORS: Record<string, string> = {
  'organization.create': 'bg-green-100 text-green-800',
  'profile.update': 'bg-blue-100 text-blue-800',
  'impersonation.start': 'bg-amber-100 text-amber-800',
  'impersonation.stop': 'bg-slate-100 text-slate-700',
}

export function AuditLog({ entries }: AuditLogProps) {
  if (entries.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No audit log entries yet.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {entries.map((entry, i) => (
        <Card
          key={entry.id}
          size="sm"
          className="animate-fade-up"
          style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
        >
          <CardContent className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="secondary"
                  className={ACTION_COLORS[entry.action] || 'bg-slate-100 text-slate-700'}
                >
                  {entry.action}
                </Badge>
                {entry.target_label && (
                  <span className="truncate text-sm font-medium">
                    {entry.target_label}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                <span>{entry.actor_email || 'System'}</span>
                {entry.target_table && (
                  <span className="font-mono">{entry.target_table}</span>
                )}
                {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                  <span className="font-mono truncate max-w-[200px]">
                    {JSON.stringify(entry.metadata)}
                  </span>
                )}
              </div>
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">
              {format(new Date(entry.created_at), 'dd MMM yyyy, h:mm a')}
            </span>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
