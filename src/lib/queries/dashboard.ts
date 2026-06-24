import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSessionProfile } from '@/lib/auth/guards'
import { getEvents } from '@/lib/queries/events'
import { getCorrectiveActions } from '@/lib/queries/corrective-actions'
import { isCorrectiveActionOverdue } from '@/lib/utils/corrective-actions'
import type {
  DashboardStats,
  Event,
  CorrectiveAction,
  InspectionStats,
} from '@/types/database'

export interface AdminStats {
  total_organizations: number
  total_users: number
  inactive_users: number
  pending_approvals: number
}

export async function getAdminStats(): Promise<AdminStats> {
  // Platform-wide counts (admin-only page) via the service-role client.
  const admin = createAdminClient()
  const [orgs, users, inactive, pending] = await Promise.all([
    admin
      .from('organizations')
      .select('id', { count: 'exact', head: true }),
    admin.from('profiles').select('id', { count: 'exact', head: true }),
    admin
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .neq('status', 'active'),
    admin
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
  ])
  return {
    total_organizations: orgs.count ?? 0,
    total_users: users.count ?? 0,
    inactive_users: inactive.count ?? 0,
    pending_approvals: pending.count ?? 0,
  }
}

export async function getPendingApprovalCount(): Promise<number> {
  const supabase = await createClient()
  const { count } = await supabase
    .from('corrective_actions')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending_approval')
  return count ?? 0
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const [events, cas] = await Promise.all([
    getEvents(),
    getCorrectiveActions(),
  ])

  const draft = events.filter((e) => e.approval_level === 'draft').length
  const closed = events.filter((e) => e.approval_level === 'closed').length
  const in_progress = events.length - draft - closed

  const openActions = cas.filter(
    (ca) => ca.status !== 'approved' && ca.status !== 'rejected'
  )
  const overdue = cas.filter((ca) => isCorrectiveActionOverdue(ca))

  const now = Date.now()
  const day = 24 * 60 * 60 * 1000
  const deadline_24h_overdue = events.filter(
    (e) =>
      !!e.reporting_deadline_24h &&
      !e.deadline_24h_met &&
      new Date(e.reporting_deadline_24h).getTime() < now
  ).length
  const deadline_3day_overdue = events.filter(
    (e) =>
      !!e.reporting_deadline_3day &&
      !e.deadline_3day_met &&
      new Date(e.reporting_deadline_3day).getTime() < now
  ).length
  const deadline_24h_approaching = events.filter(
    (e) =>
      !!e.reporting_deadline_24h &&
      !e.deadline_24h_met &&
      new Date(e.reporting_deadline_24h).getTime() >= now &&
      new Date(e.reporting_deadline_24h).getTime() - now <= day
  ).length

  return {
    draft,
    in_progress,
    closed,
    total: events.length,
    open_actions: openActions.length,
    overdue_actions: overdue.length,
    deadline_24h_overdue,
    deadline_3day_overdue,
    deadline_24h_approaching,
  }
}

export async function getRecentEvents(limit = 5): Promise<Event[]> {
  const events = await getEvents()
  return events.slice(0, limit)
}

export async function getOpenCorrectiveActions(
  limit = 5
): Promise<CorrectiveAction[]> {
  const cas = await getCorrectiveActions()
  return cas
    .filter((ca) => ca.status !== 'approved' && ca.status !== 'rejected')
    .slice(0, limit)
}

export async function getInspectionStats(): Promise<InspectionStats> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('inspections')
    .select('score, completed_at, status')
  if (error || !data) {
    return { total: 0, completed_this_month: 0, average_score: null }
  }

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
  let completedThisMonth = 0
  const scores: number[] = []
  for (const row of data as { score: number | null; completed_at: string | null }[]) {
    if (row.completed_at && new Date(row.completed_at).getTime() >= monthStart) {
      completedThisMonth++
    }
    if (typeof row.score === 'number') scores.push(row.score)
  }
  const average_score =
    scores.length > 0
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : null

  return {
    total: data.length,
    completed_this_month: completedThisMonth,
    average_score,
  }
}

export async function getMyEvents(): Promise<Event[]> {
  const profile = await getSessionProfile()
  if (!profile) return []
  const events = await getEvents()
  return events.filter((e) => e.created_by === profile.id)
}

export async function getMyCorrectiveActions(): Promise<CorrectiveAction[]> {
  const profile = await getSessionProfile()
  if (!profile) return []
  const cas = await getCorrectiveActions()
  return cas.filter((ca) => ca.created_by === profile.id)
}

export async function getMyPendingCorrectiveActions(): Promise<
  CorrectiveAction[]
> {
  const profile = await getSessionProfile()
  if (!profile) return []
  const cas = await getCorrectiveActions()
  return cas.filter(
    (ca) => ca.assigned_to === profile.id && ca.status !== 'approved'
  )
}
