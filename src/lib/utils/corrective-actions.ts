import type { CorrectiveAction } from '@/types/database'

// A corrective action is overdue when it has a due date in the past and is not
// yet resolved (approved or rejected).
const RESOLVED_STATUSES = new Set(['approved', 'rejected'])

export function isCorrectiveActionOverdue(
  ca: Pick<CorrectiveAction, 'due_date' | 'status'>,
  now: number = Date.now()
): boolean {
  if (!ca.due_date) return false
  if (RESOLVED_STATUSES.has(ca.status)) return false
  return new Date(ca.due_date).getTime() < now
}
