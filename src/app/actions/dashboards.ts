'use server'

import { createClient } from '@/lib/supabase/server'
import type {
  Dashboard,
  DashboardInsert,
  DashboardWidget,
  DashboardWidgetInsert,
  Report,
} from '@/lib/supabase/types'

// ============================================================================
// DASHBOARD CRUD OPERATIONS
// ============================================================================

export async function createDashboard(
  dashboard: Omit<DashboardInsert, 'created_by'>
): Promise<{
  success: boolean
  data: Dashboard | null
  error?: string
}> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, data: null, error: 'Not authenticated' }
  }

  try {
    const { data, error } = await supabase
      .from('dashboards')
      .insert({
        ...dashboard,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) throw error

    return { success: true, data: data as Dashboard }
  } catch (error) {
    return {
      success: false,
      data: null,
      error:
        error instanceof Error ? error.message : 'Failed to create dashboard',
    }
  }
}

export async function updateDashboard(
  id: string,
  updates: Partial<Omit<Dashboard, 'id' | 'created_at' | 'created_by'>>
): Promise<{
  success: boolean
  data: Dashboard | null
  error?: string
}> {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('dashboards')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return { success: true, data: data as Dashboard }
  } catch (error) {
    return {
      success: false,
      data: null,
      error:
        error instanceof Error ? error.message : 'Failed to update dashboard',
    }
  }
}

export async function deleteDashboard(id: string): Promise<{
  success: boolean
  error?: string
}> {
  const supabase = await createClient()

  try {
    const { error } = await supabase.from('dashboards').delete().eq('id', id)

    if (error) throw error

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to delete dashboard',
    }
  }
}

export async function getDashboardById(id: string): Promise<{
  success: boolean
  data: (Dashboard & { widgets: DashboardWidget[] }) | null
  error?: string
}> {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('dashboards')
      .select(
        `
        *,
        widgets:dashboard_widgets(*)
      `
      )
      .eq('id', id)
      .single()

    if (error) throw error

    return {
      success: true,
      data: data as Dashboard & { widgets: DashboardWidget[] },
    }
  } catch (error) {
    return {
      success: false,
      data: null,
      error:
        error instanceof Error ? error.message : 'Failed to fetch dashboard',
    }
  }
}

export async function listDashboards(): Promise<{
  success: boolean
  data: (Dashboard & { widget_count: number })[]
  error?: string
}> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, data: [], error: 'Not authenticated' }
  }

  try {
    // Get dashboards that are org-wide, shared, or owned by user
    const { data, error } = await supabase
      .from('dashboards')
      .select(
        `
        *,
        dashboard_widgets(count)
      `
      )
      .or(`visibility.eq.org,visibility.eq.shared,created_by.eq.${user.id}`)
      .order('updated_at', { ascending: false })

    if (error) throw error

    // Transform to include widget_count
    const dashboardsWithCount = (data || []).map(d => {
      const widgetCount = Array.isArray(d.dashboard_widgets)
        ? d.dashboard_widgets.length
        : (d.dashboard_widgets as { count: number })?.count || 0
      return {
        ...d,
        widget_count: widgetCount,
        dashboard_widgets: undefined,
      } as Dashboard & { widget_count: number }
    })

    return { success: true, data: dashboardsWithCount }
  } catch (error) {
    return {
      success: false,
      data: [],
      error:
        error instanceof Error ? error.message : 'Failed to fetch dashboards',
    }
  }
}

// ============================================================================
// WIDGET CRUD OPERATIONS
// ============================================================================

export async function createWidget(widget: DashboardWidgetInsert): Promise<{
  success: boolean
  data: DashboardWidget | null
  error?: string
}> {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('dashboard_widgets')
      .insert(widget)
      .select()
      .single()

    if (error) throw error

    return { success: true, data: data as DashboardWidget }
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Failed to create widget',
    }
  }
}

export async function updateWidget(
  id: string,
  updates: Partial<Omit<DashboardWidget, 'id' | 'created_at' | 'dashboard_id'>>
): Promise<{
  success: boolean
  data: DashboardWidget | null
  error?: string
}> {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('dashboard_widgets')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return { success: true, data: data as DashboardWidget }
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Failed to update widget',
    }
  }
}

export async function deleteWidget(id: string): Promise<{
  success: boolean
  error?: string
}> {
  const supabase = await createClient()

  try {
    const { error } = await supabase
      .from('dashboard_widgets')
      .delete()
      .eq('id', id)

    if (error) throw error

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete widget',
    }
  }
}

