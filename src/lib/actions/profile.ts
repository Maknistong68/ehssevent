'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth/guards'
import { MOCK_CURRENT_USER } from '@/lib/mock-data'

export async function updateProfile(input: { full_name: string }) {
  const auth = await requireUser()
  if (!auth.ok) return { error: auth.error }

  const name = input.full_name?.trim()
  if (!name || name.length < 2) {
    return { error: 'Name must be at least 2 characters' }
  }

  // Mutate the in-memory mock user
  ;(MOCK_CURRENT_USER as { full_name: string | null }).full_name = name

  revalidatePath('/profile')
  revalidatePath('/dashboard')
  return { success: true }
}
