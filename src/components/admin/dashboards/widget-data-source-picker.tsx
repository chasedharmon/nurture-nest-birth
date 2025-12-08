'use client'

import { FileText, Database, Hash, Info } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type {
  Report,
  DataSource,
  WidgetType,
  ObjectType,
} from '@/lib/supabase/types'

interface WidgetDataSourcePickerProps {
  widgetType: WidgetType
  dataSource: DataSource
  reportId?: string
  queryConfig: Record<string, unknown>
  availableReports: Report[]
  onChange: (
    dataSource: DataSource,
    reportId?: string,
    queryConfig?: Record<string, unknown>
  ) => void
}

const DATA_SOURCE_OPTIONS: {
  value: DataSource
  label: string
  description: string
  icon: React.ElementType
}[] = [
  {
    value: 'report',
    label: 'Saved Report',
    description: 'Use data from an existing report',
    icon: FileText,
  },
  {
    value: 'query',
    label: 'Custom Query',
    description: 'Configure a specific data query',
    icon: Database,
  },
  {
    value: 'static',
    label: 'Static Value',
    description: 'Enter a fixed value manually',
    icon: Hash,
  },
]

const OBJECT_TYPE_OPTIONS: { value: ObjectType; label: string }[] = [
  { value: 'leads', label: 'Leads' },
  { value: 'clients', label: 'Clients' },
  { value: 'invoices', label: 'Invoices' },
  { value: 'meetings', label: 'Meetings' },
  { value: 'payments', label: 'Payments' },
  { value: 'services', label: 'Services' },
  { value: 'team_members', label: 'Team Members' },
]

const AGGREGATION_OPTIONS = [
  { value: 'count', label: 'Count' },
  { value: 'sum', label: 'Sum' },
  { value: 'avg', label: 'Average' },
  { value: 'min', label: 'Minimum' },
  { value: 'max', label: 'Maximum' },
]

