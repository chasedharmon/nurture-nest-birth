'use client'

import {
  Hash,
  BarChart3,
  Table2,
  FileText,
  List,
  GitBranch,
  Gauge,
  Calendar,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { DashboardWidget, WidgetType } from '@/lib/supabase/types'

// Grid constants (same as editor)
const GRID_COLS = 12
const CELL_HEIGHT = 60
const GAP = 8

interface DashboardViewerProps {
  widgets: DashboardWidget[]
}

const WIDGET_ICONS: Record<WidgetType, React.ElementType> = {
  metric: Hash,
  chart: BarChart3,
  table: Table2,
  report: FileText,
  list: List,
  funnel: GitBranch,
  gauge: Gauge,
  calendar: Calendar,
}

export function DashboardViewer({ widgets }: DashboardViewerProps) {
  if (widgets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed rounded-lg">
        <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No widgets yet</h3>
        <p className="text-sm text-muted-foreground">
          Edit this dashboard to add widgets and visualizations.
        </p>
      </div>
    )
  }

  // Calculate grid height based on widget positions
  const maxY = Math.max(...widgets.map(w => w.grid_y + w.grid_height), 4)
  const gridHeight = maxY * CELL_HEIGHT + (maxY - 1) * GAP

  return (
    <div
      className="relative grid gap-2"
      style={{
        gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
        gridAutoRows: CELL_HEIGHT,
        minHeight: gridHeight,
      }}
    >
      {widgets.map(widget => {
        const Icon = WIDGET_ICONS[widget.widget_type]

        return (
          <Card
            key={widget.id}
            style={{
              gridColumn: `${widget.grid_x + 1} / span ${widget.grid_width}`,
              gridRow: `${widget.grid_y + 1} / span ${widget.grid_height}`,
            }}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
                {widget.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-[calc(100%-3.5rem)]">
              {/* Widget content placeholder - will render actual data in future */}
              <WidgetContent widget={widget} />
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

function WidgetContent({ widget }: { widget: DashboardWidget }) {
  const config = widget.config as Record<string, unknown>
  const Icon = WIDGET_ICONS[widget.widget_type]

  // For now, show placeholder content
  // In future, this would fetch and render actual data based on data_source
  switch (widget.widget_type) {
    case 'metric':
      return (
        <div className="text-center">
          <div className="text-3xl font-bold">--</div>
          <div className="text-xs text-muted-foreground mt-1">
            {widget.data_source === 'static'
              ? 'Static value'
              : 'Loading data...'}
          </div>
        </div>
      )

    case 'chart':
      return (
        <div className="flex flex-col items-center text-muted-foreground">
          <BarChart3 className="h-12 w-12 mb-2" />
          <span className="text-xs">
            {(config.chartType as string) || 'Bar'} Chart
          </span>
        </div>
      )

    case 'table':
      return (
        <div className="flex flex-col items-center text-muted-foreground">
          <Table2 className="h-12 w-12 mb-2" />
          <span className="text-xs">Data Table</span>
        </div>
      )

    case 'list':
      return (
        <div className="flex flex-col items-center text-muted-foreground">
          <List className="h-12 w-12 mb-2" />
          <span className="text-xs">Item List</span>
        </div>
      )

    case 'funnel':
      return (
        <div className="flex flex-col items-center text-muted-foreground">
          <GitBranch className="h-12 w-12 mb-2" />
          <span className="text-xs">Funnel Chart</span>
        </div>
      )

    case 'gauge':
      return (
        <div className="flex flex-col items-center text-muted-foreground">
          <Gauge className="h-12 w-12 mb-2" />
          <span className="text-xs">
            {(config.min as number) || 0} - {(config.max as number) || 100}
          </span>
        </div>
      )

    case 'calendar':
      return (
        <div className="flex flex-col items-center text-muted-foreground">
          <Calendar className="h-12 w-12 mb-2" />
          <span className="text-xs">Calendar View</span>
        </div>
      )

    case 'report':
      return (
        <div className="flex flex-col items-center text-muted-foreground">
          <FileText className="h-12 w-12 mb-2" />
          <span className="text-xs">
            {widget.report_id ? 'Linked Report' : 'No report selected'}
          </span>
        </div>
      )

    default:
      return (
        <div className="flex flex-col items-center text-muted-foreground">
          <Icon className="h-12 w-12 mb-2" />
          <span className="text-xs">{widget.widget_type}</span>
        </div>
      )
  }
}
