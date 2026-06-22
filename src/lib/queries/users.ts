import { MOCK_PROFILES } from '@/lib/mock-data'

export interface AssignableUser {
  id: string
  full_name: string | null
  email: string
}

export async function getAssignableUsers(): Promise<AssignableUser[]> {
  return MOCK_PROFILES.filter((p) => p.status === 'active').map((p) => ({
    id: p.id,
    full_name: p.full_name,
    email: p.email,
  }))
}
