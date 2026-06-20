'use server'

import { revalidatePath } from 'next/cache'

export async function startImpersonation(_userId: string) {
  revalidatePath('/', 'layout')
  return { success: true } as { success?: boolean; error?: string }
}

export async function stopImpersonation() {
  revalidatePath('/', 'layout')
  return { success: true } as { success?: boolean; error?: string }
}