export function WidgetDataSourcePicker({
  widgetType,
  dataSource,
  reportId,
  queryConfig,
  availableReports,
  onChange,
}: WidgetDataSourcePickerProps) {
  const handleDataSourceChange = (value: DataSource) => {
    onChange(value, value === 'report' ? reportId : undefined, {})
  }

  const handleReportChange = (value: string) => {
    onChange('report', value, {})
  }

  const handleQueryConfigChange = (updates: Record<string, unknown>) => {
    onChange(dataSource, reportId, { ...queryConfig, ...updates })
  }

  // Filter reports based on widget type compatibility
  const compatibleReports = availableReports.filter(report => {
    // All reports work for table widgets
    if (widgetType === 'table' || widgetType === 'report') return true

    // Chart/funnel widgets need reports with groupings or aggregations
    if (widgetType === 'chart' || widgetType === 'funnel') {
      return report.groupings.length > 0 || report.aggregations.length > 0
    }

    // Metric widgets work best with reports that have aggregations
    if (widgetType === 'metric' || widgetType === 'gauge') {
      return report.aggregations.length > 0
    }

    // List widgets can use any report
    return true
  })

  return (
    <div className="space-y-4">
      {/* Data Source Selection */}
      <div className="space-y-3">
        <Label>Data Source</Label>
        <RadioGroup
          value={dataSource}
          onValueChange={(val: DataSource) => handleDataSourceChange(val)}
          className="space-y-2"
        >
          {DATA_SOURCE_OPTIONS.map(option => {
            const Icon = option.icon
            return (
              <div
                key={option.value}
                className={cn(
                  'flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors',
                  dataSource === option.value && 'border-primary bg-primary/5'
                )}
                onClick={() => handleDataSourceChange(option.value)}
              >
                <RadioGroupItem value={option.value} id={option.value} />
                <Icon className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <Label
                    htmlFor={option.value}
                    className="cursor-pointer font-medium"
                  >
                    {option.label}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {option.description}
                  </p>
                </div>
              </div>
            )
          })}
        </RadioGroup>
      </div>

      {/* Report Selection */}
      {dataSource === 'report' && (
        <div className="space-y-2">
          <Label>Select Report</Label>
          {compatibleReports.length > 0 ? (
            <Select value={reportId} onValueChange={handleReportChange}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a report..." />
              </SelectTrigger>
              <SelectContent>
                {compatibleReports.map(report => (
                  <SelectItem key={report.id} value={report.id}>
                    <div className="flex flex-col">
                      <span>{report.name}</span>
                      <span className="text-xs text-muted-foreground capitalize">
                        {report.object_type.replace('_', ' ')} -{' '}
                        {report.report_type}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-4 text-center">
                <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  No compatible reports found.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Create a report in the Report Builder first.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Custom Query Configuration */}
      {dataSource === 'query' && (
        <div className="space-y-4">
          {/* Object Type */}
          <div className="space-y-2">
            <Label>Data Object</Label>
            <Select
              value={(queryConfig.objectType as string) || 'leads'}
              onValueChange={v => handleQueryConfigChange({ objectType: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OBJECT_TYPE_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Aggregation (for metric/gauge widgets) */}
          {(widgetType === 'metric' || widgetType === 'gauge') && (
            <>
              <div className="space-y-2">
                <Label>Aggregation</Label>
                <Select
                  value={(queryConfig.aggregation as string) || 'count'}
                  onValueChange={v =>
                    handleQueryConfigChange({ aggregation: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AGGREGATION_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Field for non-count aggregations */}
              {queryConfig.aggregation &&
                queryConfig.aggregation !== 'count' && (
                  <div className="space-y-2">
                    <Label>Field</Label>
                    <Select
                      value={(queryConfig.field as string) || ''}
                      onValueChange={v => handleQueryConfigChange({ field: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select field..." />
                      </SelectTrigger>
                      <SelectContent>
                        {getNumericFields(
                          queryConfig.objectType as ObjectType
                        ).map(field => (
                          <SelectItem key={field.value} value={field.value}>
                            {field.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
            </>
          )}

          {/* Group By (for chart/funnel widgets) */}
          {(widgetType === 'chart' ||
            widgetType === 'funnel' ||
            widgetType === 'list') && (
            <div className="space-y-2">
              <Label>Group By</Label>
              <Select
                value={(queryConfig.groupBy as string) || ''}
                onValueChange={v => handleQueryConfigChange({ groupBy: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select field..." />
                </SelectTrigger>
                <SelectContent>
                  {getGroupByFields(queryConfig.objectType as ObjectType).map(
                    field => (
                      <SelectItem key={field.value} value={field.value}>
                        {field.label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Date Range Filter */}
          <div className="space-y-2">
            <Label>Time Period</Label>
            <Select
              value={(queryConfig.timePeriod as string) || 'all'}
              onValueChange={v => handleQueryConfigChange({ timePeriod: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="this_week">This Week</SelectItem>
                <SelectItem value="this_month">This Month</SelectItem>
                <SelectItem value="this_quarter">This Quarter</SelectItem>
                <SelectItem value="this_year">This Year</SelectItem>
                <SelectItem value="last_7_days">Last 7 Days</SelectItem>
                <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                <SelectItem value="last_90_days">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Static Value Configuration */}
      {dataSource === 'static' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Static Value</Label>
            <Input
              type={
                widgetType === 'metric' || widgetType === 'gauge'
                  ? 'number'
                  : 'text'
              }
              value={(queryConfig.staticValue as string) || ''}
              onChange={e =>
                handleQueryConfigChange({ staticValue: e.target.value })
              }
              placeholder="Enter value..."
            />
          </div>

          {(widgetType === 'metric' || widgetType === 'gauge') && (
            <div className="space-y-2">
              <Label>Comparison Value (optional)</Label>
              <Input
                type="number"
                value={(queryConfig.comparisonValue as string) || ''}
                onChange={e =>
                  handleQueryConfigChange({ comparisonValue: e.target.value })
                }
                placeholder="Previous value for trend..."
              />
            </div>
          )}
        </div>
      )}

      {/* Help Text */}
      <Card className="bg-muted/50">
        <CardContent className="py-3">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              {getHelpText(widgetType, dataSource)}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Helper functions
function getNumericFields(
  objectType: ObjectType
): { value: string; label: string }[] {
  const fieldMap: Record<ObjectType, { value: string; label: string }[]> = {
    leads: [],
    clients: [],
    invoices: [
      { value: 'total', label: 'Total Amount' },
      { value: 'balance_due', label: 'Balance Due' },
      { value: 'amount_paid', label: 'Amount Paid' },
    ],
    meetings: [{ value: 'duration_minutes', label: 'Duration (minutes)' }],
    payments: [{ value: 'amount', label: 'Amount' }],
    services: [{ value: 'total_amount', label: 'Total Amount' }],
    team_members: [
      { value: 'hourly_rate', label: 'Hourly Rate' },
      { value: 'max_active_clients', label: 'Max Active Clients' },
    ],
  }
  return fieldMap[objectType] || []
}

function getGroupByFields(
  objectType: ObjectType
): { value: string; label: string }[] {
  const fieldMap: Record<ObjectType, { value: string; label: string }[]> = {
    leads: [
      { value: 'status', label: 'Status' },
      { value: 'source', label: 'Source' },
      { value: 'lifecycle_stage', label: 'Lifecycle Stage' },
      { value: 'journey_phase', label: 'Journey Phase' },
    ],
    clients: [
      { value: 'journey_phase', label: 'Journey Phase' },
      { value: 'lifecycle_stage', label: 'Lifecycle Stage' },
    ],
    invoices: [{ value: 'status', label: 'Status' }],
    meetings: [
      { value: 'status', label: 'Status' },
      { value: 'meeting_type', label: 'Meeting Type' },
    ],
    payments: [
      { value: 'status', label: 'Status' },
      { value: 'payment_method', label: 'Payment Method' },
    ],
    services: [
      { value: 'status', label: 'Status' },
      { value: 'service_type', label: 'Service Type' },
    ],
    team_members: [
      { value: 'role', label: 'Role' },
      { value: 'is_active', label: 'Active Status' },
    ],
  }
  return fieldMap[objectType] || []
}

function getHelpText(widgetType: WidgetType, dataSource: DataSource): string {
  if (dataSource === 'report') {
    return 'Connect this widget to a saved report. The widget will display data from that report and update automatically.'
  }

  if (dataSource === 'static') {
    return 'Enter a fixed value to display. Useful for targets, goals, or manually tracked metrics.'
  }

  // Query-based help
  switch (widgetType) {
    case 'metric':
    case 'gauge':
      return 'Configure a simple aggregation query. Choose an object type and how to count or sum the data.'
    case 'chart':
    case 'funnel':
      return 'Select an object type and a field to group by. The widget will show the distribution across categories.'
    case 'table':
    case 'list':
      return 'Choose an object type to display. You can filter by time period to show relevant records.'
    default:
      return 'Configure the data source for this widget.'
  }
}
