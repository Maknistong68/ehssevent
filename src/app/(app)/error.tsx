'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'
import { EmptyState } from '@/components/shared/empty-state'
import { reportError } from '@/lib/observability/logger'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  // Forward the error (and Next's `digest`, which correlates to the masked
  // server-side stack) to monitoring so production failures are observable.
  useEffect(() => {
    reportError(error, { digest: error.digest, boundary: 'app' })
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <EmptyState
        icon={AlertTriangle}
        title="Something went wrong"
        description={error.message || 'An unexpected error occurred.'}
        action={<Button onClick={() => reset()}>Try Again</Button>}
      />
    </div>
  )
}
