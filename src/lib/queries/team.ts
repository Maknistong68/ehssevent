import { MOCK_PROFILES } from '@/lib/mock-data'
import type { Profile } from '@/types/database'

export async function getOrgMembers(organizationId: string): Promise<Profile[]> {
  return MOCK_PROFILES.filter((p) => p.organization_id === organizationId)
}
