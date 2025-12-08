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
  GripVertical,
  Info,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { WidgetType } from '@/lib/supabase/types'

interface WidgetPaletteProps {
  onAddWidget: (type: WidgetType) => void
}

interface WidgetOption {
  type: WidgetType
  label: string
  description: string
  icon: React.ElementType
  defaultSize: string
}

const WIDGET_OPTIONS: WidgetOption[] = [
  {
    type: 'metric',
    label: 'Metric Card',
    description: 'Display a single KPI with optional trend',
    icon: Hash,
    defaultSize: '3x2',
  },
  {
    type: 'chart',
    label: 'Chart',
    description: 'Bar, line, pie, or donut chart',
    icon: BarChart3,
    defaultSize: '6x4',
  },
  {
    type: 'table',
    label: 'Data Table',
    description: 'Tabular data with sorting and pagination',
    icon: Table2,
    defaultSize: '8x5',
  },
  {
    type: 'list',
    label: 'List',
    description: 'Simple list of items with links',
    icon: List,
    defaultSize: '4x4',
  },
  {
    type: 'funnel',
    label: 'Funnel',
    description: 'Stage-based funnel visualization',
    icon: GitBranch,
    defaultSize: '6x4',
  },
  {
    type: 'gauge',
    label: 'Gauge',
    description: 'Progress gauge with min/max',
    icon: Gauge,
    defaultSize: '3x3',
  },
  {
    type: 'report',
    label: 'Report',
    description: 'Embed a saved report',
    icon: FileText,
    defaultSize: '6x4',
  },
  {
    type: 'calendar',
    label: 'Calendar',
    description: 'Calendar view of events',
    icon: Calendar,
    defaultSize: '8x5',
  },
]

export function WidgetPalette({ onAddWidget }: WidgetPaletteProps) {
  return (
    <div className="p-4 space-y-4">
      <div className="space-y-1">
        <h3 className="font-medium text-sm">Add Widgets</h3>
        <p className="text-xs text-muted-foreground">
          Click a widget type to add it to your dashboard
        </p>
      </div>

      <div className="grid gap-2">
        {WIDGET_OPTIONS.map(option => {
          const Icon = option.icon
          return (
            <Tooltip key={option.type}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onAddWidget(option.type)}
                  className={cn(
                    'flex items-center gap-3 w-full p-3 rounded-lg border bg-background',
                    'hover:border-primary hover:bg-primary/5 transition-colors',
                    'text-left group cursor-pointer'
                  )}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{option.label}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {option.defaultSize}
                    </div>
                  </div>
                  <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                <p className="font-medium">{option.label}</p>
                <p className="text-xs text-muted-foreground">
                  {option.description}
                </p>
              </TooltipContent>
            </Tooltip>
          )
        })}
      </div>

      {/* Help Section */}
      <Card className="bg-blue-50/50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900">
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-700 dark:text-blue-300">
              <p className="font-medium mb-1">Tips</p>
              <ul className="space-y-1 text-blue-600 dark:text-blue-400">
                <li>Click widgets to add them</li>
                <li>Drag to reposition on the grid</li>
                <li>Resize using corner handles</li>
                <li>Configure data sources in the panel</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
