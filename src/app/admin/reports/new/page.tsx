'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle } from 'lucide-react'
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
      <div>
        <h1 className="font-serif text-2xl font-bold text-foreground">
          Create Report
        </h1>
        <p className="text-sm text-muted-foreground">
          Build a custom report step by step
        </p>
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
