import { Suspense } from 'react'
import { Metadata } from 'next'
import { NavigationManager } from '@/components/admin/setup/navigation/navigation-manager'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata: Metadata = {
  title: 'Navigation Settings | Setup',
  description:
    'Configure navigation visibility and ordering for your organization',
}

function NavigationManagerSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    </div>
  )
}

export default function NavigationSettingsPage() {
  return (
    <div className="container max-w-5xl py-6">
      <Suspense fallback={<NavigationManagerSkeleton />}>
        <NavigationManager />
      </Suspense>
    </div>
  )
}
