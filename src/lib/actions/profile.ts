'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'

export async function updateProfile(input: { full_name: string }) {
  const auth = await requireUser()
  if (!auth.ok) return { error: auth.error }

  const name = input.full_name?.trim()
  if (!name || name.length < 2) {
    return { error: 'Name must be at least 2 characters' }
  }

  // RLS allows a user to update only their own profile row.
  const supabase = await createClient()
  const { error } = await supabase
    .from('profiles')
    .update({ full_name: name })
    .eq('id', auth.profile.id)
  if (error) return { error: error.message }

  revalidatePath('/profile')
  revalidatePath('/dashboard')
  return { success: true }
}
