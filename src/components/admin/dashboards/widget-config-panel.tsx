'use client'

import { X, Settings, Database, Palette } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import type { EditorWidget } from './dashboard-editor'
import type { Report, DataSource } from '@/lib/supabase/types'
import { WidgetDataSourcePicker } from './widget-data-source-picker'

interface WidgetConfigPanelProps {
  widget: EditorWidget
  availableReports: Report[]
  onUpdate: (updates: Partial<EditorWidget>) => void
  onClose: () => void
}

export function WidgetConfigPanel({
  widget,
  availableReports,
  onUpdate,
  onClose,
}: WidgetConfigPanelProps) {
  const handleConfigChange = (key: string, value: unknown) => {
    onUpdate({
      config: {
        ...widget.config,
        [key]: value,
      },
    })
  }

  const handleDataSourceChange = (
    dataSource: DataSource,
    reportId?: string,
    queryConfig?: Record<string, unknown>
  ) => {
    onUpdate({
      data_source: dataSource,
      report_id: reportId || null,
      query_config: queryConfig || {},
    })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h3 className="font-semibold">Widget Settings</h3>
          <p className="text-xs text-muted-foreground capitalize">
            {widget.widget_type} Widget
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="general" className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start rounded-none border-b px-4">
          <TabsTrigger value="general" className="text-xs">
            <Settings className="h-3 w-3 mr-1" />
            General
          </TabsTrigger>
          <TabsTrigger value="data" className="text-xs">
            <Database className="h-3 w-3 mr-1" />
            Data
          </TabsTrigger>
          <TabsTrigger value="style" className="text-xs">
            <Palette className="h-3 w-3 mr-1" />
            Style
          </TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent
          value="general"
          className="flex-1 overflow-y-auto p-4 space-y-4"
        >
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="widget-title">Title</Label>
            <Input
              id="widget-title"
              value={widget.title}
              onChange={e => onUpdate({ title: e.target.value })}
              placeholder="Widget title"
            />
          </div>

          {/* Size */}
          <div className="space-y-2">
            <Label>Size (columns x rows)</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">Width</Label>
                <Select
                  value={String(widget.grid_width)}
                  onValueChange={v => onUpdate({ grid_width: parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                      <SelectItem key={n} value={String(n)}>
                        {n} col{n > 1 ? 's' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Height</Label>
                <Select
                  value={String(widget.grid_height)}
                  onValueChange={v => onUpdate({ grid_height: parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                      <SelectItem key={n} value={String(n)}>
                        {n} row{n > 1 ? 's' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Widget-specific settings */}
          {renderWidgetSpecificSettings(widget, handleConfigChange)}
        </TabsContent>

        {/* Data Tab */}
        <TabsContent value="data" className="flex-1 overflow-y-auto p-4">
          <WidgetDataSourcePicker
            widgetType={widget.widget_type}
            dataSource={widget.data_source || 'query'}
            reportId={widget.report_id || undefined}
            queryConfig={widget.query_config}
            availableReports={availableReports}
            onChange={handleDataSourceChange}
          />
        </TabsContent>

        {/* Style Tab */}
        <TabsContent
          value="style"
          className="flex-1 overflow-y-auto p-4 space-y-4"
        >
          {renderStyleSettings(widget, handleConfigChange)}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function renderWidgetSpecificSettings(
  widget: EditorWidget,
  onChange: (key: string, value: unknown) => void
) {
  const config = widget.config as Record<string, unknown>

  switch (widget.widget_type) {
    case 'metric':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Number Format</Label>
            <Select
              value={(config.format as string) || 'number'}
              onValueChange={v => onChange('format', v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="currency">Currency</SelectItem>
                <SelectItem value="percent">Percentage</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="show-trend">Show Trend</Label>
            <Switch
              id="show-trend"
              checked={config.showTrend as boolean}
              onCheckedChange={v => onChange('showTrend', v)}
            />
          </div>
        </div>
      )

    case 'chart':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Chart Type</Label>
            <Select
              value={(config.chartType as string) || 'bar'}
              onValueChange={v => onChange('chartType', v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bar">Bar Chart</SelectItem>
                <SelectItem value="line">Line Chart</SelectItem>
                <SelectItem value="pie">Pie Chart</SelectItem>
                <SelectItem value="donut">Donut Chart</SelectItem>
                <SelectItem value="area">Area Chart</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="show-legend">Show Legend</Label>
            <Switch
              id="show-legend"
              checked={config.showLegend as boolean}
              onCheckedChange={v => onChange('showLegend', v)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="show-grid">Show Grid</Label>
            <Switch
              id="show-grid"
              checked={config.showGrid as boolean}
              onCheckedChange={v => onChange('showGrid', v)}
            />
          </div>
        </div>
      )

    case 'table':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Rows per Page</Label>
            <Select
              value={String(config.pageSize || 10)}
              onValueChange={v => onChange('pageSize', parseInt(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="show-pagination">Show Pagination</Label>
            <Switch
              id="show-pagination"
              checked={config.showPagination as boolean}
              onCheckedChange={v => onChange('showPagination', v)}
            />
          </div>
        </div>
      )

    case 'list':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Max Items</Label>
            <Select
              value={String(config.maxItems || 5)}
              onValueChange={v => onChange('maxItems', parseInt(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3</SelectItem>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="15">15</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )

    case 'funnel':
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="show-percentages">Show Percentages</Label>
            <Switch
              id="show-percentages"
              checked={config.showPercentages as boolean}
              onCheckedChange={v => onChange('showPercentages', v)}
            />
          </div>
        </div>
      )

    case 'gauge':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Min Value</Label>
            <Input
              type="number"
              value={(config.min as number) || 0}
              onChange={e => onChange('min', parseInt(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label>Max Value</Label>
            <Input
              type="number"
              value={(config.max as number) || 100}
              onChange={e => onChange('max', parseInt(e.target.value))}
            />
          </div>
        </div>
      )

    case 'calendar':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Default View</Label>
            <Select
              value={(config.view as string) || 'month'}
              onValueChange={v => onChange('view', v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="month">Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )

    default:
      return (
        <p className="text-sm text-muted-foreground">
          No additional settings for this widget type.
        </p>
      )
  }
}

function renderStyleSettings(
  widget: EditorWidget,
  onChange: (key: string, value: unknown) => void
) {
  const config = widget.config as Record<string, unknown>

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Style customization options for your widget.
      </p>

      {/* Color scheme - common for charts */}
      {(widget.widget_type === 'chart' || widget.widget_type === 'funnel') && (
        <div className="space-y-2">
          <Label>Color Scheme</Label>
          <Select
            value={(config.colorScheme as string) || 'default'}
            onValueChange={v => onChange('colorScheme', v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Brand (Default)</SelectItem>
              <SelectItem value="blue">Blue</SelectItem>
              <SelectItem value="green">Green</SelectItem>
              <SelectItem value="warm">Warm</SelectItem>
              <SelectItem value="cool">Cool</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Compact mode - common for metrics and lists */}
      {(widget.widget_type === 'metric' || widget.widget_type === 'list') && (
        <div className="flex items-center justify-between">
          <Label htmlFor="compact-mode">Compact Mode</Label>
          <Switch
            id="compact-mode"
            checked={config.compact as boolean}
            onCheckedChange={v => onChange('compact', v)}
          />
        </div>
      )}

      {/* Border style */}
      <div className="space-y-2">
        <Label>Border Style</Label>
        <Select
          value={(config.borderStyle as string) || 'default'}
          onValueChange={v => onChange('borderStyle', v)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Default</SelectItem>
            <SelectItem value="none">No Border</SelectItem>
            <SelectItem value="accent">Accent Border</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
