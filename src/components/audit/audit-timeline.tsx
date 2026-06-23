'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { AuditLogEntry } from '@/lib/queries/audit'

interface AuditTimelineProps {
  entries: AuditLogEntry[]
  emptyMessage?: string
}

type Change = { from: unknown; to: unknown }

/** Maps an action verb (the segment after the dot) to a dot color. */
function actionColor(action: string): string {
  const verb = action.split('.').pop() ?? ''
  if (verb === 'create' || verb === 'approved') return 'bg-green-500'
  if (verb === 'delete' || verb === 'rejected') return 'bg-red-500'
  if (verb === 'update' || verb === 'advance') return 'bg-blue-500'
  if (verb === 'close' || verb === 'closed') return 'bg-slate-500'
  return 'bg-amber-500'
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

/** Extracts a `{ field: {from, to} }` change map from an entry's metadata. */
function extractChanges(
  metadata: Record<string, unknown>
): Record<string, Change> {
  const out: Record<string, Change> = {}
  const changes = metadata.changes
  if (changes && typeof changes === 'object') {
    for (const [k, v] of Object.entries(changes as Record<string, unknown>)) {
      if (v && typeof v === 'object' && 'from' in v && 'to' in v) {
        out[k] = v as Change
      }
    }
  }
  // Status-only transitions are stored directly as `status: {from, to}`.
  const status = metadata.status
  if (
    status &&
    typeof status === 'object' &&
    'from' in status &&
    'to' in status
  ) {
    out.status = status as Change
  }
  return out
}

function getReason(metadata: Record<string, unknown>): string | null {
  const reason = metadata.reason
  return typeof reason === 'string' && reason.trim() ? reason : null
}

export function AuditTimeline({ entries, emptyMessage }: AuditTimelineProps) {
  if (entries.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        {emptyMessage ?? 'No activity recorded yet.'}
      </p>
    )
  }

  return (
    <ol className="relative space-y-4 border-l border-border pl-6">
      {entries.map((entry) => (
        <AuditTimelineItem key={entry.id} entry={entry} />
      ))}
    </ol>
  )
}

function AuditTimelineItem({ entry }: { entry: AuditLogEntry }) {
  const [expanded, setExpanded] = useState(false)
  const changes = extractChanges(entry.metadata)
  const reason = getReason(entry.metadata)
  const changeKeys = Object.keys(changes)
  const canExpand = changeKeys.length > 0

  return (
    <li className="relative">
      <span
        className={`absolute -left-[27px] top-1.5 h-3 w-3 rounded-full ring-4 ring-background ${actionColor(
          entry.action
        )}`}
        aria-hidden="true"
      />
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="font-mono text-xs font-medium">{entry.action}</span>
        <span className="text-xs text-muted-foreground">
          {entry.actor_email || 'System'}
        </span>
        <span className="text-xs text-muted-foreground">
          · {format(new Date(entry.created_at), 'dd MMM yyyy, h:mm a')}
        </span>
      </div>

      {reason && (
        <p className="mt-1 text-sm italic text-muted-foreground">“{reason}”</p>
      )}

      {canExpand && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
          aria-expanded={expanded}
        >
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
          {changeKeys.length} field{changeKeys.length === 1 ? '' : 's'} changed
        </button>
      )}

      {canExpand && expanded && (
        <dl className="mt-2 space-y-1.5 rounded-xl border border-border bg-secondary/30 p-3 text-xs">
          {changeKeys.map((key) => (
            <div key={key} className="grid grid-cols-[7rem_1fr] gap-2">
              <dt className="font-medium">{key}</dt>
              <dd className="flex flex-wrap items-center gap-1.5">
                <span className="rounded bg-red-100 px-1.5 py-0.5 text-red-800 line-through">
                  {formatValue(changes[key].from)}
                </span>
                <span className="text-muted-foreground">→</span>
                <span className="rounded bg-green-100 px-1.5 py-0.5 text-green-800">
                  {formatValue(changes[key].to)}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      )}
    </li>
  )
}
