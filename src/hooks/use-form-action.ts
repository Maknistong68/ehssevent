'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

type ActionResult = {
  success?: boolean
  error?: string
  [key: string]: unknown
} | void

interface UseFormActionOptions {
  /** Toast shown on success. Pass null to suppress. */
  successMessage?: string | null
  /** Path to navigate to on success. */
  redirectTo?: string
  /** Call router.refresh() on success (default true when no redirect). */
  refresh?: boolean
  /** Callback invoked with the action result on success. */
  onSuccess?: (result: Exclude<ActionResult, void>) => void
}

/**
 * Wraps the common React-form → server-action → toast pattern so individual
 * forms don't each re-implement loading state, error capture and toasts.
 *
 * Returns `run` (invoke the action), a `pending` flag and the last `error`.
 */
export function useFormAction<TInput>(
  action: (input: TInput) => Promise<ActionResult>,
  options: UseFormActionOptions = {}
) {
  const {
    successMessage = 'Saved',
    redirectTo,
    refresh = true,
    onSuccess,
  } = options
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const run = (input: TInput) => {
    setError(null)
    startTransition(async () => {
      const result = await action(input)
      if (result && 'error' in result && result.error) {
        setError(result.error)
        toast.error(result.error)
        return
      }
      if (successMessage) toast.success(successMessage)
      if (onSuccess && result) onSuccess(result)
      if (redirectTo) {
        router.push(redirectTo)
        router.refresh()
      } else if (refresh) {
        router.refresh()
      }
    })
  }

  return { run, pending, error, setError }
}