export async function updateWidgetPositions(
  widgets: {
    id: string
    grid_x: number
    grid_y: number
    grid_width: number
    grid_height: number
  }[]
): Promise<{
  success: boolean
  error?: string
}> {
  const supabase = await createClient()

  try {
    // Update each widget position
    for (const widget of widgets) {
      const { error } = await supabase
        .from('dashboard_widgets')
        .update({
          grid_x: widget.grid_x,
          grid_y: widget.grid_y,
          grid_width: widget.grid_width,
          grid_height: widget.grid_height,
          updated_at: new Date().toISOString(),
        })
        .eq('id', widget.id)

      if (error) throw error
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to update widget positions',
    }
  }
}

// ============================================================================
// BULK OPERATIONS (for saving entire dashboard with widgets)
// ============================================================================

export async function saveDashboardWithWidgets(
  dashboardData: Omit<DashboardInsert, 'created_by'>,
  widgets: Omit<DashboardWidgetInsert, 'dashboard_id'>[]
): Promise<{
  success: boolean
  data: Dashboard | null
  error?: string
}> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, data: null, error: 'Not authenticated' }
  }

  try {
    // Create dashboard
    const { data: dashboard, error: dashboardError } = await supabase
      .from('dashboards')
      .insert({
        ...dashboardData,
        created_by: user.id,
      })
      .select()
      .single()

    if (dashboardError) throw dashboardError

    // Create widgets if any
    if (widgets.length > 0) {
      const widgetsWithDashboardId = widgets.map(w => ({
        ...w,
        dashboard_id: dashboard.id,
      }))

      const { error: widgetError } = await supabase
        .from('dashboard_widgets')
        .insert(widgetsWithDashboardId)

      if (widgetError) throw widgetError
    }

    return { success: true, data: dashboard as Dashboard }
  } catch (error) {
    return {
      success: false,
      data: null,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to save dashboard with widgets',
    }
  }
}

export async function updateDashboardWithWidgets(
  dashboardId: string,
  dashboardUpdates: Partial<
    Omit<Dashboard, 'id' | 'created_at' | 'created_by'>
  >,
  widgets: (Omit<DashboardWidgetInsert, 'dashboard_id'> & { id?: string })[]
): Promise<{
  success: boolean
  data: Dashboard | null
  error?: string
}> {
  const supabase = await createClient()

  try {
    // Update dashboard
    const { data: dashboard, error: dashboardError } = await supabase
      .from('dashboards')
      .update({
        ...dashboardUpdates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', dashboardId)
      .select()
      .single()

    if (dashboardError) throw dashboardError

    // Delete existing widgets
    const { error: deleteError } = await supabase
      .from('dashboard_widgets')
      .delete()
      .eq('dashboard_id', dashboardId)

    if (deleteError) throw deleteError

    // Create new widgets if any
    if (widgets.length > 0) {
      const widgetsToInsert = widgets.map(w => ({
        ...w,
        id: undefined, // Let DB generate new IDs
        dashboard_id: dashboardId,
      }))

      const { error: widgetError } = await supabase
        .from('dashboard_widgets')
        .insert(widgetsToInsert)

      if (widgetError) throw widgetError
    }

    return { success: true, data: dashboard as Dashboard }
  } catch (error) {
    return {
      success: false,
      data: null,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to update dashboard with widgets',
    }
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export async function getAvailableReports(): Promise<{
  success: boolean
  data: Report[]
  error?: string
}> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, data: [], error: 'Not authenticated' }
  }

  try {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .or(`visibility.eq.org,visibility.eq.shared,created_by.eq.${user.id}`)
      .order('name')

    if (error) throw error

    return { success: true, data: (data || []) as Report[] }
  } catch (error) {
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : 'Failed to fetch reports',
    }
  }
}

export async function setDefaultDashboard(dashboardId: string): Promise<{
  success: boolean
  error?: string
}> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  try {
    // First, unset any existing default
    await supabase
      .from('dashboards')
      .update({ is_default: false })
      .eq('created_by', user.id)
      .eq('is_default', true)

    // Then set the new default
    const { error } = await supabase
      .from('dashboards')
      .update({ is_default: true })
      .eq('id', dashboardId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to set default dashboard',
    }
  }
}
