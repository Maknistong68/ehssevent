'use client'

import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'
import { EmptyState } from '@/components/shared/empty-state'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <EmptyState
        icon={AlertTriangle}
        title="Something went wrong"
        description={error.message || 'An unexpected error occurred.'}
        action={
          <Button onClick={() => reset()}>Try Again</Button>
        }
      />
    </div>
  )
}
