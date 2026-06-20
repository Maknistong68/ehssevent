'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, X } from 'lucide-react'

export function ProjectFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== 'all') {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }

  const updateSort = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (!value || value === 'default') {
      params.delete('sort')
      params.delete('dir')
    } else {
      const [sort, dir] = value.split(':')
      params.set('sort', sort)
      params.set('dir', dir)
    }
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }

  const sortValue = (() => {
    const sort = searchParams.get('sort')
    const dir = searchParams.get('dir')
    return sort && dir ? `${sort}:${dir}` : 'default'
  })()

  const clearFilters = () => {
    router.push(pathname)
  }

  const hasFilters = searchParams.toString().length > 0

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search projects..."
          className="pl-11"
          defaultValue={searchParams.get('search') || ''}
          onChange={(e) => updateFilter('search', e.target.value)}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Select value={sortValue} onValueChange={(v) => updateSort(v ?? 'default')}>
          <SelectTrigger className="min-w-[140px] flex-1 sm:w-[170px] sm:flex-none">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Sort: Default</SelectItem>
            <SelectItem value="name:asc">Name (A–Z)</SelectItem>
            <SelectItem value="name:desc">Name (Z–A)</SelectItem>
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="mr-1 h-4 w-4" />
            Clear
          </Button>
        )}
      </div>
    </div>
  )
}
