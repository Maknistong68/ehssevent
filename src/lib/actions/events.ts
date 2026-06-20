'use server'

import { revalidatePath } from 'next/cache'
import { requirePermission } from '@/lib/auth/guards'
import {
  createEventSchema,
  updateApprovalLevelSchema,
  closeoutEventSchema,
  createEventResponseSchema,
} from '@/lib/validators/events'

export async function createEvent(input: unknown) {
  const auth = await requirePermission('event:create')
  if (!auth.ok) return { error: auth.error }

  const parsed = createEventSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  revalidatePath('/events')
  revalidatePath('/dashboard')

  return { success: true }
}

export async function updateEventApprovalLevel(input: unknown) {
  const auth = await requirePermission('event:manage')
  if (!auth.ok) return { error: auth.error }

  const parsed = updateApprovalLevelSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  revalidatePath(`/events/${parsed.data.event_id}`)
  revalidatePath('/events')
  revalidatePath('/dashboard')

  return { success: true }
}

export async function addEventResponse(input: unknown) {
  const auth = await requirePermission('event:respond')
  if (!auth.ok) return { error: auth.error }

  const parsed = createEventResponseSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  revalidatePath(`/events/${parsed.data.event_id}`)
  revalidatePath('/events')
  revalidatePath('/dashboard')

  return { success: true }
}

export async function closeoutEvent(input: unknown) {
  const auth = await requirePermission('event:manage')
  if (!auth.ok) return { error: auth.error }

  const parsed = closeoutEventSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  revalidatePath(`/events/${parsed.data.event_id}`)
  revalidatePath('/events')
  revalidatePath('/dashboard')

  return { success: true }
}
