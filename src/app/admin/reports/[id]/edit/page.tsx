'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ReportBuilderWizard } from '@/components/admin/reports'
import { getReportById, updateReport } from '@/app/actions/reports'
import type { ReportConfig } from '@/lib/supabase/types'

interface EditReportPageProps {
  params: Promise<{ id: string }>
}

export default function EditReportPage({ params }: EditReportPageProps) {
  const { id } = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [initialConfig, setInitialConfig] = useState<ReportConfig | null>(null)

  useEffect(() => {
    async function loadReport() {
      const result = await getReportById(id)
      if (result.success && result.data) {
        // Transform the report data back into ReportConfig format
        const config: ReportConfig = {
          name: result.data.name,
          description: result.data.description || '',
          object_type: result.data.object_type,
          report_type: result.data.report_type,
          columns: result.data.columns || [],
          filters: result.data.filters || [],
          groupings: result.data.groupings || [],
          aggregations: result.data.aggregations || [],
          chart_config: result.data.chart_config || {
            type: 'bar',
            showLegend: true,
            showGrid: true,
          },
          visibility: 'private', // Default, not stored in current schema
        }
        setInitialConfig(config)
      } else {
        setError('Report not found')
        setTimeout(() => router.push('/admin/reports'), 2000)
      }
      setLoading(false)
    }

    loadReport()
  }, [id, router])

  const handleSave = async (config: ReportConfig) => {
    setError(null)
    const result = await updateReport(id, config)

    if (result.success) {
      router.push(`/admin/reports/${id}`)
    } else {
      setError(result.error || 'Failed to update report')
      throw new Error(result.error || 'Failed to update report')
    }
  }

  const handleCancel = () => {
    router.push(`/admin/reports/${id}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/admin/reports/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Report</h1>
          <p className="text-muted-foreground">
            Modify your report configuration
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
      {initialConfig && (
        <ReportBuilderWizard
          initialConfig={initialConfig}
          onSave={handleSave}
          onCancel={handleCancel}
          isEdit
        />
      )}
    </div>
  )
}
