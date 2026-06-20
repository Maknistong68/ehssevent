'use server'

import { revalidatePath } from 'next/cache'
import { logAudit } from '@/lib/actions/audit'

export async function startImpersonation(userId: string) {
  // Accountability: every "view as" is recorded so admin access to another
  // user's data is traceable (PDPL accountability principle).
  // TODO(prod): resolve the real admin actor and the target's email from the
  // session/DB instead of relying on the audit layer's defaults.
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
  // TODO(prod): record which target session was exited (resolve from session).
  await logAudit({
    action: 'impersonation.stop',
    target_table: 'profiles',
  })

  revalidatePath('/', 'layout')
  return { success: true } as { success?: boolean; error?: string }
}
