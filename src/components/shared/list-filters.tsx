'use client'

import { useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Search, SlidersHorizontal } from 'lucide-react'

export type ListFilterField =
  | { type: 'search'; key: string; placeholder?: string }
  | {
      type: 'select'
      key: string
      label: string
      placeholder?: string
      options: { value: string; label: string }[]
    }

export interface ListFilterSortOption {
  value: string
  label: string
}

interface ListFiltersProps {
  fields: ListFilterField[]
  sortOptions?: ListFilterSortOption[]
  title?: string
}

type Draft = Record<string, string>

export function ListFilters({
  fields,
  sortOptions,
  title = 'Filter & Sort',
}: ListFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<Draft>({})
  const [draftSort, setDraftSort] = useState('default')

  // The sort/dir pair is encoded as a single `sort:dir` value to match the
  // existing select-based encoding.
  const sortValueFromParams = () => {
    const sort = searchParams.get('sort')
    const dir = searchParams.get('dir')
    return sort && dir ? `${sort}:${dir}` : 'default'
  }

  // Reset the draft from the URL each time the sheet opens so edits always
  // start from the currently applied state.
  const handleOpenChange = (next: boolean) => {
    if (next) {
      const fresh: Draft = {}
      for (const field of fields) {
        fresh[field.key] = searchParams.get(field.key) ?? ''
      }
      setDraft(fresh)
      setDraftSort(sortValueFromParams())
    }
    setOpen(next)
  }

  const setField = (key: string, value: string) =>
    setDraft((prev) => ({ ...prev, [key]: value }))

  const apply = () => {
    const params = new URLSearchParams(searchParams.toString())

    for (const field of fields) {
      const value = draft[field.key] ?? ''
      if (value && value !== 'all') {
        params.set(field.key, value)
      } else {
        params.delete(field.key)
      }
    }

    if (!draftSort || draftSort === 'default') {
      params.delete('sort')
      params.delete('dir')
    } else {
      const [sort, dir] = draftSort.split(':')
      params.set('sort', sort)
      params.set('dir', dir)
    }

    params.delete('page')
    const query = params.toString()
    router.push(query ? `${pathname}?${query}` : pathname)
    setOpen(false)
  }

  const reset = () => {
    const cleared: Draft = {}
    for (const field of fields) cleared[field.key] = ''
    setDraft(cleared)
    setDraftSort('default')
    router.push(pathname)
    setOpen(false)
  }

  // Active-count badge reflects what is currently applied (from the URL), not
  // the in-progress draft.
  const activeCount = (() => {
    let count = 0
    for (const field of fields) {
      if (searchParams.get(field.key)) count += 1
    }
    if (sortOptions && sortValueFromParams() !== 'default') count += 1
    return count
  })()

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger
        render={
          <Button variant="outline" data-icon="inline-start" />
        }
      >
        <SlidersHorizontal className="h-4 w-4" />
        {title}
        {activeCount > 0 && (
          <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
            {activeCount}
          </span>
        )}
      </SheetTrigger>

      <SheetContent
        side="bottom"
        className="max-h-[85vh] rounded-t-2xl"
      >
        <SheetHeader className="border-b">
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-2">
          {fields.map((field) => {
            if (field.type === 'search') {
              return (
                <div key={field.key} className="relative">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={field.placeholder ?? 'Search...'}
                    className="pl-11"
                    value={draft[field.key] ?? ''}
                    onChange={(e) => setField(field.key, e.target.value)}
                  />
                </div>
              )
            }

            return (
              <div key={field.key} className="space-y-2">
                <Label>{field.label}</Label>
                <Select
                  value={draft[field.key] || 'all'}
                  onValueChange={(v) => setField(field.key, v ?? 'all')}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={field.placeholder ?? field.label} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {field.placeholder ?? `All ${field.label}`}
                    </SelectItem>
                    {field.options.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )
          })}

          {sortOptions && sortOptions.length > 0 && (
            <div className="space-y-2">
              <Label>Sort by</Label>
              <Select
                value={draftSort}
                onValueChange={(v) => setDraftSort(v ?? 'default')}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Sort: Default</SelectItem>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <SheetFooter className="flex-row gap-2 border-t">
          <Button
            variant="ghost"
            className="flex-1"
            onClick={reset}
            type="button"
          >
            Reset
          </Button>
          <SheetClose
            render={
              <Button className="flex-1" onClick={apply} type="button" />
            }
          >
            Apply
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
