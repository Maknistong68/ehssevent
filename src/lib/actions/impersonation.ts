'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { getSessionProfile, IMPERSONATION_COOKIE } from '@/lib/auth/guards'
import { createAdminClient } from '@/lib/supabase/admin'
import { can } from '@/lib/auth/permissions'
import { logAudit } from '@/lib/actions/audit'

const COOKIE_MAX_AGE = 60 * 60 * 4 // 4 hours

/**
 * Begins a read-only "view as" session. Only users with `impersonate:use`
 * (system_admin / support) may start one. The real database identity is never
 * changed — an httpOnly cookie records the simulated user for UI gating, and
 * all mutations are blocked while it is set (see requireUser).
 */
export async function startImpersonation(userId: string) {
  const actor = await getSessionProfile()
  if (!actor) return { error: 'Not authenticated' }
  if (!can(actor.role, 'impersonate:use')) return { error: 'Not authorized' }
  if (userId === actor.id) return { error: 'You cannot view as yourself' }

  // Confirm the target exists (service role: target may be in another org).
  const admin = createAdminClient()
  const { data: target } = await admin
    .from('profiles')
    .select('id, email, role')
    .eq('id', userId)
    .single()

  if (!target) return { error: 'User not found' }

  const cookieStore = await cookies()
  cookieStore.set(IMPERSONATION_COOKIE, userId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  })

  await logAudit({
    action: 'impersonation.start',
    target_table: 'profiles',
    target_id: userId,
    target_label: target.email,
    metadata: { role: target.role },
  })

  revalidatePath('/', 'layout')
  return { success: true }
}

/**
 * Ends an active "view as" session, restoring the real user's experience.
 */
export async function stopImpersonation() {
  const cookieStore = await cookies()
  const targetId = cookieStore.get(IMPERSONATION_COOKIE)?.value

  cookieStore.delete(IMPERSONATION_COOKIE)

  if (targetId) {
    await logAudit({
      action: 'impersonation.stop',
      target_table: 'profiles',
      target_id: targetId,
    })
  }

  revalidatePath('/', 'layout')
  return { success: true }
}
