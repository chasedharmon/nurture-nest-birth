'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect, use } from 'react'
import { notFound } from 'next/navigation'
import {
  DashboardEditor,
  type EditorWidget,
  type DashboardConfig,
} from '@/components/admin/dashboards'
import {
  getDashboardById,
  updateDashboardWithWidgets,
  getAvailableReports,
} from '@/app/actions/dashboards'
import type {
  Report,
  Dashboard,
  DashboardWidget,
  WidgetPosition,
} from '@/lib/supabase/types'

interface EditDashboardPageProps {
  params: Promise<{ id: string }>
}

export default function EditDashboardPage({ params }: EditDashboardPageProps) {
  const { id } = use(params)
  const router = useRouter()
  const [dashboard, setDashboard] = useState<
    (Dashboard & { widgets?: DashboardWidget[] }) | null
  >(null)
  const [reports, setReports] = useState<Report[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [notFoundState, setNotFoundState] = useState(false)

  useEffect(() => {
    async function loadData() {
      const [dashboardResult, reportsResult] = await Promise.all([
        getDashboardById(id),
        getAvailableReports(),
      ])

      if (!dashboardResult.success || !dashboardResult.data) {
        setNotFoundState(true)
        return
      }

      setDashboard(dashboardResult.data)
      if (reportsResult.success) {
        setReports(reportsResult.data)
      }
      setIsLoading(false)
    }
    loadData()
  }, [id])

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

    const result = await updateDashboardWithWidgets(
      id,
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

    if (result.success) {
      router.push(`/admin/dashboards/${id}`)
    } else {
      throw new Error(result.error || 'Failed to update dashboard')
    }
  }

  const handleCancel = () => {
    router.push(`/admin/dashboards/${id}`)
  }

  if (notFoundState) {
    notFound()
  }

  if (isLoading || !dashboard) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse text-muted-foreground">
          Loading dashboard...
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-4rem)]">
      <DashboardEditor
        initialDashboard={dashboard}
        availableReports={reports}
        onSave={handleSave}
        onCancel={handleCancel}
        isEdit
      />
    </div>
  )
}
