'use client'

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
import type { ChartConfig, ColumnConfig } from '@/lib/supabase/types'

const CHART_COLORS = [
  '#3b82f6',
  '#8b5cf6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#06b6d4',
  '#ec4899',
]

interface ReportChartDisplayProps {
  data: Record<string, unknown>[]
  chartConfig: ChartConfig
  groupings: string[]
  visibleColumns: ColumnConfig[]
}

export function ReportChartDisplay({
  data,
  chartConfig,
  groupings,
  visibleColumns,
}: ReportChartDisplayProps) {
  if (!data || data.length === 0) return null

  const chartData = data.map(row => {
    const item: Record<string, unknown> = {}
    const groupField = groupings[0] || visibleColumns[0]?.field || 'id'
    item.name = row[groupField] || 'Unknown'

    visibleColumns.forEach(col => {
      if (col.format === 'currency' || col.format === 'number') {
        item[col.label] = row[col.field] || 0
      }
    })

    return item
  })

  const dataKey =
    visibleColumns.find(c => c.format === 'currency' || c.format === 'number')
      ?.label || 'value'

  switch (chartConfig.type || 'bar') {
    case 'bar':
      return (
        <ResponsiveContainer width="100%" height={400}>
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
            <Bar dataKey={dataKey} fill={CHART_COLORS[0]} />
          </BarChart>
        </ResponsiveContainer>
      )
    case 'line':
      return (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            {chartConfig.showGrid !== false && (
              <CartesianGrid strokeDasharray="3 3" />
            )}
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            {chartConfig.showLegend !== false && <Legend />}
            <Line type="monotone" dataKey={dataKey} stroke={CHART_COLORS[0]} />
          </LineChart>
        </ResponsiveContainer>
      )
    case 'area':
      return (
        <ResponsiveContainer width="100%" height={400}>
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
              fill={CHART_COLORS[0]}
              stroke={CHART_COLORS[0]}
            />
          </AreaChart>
        </ResponsiveContainer>
      )
    case 'pie':
    case 'donut':
      return (
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey={dataKey}
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={chartConfig.type === 'donut' ? 120 : 150}
              innerRadius={chartConfig.type === 'donut' ? 80 : 0}
              label={chartConfig.showDataLabels}
            >
              {chartData.map((_entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
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
