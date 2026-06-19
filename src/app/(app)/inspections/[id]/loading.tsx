import { Skeleton } from '@/components/ui/skeleton'

export default function InspectionDetailLoading() {
  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-5 w-5" />
        <div className="flex-1">
          <Skeleton className="h-4 w-32 mb-1" />
          <Skeleton className="h-7 w-64" />
        </div>
      </div>

      <div className="flex gap-2">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-6 w-16" />
      </div>

      <Skeleton className="h-40 rounded-3xl" />
      <Skeleton className="h-20 rounded-3xl" />
      <Skeleton className="h-64 rounded-3xl" />
      <Skeleton className="h-48 rounded-3xl" />
    </div>
  )
}
