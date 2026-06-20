import { MOCK_CURRENT_USER, MOCK_USER_ID } from '@/lib/mock-data'
import type { Profile } from '@/types/database'

export interface EffectiveProfileResult {
  profile: Profile | null
  isImpersonating: boolean
  realProfileId: string | null
}

export async function getEffectiveProfile(): Promise<EffectiveProfileResult> {
  return {
    profile: MOCK_CURRENT_USER,
    isImpersonating: false,
    realProfileId: MOCK_USER_ID,
  }
}
