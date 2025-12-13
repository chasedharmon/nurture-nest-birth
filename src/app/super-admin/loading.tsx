import { Loader2 } from 'lucide-react'

export default function SuperAdminLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="size-8 animate-spin text-violet-600" />
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Loading platform admin...
        </p>
      </div>
    </div>
  )
}
