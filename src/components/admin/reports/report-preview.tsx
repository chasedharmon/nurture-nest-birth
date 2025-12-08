'use client'

import { useState, useEffect } from 'react'
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  Table2,
  BarChart3,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { executeReportConfig } from '@/app/actions/reports'
import { generateReportFormulaDescription } from '@/lib/report-utils'
import type {
  ObjectType,
  ReportType,
  ColumnConfig,
  FilterCondition,
  AggregationConfig,
  ChartConfig,
  ReportExecutionResult,
} from '@/lib/supabase/types'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface ReportPreviewProps {
  objectType: ObjectType
  reportType: ReportType
  columns: ColumnConfig[]
  filters: FilterCondition[]
  groupings: string[]
  aggregations: AggregationConfig[]
  chartConfig: ChartConfig
}

const FALLBACK_COLORS = [
  '#3b82f6',
  '#8b5cf6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#06b6d4',
  '#ec4899',
]

export function ReportPreview({
  objectType,
  reportType,
  columns,
  filters,
  groupings,
  aggregations,
  chartConfig,
}: ReportPreviewProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<ReportExecutionResult | null>(null)
  const [formula, setFormula] = useState<string>('')
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table')

  const visibleColumns = columns.filter(c => c.visible)

  const fetchPreview = async () => {
    if (visibleColumns.length === 0) {
      setData(null)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await executeReportConfig({
        object_type: objectType,
        columns: visibleColumns,
        filters,
        groupings,
        aggregations,
      })

      if (result.success && result.data) {
        setData(result.data)
        const desc = generateReportFormulaDescription({
          object_type: objectType,
          columns: visibleColumns,
          filters,
          groupings,
          aggregations,
        })
        setFormula(desc)
      } else {
        setError(result.error || 'Failed to fetch preview')
      }
    } catch {
      setError('An error occurred while fetching preview')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPreview()
    }, 500)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    objectType,
    JSON.stringify(columns),
    JSON.stringify(filters),
    JSON.stringify(groupings),
    JSON.stringify(aggregations),
  ])

  useEffect(() => {
    if (reportType === 'chart') {
      setViewMode('chart')
    } else {
      setViewMode('table')
    }
  }, [reportType])

  const formatCellValue = (value: unknown, format?: string): string => {
    if (value === null || value === undefined) return '—'

    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(Number(value))
      case 'date':
        return new Date(String(value)).toLocaleDateString()
      case 'datetime':
        return new Date(String(value)).toLocaleString()
      case 'boolean':
        return value ? 'Yes' : 'No'
      default:
        return String(value)
    }
  }

  const renderChart = () => {
    if (!data || data.rows.length === 0) return null

    const chartData = data.rows.map((row: Record<string, unknown>) => {
      const item: Record<string, unknown> = {}
      const groupField = groupings[0] || visibleColumns[0]?.field || 'id'
      item.name = row[groupField] || 'Unknown'

      aggregations.forEach(agg => {
        item[agg.label] = row[agg.field] || 0
      })

      if (aggregations.length === 0) {
        visibleColumns.forEach(col => {
          if (col.format === 'currency') {
            item[col.label] = row[col.field] || 0
          }
        })
      }

      return item
    })

    const dataKey =
      aggregations[0]?.label ||
      visibleColumns.find(c => c.format === 'currency')?.label ||
      'value'

    switch (chartConfig.type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={chartData}
              layout={chartConfig.horizontal ? 'vertical' : 'horizontal'}
            >
              {chartConfig.showGrid !== false && (
                <CartesianGrid strokeDasharray="3 3" />
              )}
              {chartConfig.horizontal ? (
                <>
                  <YAxis dataKey="name" type="category" width={100} />
                  <XAxis type="number" />
                </>
              ) : (
                <>
                  <XAxis dataKey="name" />
                  <YAxis />
                </>
              )}
              <Tooltip />
              {chartConfig.showLegend !== false && <Legend />}
              <Bar dataKey={dataKey} fill={FALLBACK_COLORS[0]} />
            </BarChart>
          </ResponsiveContainer>
        )

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              {chartConfig.showGrid !== false && (
                <CartesianGrid strokeDasharray="3 3" />
              )}
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              {chartConfig.showLegend !== false && <Legend />}
              <Line
                type="monotone"
                dataKey={dataKey}
                stroke={FALLBACK_COLORS[0]}
              />
            </LineChart>
          </ResponsiveContainer>
        )

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              {chartConfig.showGrid !== false && (
                <CartesianGrid strokeDasharray="3 3" />
              )}
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              {chartConfig.showLegend !== false && <Legend />}
              <Area
                type="monotone"
                dataKey={dataKey}
                fill={FALLBACK_COLORS[0]}
                stroke={FALLBACK_COLORS[0]}
              />
            </AreaChart>
          </ResponsiveContainer>
        )

      case 'pie':
      case 'donut':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey={dataKey}
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={chartConfig.type === 'donut' ? 100 : 120}
                innerRadius={chartConfig.type === 'donut' ? 60 : 0}
                label={chartConfig.showDataLabels}
              >
                {chartData.map((_entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={FALLBACK_COLORS[index % FALLBACK_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              {chartConfig.showLegend !== false && <Legend />}
            </PieChart>
          </ResponsiveContainer>
        )

      default:
        return null
    }
  }

  if (visibleColumns.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground">
          Select at least one column to see a preview
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="font-medium">Preview</h4>
          {data && (
            <Badge variant="secondary">
              {data.totalCount} record{data.totalCount !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {reportType !== 'tabular' && (
            <div className="flex rounded-lg border p-1">
              <Button
                variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 px-2"
                onClick={() => setViewMode('table')}
              >
                <Table2 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'chart' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 px-2"
                onClick={() => setViewMode('chart')}
              >
                <BarChart3 className="h-4 w-4" />
              </Button>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPreview}
            disabled={loading}
          >
            <RefreshCw
              className={cn('h-4 w-4 mr-2', loading && 'animate-spin')}
            />
            Refresh
          </Button>
        </div>
      </div>

      {formula && (
        <div className="rounded-lg bg-muted/50 p-3 text-sm">
          <span className="font-medium">How this report works: </span>
          <span className="text-muted-foreground">{formula}</span>
        </div>
      )}

      {loading ? (
        <div className="rounded-lg border p-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      ) : data && data.rows.length > 0 ? (
        viewMode === 'chart' ? (
          <div className="rounded-lg border p-4">
            {chartConfig.title && (
              <h5 className="font-medium mb-4 text-center">
                {chartConfig.title}
              </h5>
            )}
            {renderChart()}
          </div>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {visibleColumns.map(col => (
                      <TableHead key={col.field}>{col.label}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.rows
                    .slice(0, 10)
                    .map((row: Record<string, unknown>, idx: number) => (
                      <TableRow key={idx}>
                        {visibleColumns.map(col => (
                          <TableCell key={col.field}>
                            {col.format === 'badge' ? (
                              <Badge variant="outline">
                                {formatCellValue(row[col.field], col.format)}
                              </Badge>
                            ) : (
                              formatCellValue(row[col.field], col.format)
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
            {data.rows.length > 10 && (
              <div className="p-3 text-center text-sm text-muted-foreground border-t">
                Showing 10 of {data.rows.length} records
              </div>
            )}
          </div>
        )
      ) : (
        <div className="rounded-lg border p-8 text-center text-muted-foreground">
          No data matches your filters
        </div>
      )}

      {data &&
        data.aggregations &&
        Object.keys(data.aggregations).length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(data.aggregations).map(([key, value]) => (
              <div key={key} className="rounded-lg border bg-card p-3">
                <p className="text-xs text-muted-foreground">{key}</p>
                <p className="text-lg font-semibold">
                  {typeof value === 'number'
                    ? value.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })
                    : String(value)}
                </p>
              </div>
            ))}
          </div>
        )}
    </div>
  )
}
