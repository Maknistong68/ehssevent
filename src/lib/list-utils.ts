// Pure, framework-agnostic helpers for sorting and paginating in-memory lists.
// Used by the list pages (events, corrective-actions, inspections, projects)
// to derive a stable, URL-driven view of the already-filtered dataset.

export const DEFAULT_PAGE_SIZE = 15
export const PAGE_SIZE_OPTIONS = [10, 15, 25, 50] as const

export type SortDir = 'asc' | 'desc'

export type SortValue = string | number | Date | null | undefined
export type Accessor<T> = (item: T) => SortValue

/**
 * Returns a new array sorted by the accessor registered under `key`.
 * No-ops (returns the original array) when the key/dir are missing or unknown.
 * Nullish values always sort last regardless of direction.
 */
export function sortItems<T>(
  items: T[],
  key: string | undefined,
  dir: string | undefined,
  accessors: Record<string, Accessor<T>>
): T[] {
  if (!key) return items
  const accessor = accessors[key]
  if (!accessor) return items
  if (dir !== 'asc' && dir !== 'desc') return items

  const factor = dir === 'desc' ? -1 : 1

  return [...items].sort((a, b) => {
    const av = accessor(a)
    const bv = accessor(b)

    if (av == null && bv == null) return 0
    if (av == null) return 1
    if (bv == null) return -1

    let cmp: number
    if (av instanceof Date && bv instanceof Date) {
      cmp = av.getTime() - bv.getTime()
    } else if (typeof av === 'number' && typeof bv === 'number') {
      cmp = av - bv
    } else {
      cmp = String(av).localeCompare(String(bv), undefined, {
        numeric: true,
        sensitivity: 'base',
      })
    }
    return cmp * factor
  })
}

export interface PaginationResult<T> {
  pageItems: T[]
  total: number
  totalPages: number
  page: number
  per: number
  from: number
  to: number
}

/**
 * Slices `items` for the requested page, clamping `page` into the valid range.
 */
export function paginate<T>(items: T[], page: number, per: number): PaginationResult<T> {
  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / per))
  const currentPage = Math.min(Math.max(1, page), totalPages)
  const start = (currentPage - 1) * per
  const end = Math.min(start + per, total)

  return {
    pageItems: items.slice(start, end),
    total,
    totalPages,
    page: currentPage,
    per,
    from: total === 0 ? 0 : start + 1,
    to: end,
  }
}

/**
 * Normalizes raw `page`/`per` URL params into safe values.
 */
export function parsePageParams(params: { page?: string; per?: string }): {
  page: number
  per: number
} {
  const perNum = Number(params.per)
  const per = (PAGE_SIZE_OPTIONS as readonly number[]).includes(perNum)
    ? perNum
    : DEFAULT_PAGE_SIZE
  const page = Math.max(1, Math.floor(Number(params.page)) || 1)
  return { page, per }
}
