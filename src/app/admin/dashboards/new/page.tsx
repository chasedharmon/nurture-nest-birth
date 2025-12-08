'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  DashboardEditor,
  type EditorWidget,
  type DashboardConfig,
} from '@/components/admin/dashboards'
import {
  saveDashboardWithWidgets,
  getAvailableReports,
} from '@/app/actions/dashboards'
import type { Report, WidgetPosition } from '@/lib/supabase/types'
import { useEffect } from 'react'

export default function NewDashboardPage() {
  const router = useRouter()
  const [reports, setReports] = useState<Report[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadReports() {
      const result = await getAvailableReports()
      if (result.success) {
        setReports(result.data)
      }
      setIsLoading(false)
    }
    loadReports()
  }, [])

  const handleSave = async (
    config: DashboardConfig,
    widgets: EditorWidget[]
  ) => {
    // Build layout from widget positions
    const layout: WidgetPosition[] = widgets.map(w => ({
      widget_id: w.id,
      x: w.grid_x,
      y: w.grid_y,
      width: w.grid_width,
      height: w.grid_height,
    }))

    const result = await saveDashboardWithWidgets(
      {
        name: config.name,
        description: config.description,
        visibility: config.visibility,
        is_default: config.is_default,
        auto_refresh_seconds: config.auto_refresh_seconds,
        layout,
      },
      widgets.map(w => ({
        widget_type: w.widget_type,
        title: w.title,
        config: w.config,
        grid_x: w.grid_x,
        grid_y: w.grid_y,
        grid_width: w.grid_width,
        grid_height: w.grid_height,
        data_source: w.data_source,
        report_id: w.report_id,
        query_config: w.query_config,
      }))
    )

    if (result.success && result.data) {
      router.push(`/admin/dashboards/${result.data.id}`)
    } else {
      throw new Error(result.error || 'Failed to save dashboard')
    }
  }

  const handleCancel = () => {
    router.push('/admin/dashboards')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-4rem)]">
      <DashboardEditor
        availableReports={reports}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </div>
  )
}
