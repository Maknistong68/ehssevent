'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
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

const ALL_TABLES = '__all__'

export function AuditLog({ entries }: AuditLogProps) {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [actor, setActor] = useState('')
  const [table, setTable] = useState<string>(ALL_TABLES)

  const tables = useMemo(() => {
    const set = new Set<string>()
    for (const e of entries) if (e.target_table) set.add(e.target_table)
    return [...set].sort()
  }, [entries])

  const filtered = useMemo(() => {
    const fromTs = from ? new Date(from).getTime() : null
    const toTs = to ? new Date(to).getTime() + 24 * 60 * 60 * 1000 - 1 : null
    const needle = actor.trim().toLowerCase()
    return entries.filter((e) => {
      const ts = new Date(e.created_at).getTime()
      if (fromTs !== null && ts < fromTs) return false
      if (toTs !== null && ts > toTs) return false
      if (needle && !(e.actor_email ?? '').toLowerCase().includes(needle))
        return false
      if (table !== ALL_TABLES && e.target_table !== table) return false
      return true
    })
  }, [entries, from, to, actor, table])

  const hasFilters =
    from !== '' || to !== '' || actor !== '' || table !== ALL_TABLES

  return (
    <div className="space-y-4">
      <Card size="sm">
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="audit-from" className="text-xs">
              From
            </Label>
            <Input
              id="audit-from"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="audit-to" className="text-xs">
              To
            </Label>
            <Input
              id="audit-to"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="audit-actor" className="text-xs">
              Actor
            </Label>
            <Input
              id="audit-actor"
              placeholder="email contains…"
              value={actor}
              onChange={(e) => setActor(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Table</Label>
            <Select
              value={table}
              onValueChange={(v) => setTable(v ?? ALL_TABLES)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_TABLES}>All tables</SelectItem>
                {tables.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {filtered.length} of {entries.length} entries
        </p>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFrom('')
              setTo('')
              setActor('')
              setTable(ALL_TABLES)
            }}
          >
            Clear filters
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No audit log entries match the current filters.
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map((entry, i) => (
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
                      className={
                        ACTION_COLORS[entry.action] ||
                        'bg-slate-100 text-slate-700'
                      }
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
                    {entry.metadata &&
                      Object.keys(entry.metadata).length > 0 && (
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
      )}
    </div>
  )
}
