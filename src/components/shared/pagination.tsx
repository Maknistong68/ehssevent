'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PAGE_SIZE_OPTIONS } from '@/lib/list-utils'

interface PaginationProps {
  total: number
  page: number
  per: number
  totalPages: number
  from: number
  to: number
}

export function Pagination({ total, page, per, totalPages, from, to }: PaginationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const setParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(updates)) {
      if (value === null) params.delete(key)
      else params.set(key, value)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  if (total === 0) return null

  const goToPage = (p: number) => setParams({ page: String(p) })
  const pageNumbers = getPageNumbers(page, totalPages)

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        {from}&ndash;{to} of {total}
      </p>

      <div className="flex items-center gap-2">
        <Select
          value={String(per)}
          onValueChange={(v) => v && setParams({ per: v, page: null })}
        >
          <SelectTrigger size="sm" className="w-[6.5rem]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZE_OPTIONS.map((opt) => (
              <SelectItem key={opt} value={String(opt)}>
                {opt} / page
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            disabled={page <= 1}
            onClick={() => goToPage(page - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
          </Button>

          {pageNumbers.map((n, i) =>
            n === '...' ? (
              <span
                key={`ellipsis-${i}`}
                className="hidden px-1.5 text-sm text-muted-foreground sm:inline"
              >
                &hellip;
              </span>
            ) : (
              <Button
                key={n}
                variant={n === page ? 'default' : 'outline'}
                size="icon-sm"
                onClick={() => goToPage(n)}
                aria-current={n === page ? 'page' : undefined}
                className={cn('hidden sm:inline-flex', n === page && 'inline-flex')}
              >
                {n}
              </Button>
            )
          )}

          <Button
            variant="outline"
            size="icon-sm"
            disabled={page >= totalPages}
            onClick={() => goToPage(page + 1)}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4 rtl:rotate-180" />
          </Button>
        </div>
      </div>
    </div>
  )
}

/**
 * Builds a compact page list with ellipses, e.g. [1, '...', 4, 5, 6, '...', 12].
 */
function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const pages: (number | '...')[] = [1]
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)

  if (start > 2) pages.push('...')
  for (let i = start; i <= end; i++) pages.push(i)
  if (end < total - 1) pages.push('...')
  pages.push(total)

  return pages
}
