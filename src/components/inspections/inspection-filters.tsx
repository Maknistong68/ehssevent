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
import { INSPECTION_STATUS_LABELS } from '@/types/enums'
import type { Project, InspectionTemplate } from '@/types/database'

interface InspectionFiltersProps {
  projects: Project[]
  templates: InspectionTemplate[]
}

export function InspectionFilters({ projects, templates }: InspectionFiltersProps) {
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
          placeholder="Search inspections..."
          className="pl-11"
          defaultValue={searchParams.get('search') || ''}
          onChange={(e) => updateFilter('search', e.target.value)}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Select
          value={searchParams.get('status') || 'all'}
          onValueChange={(v) => updateFilter('status', v ?? '')}
        >
          <SelectTrigger className="min-w-[120px] flex-1 sm:w-[140px] sm:flex-none">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {Object.entries(INSPECTION_STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={searchParams.get('project_id') || 'all'}
          onValueChange={(v) => updateFilter('project_id', v ?? '')}
        >
          <SelectTrigger className="min-w-[140px] flex-1 sm:w-[160px] sm:flex-none">
            <SelectValue placeholder="Project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={searchParams.get('template_id') || 'all'}
          onValueChange={(v) => updateFilter('template_id', v ?? '')}
        >
          <SelectTrigger className="min-w-[140px] flex-1 sm:w-[160px] sm:flex-none">
            <SelectValue placeholder="Template" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Templates</SelectItem>
            {templates.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortValue} onValueChange={(v) => updateSort(v ?? 'default')}>
          <SelectTrigger className="min-w-[140px] flex-1 sm:w-[160px] sm:flex-none">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Sort: Default</SelectItem>
            <SelectItem value="score:desc">Score (high–low)</SelectItem>
            <SelectItem value="score:asc">Score (low–high)</SelectItem>
            <SelectItem value="status:asc">Status</SelectItem>
            <SelectItem value="reference:asc">Reference (A–Z)</SelectItem>
            <SelectItem value="reference:desc">Reference (Z–A)</SelectItem>
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
