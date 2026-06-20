export type DateRange = 'all' | '6m' | '3m' | '1m' | 'w'

export const DATE_RANGES: DateRange[] = ['all', '6m', '3m', '1m', 'w']

// Latest timestamp across the given ISO strings (fallback: now). Used to anchor
// range math to the data so demo records (dated in the past) still filter
// sensibly. With live data near today, this equals real-now.
export function referenceDate(dates: (string | null | undefined)[]): Date {
  let latest = 0
  for (const iso of dates) {
    if (!iso) continue
    const t = new Date(iso).getTime()
    if (!Number.isNaN(t) && t > latest) latest = t
  }
  return latest > 0 ? new Date(latest) : new Date()
}

// Cutoff Date for a range relative to a reference date ('all' => null).
export function rangeCutoff(range: DateRange, ref: Date): Date | null {
  if (range === 'all') return null
  const cutoff = new Date(ref)
  switch (range) {
    case '6m':
      cutoff.setMonth(cutoff.getMonth() - 6)
      break
    case '3m':
      cutoff.setMonth(cutoff.getMonth() - 3)
      break
    case '1m':
      cutoff.setMonth(cutoff.getMonth() - 1)
      break
    case 'w':
      cutoff.setDate(cutoff.getDate() - 7)
      break
  }
  return cutoff
}

// True if iso date >= cutoff (or range === 'all').
export function inRange(
  iso: string | null | undefined,
  range: DateRange,
  ref: Date
): boolean {
  const cutoff = rangeCutoff(range, ref)
  if (!cutoff) return true
  if (!iso) return false
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return false
  return t >= cutoff.getTime()
}

// "New this week" relative to ref (last 7 days before ref).
export function isNew(iso: string | null | undefined, ref: Date): boolean {
  if (!iso) return false
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return false
  const cutoff = new Date(ref)
  cutoff.setDate(cutoff.getDate() - 7)
  return t >= cutoff.getTime() && t <= ref.getTime()
}
