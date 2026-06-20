import { createClient } from '@/lib/supabase/server'
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
  const supabase = await createClient()

  const [orgs, profiles, pendingCAs] = await Promise.all([
    supabase.from('organizations').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id, is_active'),
    supabase
      .from('corrective_actions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending_approval'),
  ])

  const allProfiles = profiles.data || []

  return {
    total_organizations: orgs.count || 0,
    total_users: allProfiles.length,
    inactive_users: allProfiles.filter((p) => !p.is_active).length,
    pending_approvals: pendingCAs.count || 0,
  }
}

export async function getPendingApprovalCount(): Promise<number> {
  const supabase = await createClient()

  const { count } = await supabase
    .from('corrective_actions')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending_approval')

  return count || 0
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient()

  const stats: DashboardStats = {
    draft: 0,
    in_progress: 0,
    closed: 0,
    total: 0,
    open_actions: 0,
    overdue_actions: 0,
    deadline_24h_overdue: 0,
    deadline_3day_overdue: 0,
    deadline_24h_approaching: 0,
  }

  const { data: events } = await supabase
    .from('events')
    .select('approval_level, reporting_deadline_24h, reporting_deadline_3day, deadline_24h_met, deadline_3day_met')
  if (events) {
    const now = new Date()
    const fourHoursFromNow = new Date(now.getTime() + 4 * 60 * 60 * 1000)

    stats.total = events.length
    for (const e of events) {
      if (e.approval_level === 'draft') {
        stats.draft++
      } else if (e.approval_level === 'closed') {
        stats.closed++
      } else {
        stats.in_progress++
      }

      // Deadline tracking
      if (!e.deadline_24h_met && e.reporting_deadline_24h) {
        const deadline24h = new Date(e.reporting_deadline_24h)
        if (deadline24h < now) {
          stats.deadline_24h_overdue++
        } else if (deadline24h < fourHoursFromNow) {
          stats.deadline_24h_approaching++
        }
      }
      if (!e.deadline_3day_met && e.reporting_deadline_3day) {
        const deadline3day = new Date(e.reporting_deadline_3day)
        if (deadline3day < now) {
          stats.deadline_3day_overdue++
        }
      }
    }
  }

  const { data: actions } = await supabase
    .from('corrective_actions')
    .select('status, due_date')
  if (actions) {
    const now = new Date().toISOString()
    for (const a of actions) {
      const isOpen = a.status !== 'approved' && a.status !== 'rejected'
      if (isOpen) {
        stats.open_actions++
        if (a.due_date && a.due_date < now) {
          stats.overdue_actions++
        }
      }
    }
  }

  return stats
}

export async function getRecentEvents(limit = 5): Promise<Event[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      project:projects(id, name, location),
      creator:profiles!created_by(id, full_name, email),
      creator_organization:organizations!creator_org_id(id, name)
    `)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return []
  return (data as unknown as Event[]) || []
}

export async function getOpenCorrectiveActions(
  limit = 5
): Promise<CorrectiveAction[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('corrective_actions')
    .select(`
      *,
      event:events!event_id(id, reference_number),
      inspection:inspections!inspection_id(id, reference_number),
      project:projects(id, name, location),
      assignee:profiles!assigned_to(id, full_name, email)
    `)
    .not('status', 'in', '(approved,rejected)')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return []
  return (data as unknown as CorrectiveAction[]) || []
}

export async function getInspectionStats(): Promise<InspectionStats> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('inspections')
    .select('status, score, completed_at')

  if (error || !data) {
    return { total: 0, completed_this_month: 0, average_score: null }
  }

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const completedThisMonth = data.filter(
    (i) => i.status === 'completed' && i.completed_at && i.completed_at >= startOfMonth
  ).length

  const scores = data
    .filter((i) => i.score !== null)
    .map((i) => Number(i.score))

  const averageScore =
    scores.length > 0
      ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100
      : null

  return {
    total: data.length,
    completed_this_month: completedThisMonth,
    average_score: averageScore,
  }
}
