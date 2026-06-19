import { Skeleton } from '@/components/ui/skeleton'

export default function EventsLoading() {
  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32 mt-1" />
        </div>
        <Skeleton className="h-10 w-44" />
      </div>

      <Skeleton className="h-11 w-full rounded-xl" />

      <div className="flex gap-2">
        <Skeleton className="h-11 w-[150px] rounded-xl" />
        <Skeleton className="h-11 w-[150px] rounded-xl" />
        <Skeleton className="h-11 w-[160px] rounded-xl" />
      </div>

      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-3xl" />
        ))}
      </div>
    </div>
  )
}
