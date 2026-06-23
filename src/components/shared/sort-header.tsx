'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TableHead } from '@/components/ui/table'

interface SortHeaderProps {
  sortKey: string
  children: React.ReactNode
  className?: string
  /** Align the trigger to the end of the cell (e.g. numeric columns). */
  align?: 'start' | 'end'
}

/**
 * A sortable <TableHead>. Clicking cycles the URL `sort`/`dir` params
 * asc → desc → none and resets pagination to page 1.
 */
export function SortHeader({
  sortKey,
  children,
  className,
  align = 'start',
}: SortHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentSort = searchParams.get('sort')
  const currentDir = searchParams.get('dir')
  const active = currentSort === sortKey

  const handleClick = () => {
    const params = new URLSearchParams(searchParams.toString())
    if (!active) {
      params.set('sort', sortKey)
      params.set('dir', 'asc')
    } else if (currentDir === 'asc') {
      params.set('sort', sortKey)
      params.set('dir', 'desc')
    } else {
      params.delete('sort')
      params.delete('dir')
    }
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }

  const Icon = active
    ? currentDir === 'asc'
      ? ChevronUp
      : ChevronDown
    : ChevronsUpDown

  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          'group/sort -mx-1 inline-flex items-center gap-1.5 rounded-md px-1 py-0.5 text-xs font-semibold tracking-wide uppercase transition-colors hover:text-foreground',
          align === 'end' && 'flex-row-reverse',
          active ? 'text-foreground' : 'text-muted-foreground'
        )}
      >
        {children}
        <Icon
          className={cn(
            'h-3.5 w-3.5 shrink-0',
            !active && 'opacity-50 group-hover/sort:opacity-100'
          )}
        />
      </button>
    </TableHead>
  )
}
