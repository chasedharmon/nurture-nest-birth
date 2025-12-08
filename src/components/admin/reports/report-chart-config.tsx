'use client'

import { Info, BarChart3, PieChart, LineChart, AreaChart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import type {
  ChartConfig,
  ObjectType,
  AggregationConfig,
} from '@/lib/supabase/types'

interface ReportChartConfigProps {
  objectType: ObjectType
  groupings: string[]
  aggregations: AggregationConfig[]
  chartConfig: ChartConfig
  onChange: (config: ChartConfig) => void
}

const CHART_TYPES: {
  value: ChartConfig['type']
  label: string
  description: string
  icon: React.ElementType
  requirements: string
}[] = [
  {
    value: 'bar',
    label: 'Bar Chart',
    description: 'Compare values across categories',
    icon: BarChart3,
    requirements: 'Requires at least one grouping',
  },
  {
    value: 'line',
    label: 'Line Chart',
    description: 'Show trends over time',
    icon: LineChart,
    requirements: 'Best with date groupings',
  },
  {
    value: 'area',
    label: 'Area Chart',
    description: 'Show cumulative values over time',
    icon: AreaChart,
    requirements: 'Best with date groupings',
  },
  {
    value: 'pie',
    label: 'Pie Chart',
    description: 'Show proportions of a whole',
    icon: PieChart,
    requirements: 'Best with categorical groupings',
  },
  {
    value: 'donut',
    label: 'Donut Chart',
    description: 'Pie chart with center cutout',
    icon: PieChart,
    requirements: 'Best with categorical groupings',
  },
]

const COLOR_SCHEMES = [
  { value: 'default', label: 'Default (Blue)' },
  { value: 'purple', label: 'Purple' },
  { value: 'green', label: 'Green' },
  { value: 'orange', label: 'Orange' },
  { value: 'rainbow', label: 'Rainbow (multi-color)' },
]

// Map groupable fields to labels
const GROUPABLE_FIELD_LABELS: Record<string, string> = {
  status: 'Status',
  source: 'Source',
  lifecycle_stage: 'Lifecycle Stage',
  client_type: 'Client Type',
  created_at: 'Created Date',
  expected_due_date: 'Due Date',
  journey_phase: 'Journey Phase',
  issue_date: 'Issue Date',
  due_date: 'Due Date',
  meeting_type: 'Meeting Type',
  scheduled_at: 'Scheduled Date',
  role: 'Role',
  is_active: 'Active Status',
  is_accepting_clients: 'Accepting Clients',
  payment_method: 'Payment Method',
  payment_date: 'Payment Date',
  service_type: 'Service Type',
  start_date: 'Start Date',
}

export function ReportChartConfig({
  objectType: _objectType,
  groupings,
  aggregations,
  chartConfig,
  onChange,
}: ReportChartConfigProps) {
  // _objectType reserved for future: show object-specific chart recommendations
  const hasGroupings = groupings.length > 0
  const hasAggregations = aggregations.length > 0

  const updateConfig = (updates: Partial<ChartConfig>) => {
    onChange({ ...chartConfig, ...updates })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Chart Configuration</h3>
          <p className="text-sm text-muted-foreground">
            Choose how to visualize your data
          </p>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon">
                <Info className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>
                Charts need groupings (X-axis) and aggregations (Y-axis) to
                display data. Make sure you&apos;ve configured these in previous
                steps.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Requirements check */}
      {(!hasGroupings || !hasAggregations) && (
        <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4">
          <h4 className="font-medium text-yellow-700 dark:text-yellow-400 mb-2">
            Missing Requirements
          </h4>
          <ul className="text-sm text-yellow-600 dark:text-yellow-300 space-y-1">
            {!hasGroupings && (
              <li>• Add at least one grouping (Step 4) for the X-axis</li>
            )}
            {!hasAggregations && (
              <li>• Add at least one aggregation (Step 5) for the Y-axis</li>
            )}
          </ul>
        </div>
      )}

      {/* Chart Type Selection */}
      <div className="space-y-4">
        <Label className="text-base">Chart Type</Label>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CHART_TYPES.map(chart => {
            const Icon = chart.icon
            const isSelected = chartConfig.type === chart.value

            return (
              <Card
                key={chart.value}
                className={cn(
                  'cursor-pointer transition-all hover:border-primary/50',
                  isSelected && 'border-primary ring-2 ring-primary/20'
                )}
                onClick={() => updateConfig({ type: chart.value })}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-lg',
                        isSelected
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{chart.label}</CardTitle>
                      <CardDescription className="text-xs">
                        {chart.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Data Mapping */}
      <div className="grid gap-6 sm:grid-cols-2">
        {/* X-Axis (Category) */}
        <div className="space-y-2">
          <Label>X-Axis (Category)</Label>
          <Select
            value={chartConfig.xAxis || groupings[0] || ''}
            onValueChange={value => updateConfig({ xAxis: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select grouping..." />
            </SelectTrigger>
            <SelectContent>
              {groupings.map(field => (
                <SelectItem key={field} value={field}>
                  {GROUPABLE_FIELD_LABELS[field] || field}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Categories along the bottom of the chart
          </p>
        </div>

        {/* Y-Axis (Value) */}
        <div className="space-y-2">
          <Label>Y-Axis (Value)</Label>
          <Select
            value={chartConfig.yAxis || aggregations[0]?.id || ''}
            onValueChange={value => updateConfig({ yAxis: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select aggregation..." />
            </SelectTrigger>
            <SelectContent>
              {aggregations.map(agg => (
                <SelectItem key={agg.id} value={agg.id}>
                  {agg.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Values displayed on the chart
          </p>
        </div>
      </div>

      {/* Chart Options */}
      <div className="space-y-4">
        <Label className="text-base">Display Options</Label>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Chart Title */}
          <div className="space-y-2">
            <Label className="text-sm">Chart Title</Label>
            <Input
              value={chartConfig.title || ''}
              onChange={e => updateConfig({ title: e.target.value })}
              placeholder="Enter chart title..."
            />
          </div>

          {/* Color Scheme */}
          <div className="space-y-2">
            <Label className="text-sm">Color Scheme</Label>
            <Select
              value={chartConfig.colorScheme || 'default'}
              onValueChange={value => updateConfig({ colorScheme: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COLOR_SCHEMES.map(scheme => (
                  <SelectItem key={scheme.value} value={scheme.value}>
                    {scheme.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Toggle options */}
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label className="text-sm font-medium">Show Legend</Label>
              <p className="text-xs text-muted-foreground">
                Display a legend explaining the chart colors
              </p>
            </div>
            <Switch
              checked={chartConfig.showLegend !== false}
              onCheckedChange={checked => updateConfig({ showLegend: checked })}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label className="text-sm font-medium">Show Data Labels</Label>
              <p className="text-xs text-muted-foreground">
                Display values directly on the chart
              </p>
            </div>
            <Switch
              checked={chartConfig.showDataLabels === true}
              onCheckedChange={checked =>
                updateConfig({ showDataLabels: checked })
              }
            />
          </div>

          {['bar', 'line', 'area'].includes(chartConfig.type) && (
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label className="text-sm font-medium">Show Grid Lines</Label>
                <p className="text-xs text-muted-foreground">
                  Display grid lines behind the chart
                </p>
              </div>
              <Switch
                checked={chartConfig.showGrid !== false}
                onCheckedChange={checked => updateConfig({ showGrid: checked })}
              />
            </div>
          )}

          {chartConfig.type === 'bar' && (
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label className="text-sm font-medium">Horizontal Bars</Label>
                <p className="text-xs text-muted-foreground">
                  Display bars horizontally instead of vertically
                </p>
              </div>
              <Switch
                checked={chartConfig.horizontal === true}
                onCheckedChange={checked =>
                  updateConfig({ horizontal: checked })
                }
              />
            </div>
          )}

          {chartConfig.type === 'bar' && (
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label className="text-sm font-medium">Stacked Bars</Label>
                <p className="text-xs text-muted-foreground">
                  Stack multiple series on top of each other
                </p>
              </div>
              <Switch
                checked={chartConfig.stacked === true}
                onCheckedChange={checked => updateConfig({ stacked: checked })}
              />
            </div>
          )}
        </div>
      </div>

      {/* Preview hint */}
      <div className="rounded-lg bg-muted/50 p-4">
        <h4 className="text-sm font-medium mb-2">Chart Summary</h4>
        <p className="text-sm text-muted-foreground">
          {chartConfig.title || 'Untitled chart'}:{' '}
          <span className="font-medium">
            {CHART_TYPES.find(t => t.value === chartConfig.type)?.label}
          </span>{' '}
          showing{' '}
          <span className="font-medium">
            {aggregations.find(a => a.id === chartConfig.yAxis)?.label ||
              aggregations[0]?.label ||
              'values'}
          </span>{' '}
          by{' '}
          <span className="font-medium">
            {(() => {
              const key = chartConfig.xAxis || groupings[0]
              return key ? GROUPABLE_FIELD_LABELS[key] || key : 'category'
            })()}
          </span>
        </p>
      </div>
    </div>
  )
}
