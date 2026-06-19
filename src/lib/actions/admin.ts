'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { OrgType, UserRole } from '@/types/enums'

export async function createOrganization(input: {
  name: string
  org_type: OrgType
  contact_email?: string
}) {
  const supabase = await createClient()

  const { error } = await supabase.from('organizations').insert({
    name: input.name,
    org_type: input.org_type,
    contact_email: input.contact_email || null,
  })

  if (error) return { error: error.message }

  revalidatePath('/admin')
  return { success: true }
}

export async function updateUserProfile(input: {
  user_id: string
  role?: UserRole
  organization_id?: string | null
  is_active?: boolean
}) {
  const supabase = await createClient()

  const updateData: Record<string, unknown> = {}
  if (input.role !== undefined) updateData.role = input.role
  if (input.organization_id !== undefined) updateData.organization_id = input.organization_id
  if (input.is_active !== undefined) updateData.is_active = input.is_active

  const { error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', input.user_id)

  if (error) return { error: error.message }

  revalidatePath('/admin')
  return { success: true }
}
