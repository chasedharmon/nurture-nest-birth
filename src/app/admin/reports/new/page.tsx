'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ReportBuilderWizard } from '@/components/admin/reports'
import { createReport } from '@/app/actions/reports'
import type { ReportConfig } from '@/lib/supabase/types'

export default function NewReportPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const handleSave = async (config: ReportConfig) => {
    setError(null)
    const result = await createReport(config)

    if (result.success && result.data) {
      router.push(`/admin/reports/${result.data.id}`)
    } else {
      setError(result.error || 'Failed to create report')
      throw new Error(result.error || 'Failed to create report')
    }
  }

  const handleCancel = () => {
    router.push('/admin/reports')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/reports">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create Report</h1>
          <p className="text-muted-foreground">
            Build a custom report step by step
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Wizard */}
      <ReportBuilderWizard onSave={handleSave} onCancel={handleCancel} />
    </div>
  )
}
