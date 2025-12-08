'use client'

import { useState, useCallback } from 'react'
import { Eye, Edit2, Save, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type {
  Dashboard,
  DashboardWidget,
  WidgetType,
  ViewVisibility,
  Report,
} from '@/lib/supabase/types'
import { WidgetPalette } from './widget-palette'
import { WidgetGridEditor } from './widget-grid-editor'
import { WidgetConfigPanel } from './widget-config-panel'
import { DashboardSaveDialog } from './dashboard-save-dialog'

export interface EditorWidget extends Omit<
  DashboardWidget,
  'id' | 'dashboard_id' | 'created_at' | 'updated_at'
> {
  id: string // Can be temporary ID for new widgets
  isNew?: boolean
}

export interface DashboardConfig {
  name: string
  description: string
  visibility: ViewVisibility
  is_default: boolean
  auto_refresh_seconds: number
}

interface DashboardEditorProps {
  initialDashboard?: Dashboard & { widgets?: DashboardWidget[] }
  availableReports: Report[]
  onSave: (config: DashboardConfig, widgets: EditorWidget[]) => Promise<void>
  onCancel: () => void
  isEdit?: boolean
}

const DEFAULT_CONFIG: DashboardConfig = {
  name: '',
  description: '',
  visibility: 'private',
  is_default: false,
  auto_refresh_seconds: 0,
}

export function DashboardEditor({
  initialDashboard,
  availableReports,
  onSave,
  onCancel,
  isEdit = false,
}: DashboardEditorProps) {
  const [mode, setMode] = useState<'edit' | 'preview'>('edit')

  const [config, _setConfig] = useState<DashboardConfig>(
    initialDashboard
      ? {
          name: initialDashboard.name,
          description: initialDashboard.description || '',
          visibility: initialDashboard.visibility,
          is_default: initialDashboard.is_default,
          auto_refresh_seconds: initialDashboard.auto_refresh_seconds,
        }
      : DEFAULT_CONFIG
  )
  const [widgets, setWidgets] = useState<EditorWidget[]>(
    initialDashboard?.widgets?.map(w => ({
      ...w,
      isNew: false,
    })) || []
  )
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null)
  const [isDirty, setIsDirty] = useState(false)

  const selectedWidget = widgets.find(w => w.id === selectedWidgetId)

  const handleAddWidget = useCallback(
    (type: WidgetType) => {
      const newWidget: EditorWidget = {
        id: `temp-${Date.now()}`,
        widget_type: type,
        title: getDefaultWidgetTitle(type),
        config: getDefaultWidgetConfig(type),
        grid_x: 0,
        grid_y: getNextWidgetY(widgets),
        grid_width: getDefaultWidgetWidth(type),
        grid_height: getDefaultWidgetHeight(type),
        data_source: 'query',
        report_id: null,
        query_config: {},
        isNew: true,
      }

      setWidgets(prev => [...prev, newWidget])
      setSelectedWidgetId(newWidget.id)
      setIsDirty(true)
    },
    [widgets]
  )

  const handleUpdateWidget = useCallback(
    (id: string, updates: Partial<EditorWidget>) => {
      setWidgets(prev =>
        prev.map(w => (w.id === id ? { ...w, ...updates } : w))
      )
      setIsDirty(true)
    },
    []
  )

  const handleDeleteWidget = useCallback(
    (id: string) => {
      setWidgets(prev => prev.filter(w => w.id !== id))
      if (selectedWidgetId === id) {
        setSelectedWidgetId(null)
      }
      setIsDirty(true)
    },
    [selectedWidgetId]
  )

  const handleDuplicateWidget = useCallback(
    (id: string) => {
      const widget = widgets.find(w => w.id === id)
      if (!widget) return

      const newWidget: EditorWidget = {
        ...widget,
        id: `temp-${Date.now()}`,
        title: `${widget.title} (Copy)`,
        grid_y: getNextWidgetY(widgets),
        isNew: true,
      }

      setWidgets(prev => [...prev, newWidget])
      setSelectedWidgetId(newWidget.id)
      setIsDirty(true)
    },
    [widgets]
  )

  const handleWidgetPositionChange = useCallback(
    (
      id: string,
      position: {
        grid_x: number
        grid_y: number
        grid_width: number
        grid_height: number
      }
    ) => {
      handleUpdateWidget(id, position)
    },
    [handleUpdateWidget]
  )

  const handleSave = async (saveData: {
    name: string
    description: string
    visibility: ViewVisibility
  }) => {
    const finalConfig: DashboardConfig = {
      ...config,
      ...saveData,
    }
    await onSave(finalConfig, widgets)
  }

  const widgetCount = widgets.length

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3 bg-background">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold">
              {isEdit ? 'Edit Dashboard' : 'New Dashboard'}
            </h1>
            {isDirty && (
              <Badge variant="secondary" className="text-xs">
                Unsaved changes
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Mode Toggle */}
            <div className="flex items-center rounded-lg border p-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={mode === 'edit' ? 'secondary' : 'ghost'}
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => setMode('edit')}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Edit Mode</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={mode === 'preview' ? 'secondary' : 'ghost'}
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => setMode('preview')}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Preview Mode</TooltipContent>
              </Tooltip>
            </div>

            {/* Widget Count */}
            <Badge variant="outline" className="text-xs">
              {widgetCount} widget{widgetCount !== 1 ? 's' : ''}
            </Badge>

            {/* Actions */}
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="mr-1 h-4 w-4" />
              Cancel
            </Button>

            <DashboardSaveDialog
              onSave={handleSave}
              initialName={config.name}
              initialDescription={config.description}
              initialVisibility={config.visibility}
              isEdit={isEdit}
              trigger={
                <Button size="sm">
                  <Save className="mr-1 h-4 w-4" />
                  {isEdit ? 'Update' : 'Save'}
                </Button>
              }
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar - Widget Palette (only in edit mode) */}
          {mode === 'edit' && (
            <div className="w-64 border-r bg-muted/30 overflow-y-auto">
              <WidgetPalette onAddWidget={handleAddWidget} />
            </div>
          )}

          {/* Center - Grid Editor */}
          <div
            className={cn(
              'flex-1 overflow-auto p-4 bg-muted/10',
              mode === 'preview' && 'px-6'
            )}
          >
            <WidgetGridEditor
              widgets={widgets}
              selectedWidgetId={selectedWidgetId}
              onSelectWidget={setSelectedWidgetId}
              onUpdatePosition={handleWidgetPositionChange}
              onDeleteWidget={handleDeleteWidget}
              onDuplicateWidget={handleDuplicateWidget}
              isPreview={mode === 'preview'}
              availableReports={availableReports}
            />
          </div>

          {/* Right Sidebar - Config Panel (only in edit mode when widget selected) */}
          {mode === 'edit' && selectedWidget && (
            <div className="w-80 border-l bg-background overflow-y-auto">
              <WidgetConfigPanel
                widget={selectedWidget}
                availableReports={availableReports}
                onUpdate={updates =>
                  handleUpdateWidget(selectedWidget.id, updates)
                }
                onClose={() => setSelectedWidgetId(null)}
              />
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}

// Helper functions
function getDefaultWidgetTitle(type: WidgetType): string {
  const titles: Record<WidgetType, string> = {
    metric: 'Metric',
    chart: 'Chart',
    table: 'Table',
    report: 'Report',
    list: 'List',
    funnel: 'Funnel',
    gauge: 'Gauge',
    calendar: 'Calendar',
  }
  return titles[type] || 'Widget'
}

function getDefaultWidgetConfig(type: WidgetType): Record<string, unknown> {
  switch (type) {
    case 'metric':
      return { format: 'number', showTrend: false }
    case 'chart':
      return { chartType: 'bar', showLegend: true, showGrid: true }
    case 'table':
      return { pageSize: 10, showPagination: true }
    case 'list':
      return { maxItems: 5 }
    case 'funnel':
      return { showPercentages: true }
    case 'gauge':
      return { min: 0, max: 100 }
    case 'calendar':
      return { view: 'month' }
    default:
      return {}
  }
}

function getDefaultWidgetWidth(type: WidgetType): number {
  switch (type) {
    case 'metric':
    case 'gauge':
      return 3
    case 'chart':
    case 'funnel':
      return 6
    case 'table':
    case 'calendar':
      return 8
    case 'list':
      return 4
    default:
      return 4
  }
}

function getDefaultWidgetHeight(type: WidgetType): number {
  switch (type) {
    case 'metric':
      return 2
    case 'gauge':
      return 3
    case 'chart':
    case 'funnel':
      return 4
    case 'table':
    case 'calendar':
      return 5
    case 'list':
      return 4
    default:
      return 3
  }
}

function getNextWidgetY(widgets: EditorWidget[]): number {
  if (widgets.length === 0) return 0
  return Math.max(...widgets.map(w => w.grid_y + w.grid_height))
}
