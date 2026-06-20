import { MOCK_ORGANIZATIONS, MOCK_PROFILES } from '@/lib/mock-data'
import type { Organization, Profile } from '@/types/database'

export async function getAllOrganizations(): Promise<Organization[]> {
  return [...MOCK_ORGANIZATIONS]
}

export async function getAllProfiles(): Promise<Profile[]> {
  return [...MOCK_PROFILES]
}
