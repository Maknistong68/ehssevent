import { Download } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ExportButtonProps {
  /** Export discriminator handled by /api/export. */
  type: 'events' | 'corrective-actions' | 'inspection'
  /** Extra query params (e.g. current list filters or a record id). */
  params?: Record<string, string | undefined>
  label?: string
  size?: 'sm' | 'default'
}

/**
 * Renders a download link to the XLSX export endpoint. Implemented as a plain
 * anchor so it works without client JS and streams the file directly.
 */
export function ExportButton({
  type,
  params = {},
  label = 'Export',
  size = 'sm',
}: ExportButtonProps) {
  const search = new URLSearchParams({ type })
  for (const [key, value] of Object.entries(params)) {
    if (value && value.trim()) search.set(key, value)
  }

  return (
    <a
      href={`/api/export?${search.toString()}`}
      className={cn(buttonVariants({ variant: 'outline', size }))}
      data-icon="inline-start"
    >
      <Download className="h-4 w-4" />
      {label}
    </a>
  )
}
