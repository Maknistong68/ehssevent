import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FileQuestion } from 'lucide-react'
import { EmptyState } from '@/components/shared/empty-state'

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <EmptyState
        icon={FileQuestion}
        title="Page Not Found"
        description="The page you're looking for doesn't exist or you don't have access."
        action={
          <Link href="/dashboard">
            <Button>Go to Dashboard</Button>
          </Link>
        }
      />
    </div>
  )
}
