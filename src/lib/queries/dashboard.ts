import {
  MOCK_DASHBOARD_STATS,
  MOCK_EVENTS,
  MOCK_CORRECTIVE_ACTIONS,
  MOCK_INSPECTION_STATS,
} from '@/lib/mock-data'
import { getSessionProfile } from '@/lib/auth/guards'
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
  return {
    total_organizations: 4,
    total_users: 6,
    inactive_users: 0,
    pending_approvals: 1,
  }
}

export async function getPendingApprovalCount(): Promise<number> {
  return MOCK_CORRECTIVE_ACTIONS.filter((ca) => ca.status === 'pending_approval').length
}

export async function getDashboardStats(): Promise<DashboardStats> {
  return MOCK_DASHBOARD_STATS
}

export async function getRecentEvents(limit = 5): Promise<Event[]> {
  return MOCK_EVENTS.slice(0, limit)
}

export async function getOpenCorrectiveActions(
  limit = 5
): Promise<CorrectiveAction[]> {
  return MOCK_CORRECTIVE_ACTIONS
    .filter((ca) => ca.status !== 'approved' && ca.status !== 'rejected')
    .slice(0, limit)
}

export async function getInspectionStats(): Promise<InspectionStats> {
  return MOCK_INSPECTION_STATS
}

export async function getAllEvents(): Promise<Event[]> {
  return MOCK_EVENTS
}

export async function getAllCorrectiveActions(): Promise<CorrectiveAction[]> {
  return MOCK_CORRECTIVE_ACTIONS
}

export async function getMyPendingCorrectiveActions(): Promise<CorrectiveAction[]> {
  const profile = await getSessionProfile()
  if (!profile) return []
  return MOCK_CORRECTIVE_ACTIONS.filter(
    (ca) => ca.assigned_to === profile.id && ca.status !== 'approved'
  )
}
