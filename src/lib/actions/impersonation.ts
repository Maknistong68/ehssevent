'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { logAudit } from '@/lib/actions/audit'
import { IMPERSONATION_COOKIE, requirePermission } from '@/lib/auth/guards'
import { MOCK_PROFILES } from '@/lib/mock-data'

export async function startImpersonation(userId: string) {
  // Only actors granted `impersonate:use` may view-as another user.
  const auth = await requirePermission('impersonate:use')
  if (!auth.ok)
    return { error: auth.error } as { success?: boolean; error?: string }

  // An admin cannot impersonate their own account (no-op + confusing audit).
  if (userId === auth.profile.id) {
    return { error: 'You cannot impersonate your own account.' }
  }

  // The target must exist before we record an impersonation session.
  const target = MOCK_PROFILES.find((p) => p.id === userId)
  if (!target) return { error: 'User not found' }

  // httpOnly so the impersonation session can only be changed via these
  // audited server actions, never from client script.
  const cookieStore = await cookies()
  cookieStore.set(IMPERSONATION_COOKIE, userId, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  })

  // Accountability: every "view as" is recorded so admin access to another
  // user's data is traceable (PDPL accountability principle).
  await logAudit({
    action: 'impersonation.start',
    target_table: 'profiles',
    target_id: userId,
    metadata: { mode: 'read_only' },
  })

  revalidatePath('/', 'layout')
  return { success: true } as { success?: boolean; error?: string }
}

export async function stopImpersonation() {
  const cookieStore = await cookies()
  const targetId = cookieStore.get(IMPERSONATION_COOKIE)?.value ?? null
  cookieStore.delete(IMPERSONATION_COOKIE)

  await logAudit({
    action: 'impersonation.stop',
    target_table: 'profiles',
    target_id: targetId,
  })

  revalidatePath('/', 'layout')
  return { success: true } as { success?: boolean; error?: string }
}
