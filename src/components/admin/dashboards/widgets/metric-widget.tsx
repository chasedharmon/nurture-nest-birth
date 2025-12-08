'use client'

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface MetricWidgetProps {
  title: string
  value: string | number
  previousValue?: number
  format?: 'number' | 'currency' | 'percent'
  icon?: React.ReactNode
  description?: string
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string | number
  className?: string
}

export function MetricWidget({
  title,
  value,
  previousValue,
  format = 'number',
  icon,
  description,
  trend,
  trendValue,
  className,
}: MetricWidgetProps) {
  const formattedValue = formatValue(value, format)

  // Calculate trend if previousValue is provided and trend is not explicitly set
  let computedTrend = trend
  let computedTrendValue = trendValue

  if (previousValue !== undefined && typeof value === 'number' && !trend) {
    const diff = value - previousValue
    const percentChange =
      previousValue > 0 ? ((diff / previousValue) * 100).toFixed(1) : 0
    computedTrend = diff > 0 ? 'up' : diff < 0 ? 'down' : 'neutral'
    computedTrendValue = `${diff > 0 ? '+' : ''}${percentChange}%`
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formattedValue}</div>
        {(computedTrend || description) && (
          <div className="mt-1 flex items-center gap-2 text-xs">
            {computedTrend && computedTrendValue && (
              <span
                className={cn(
                  'flex items-center gap-0.5',
                  computedTrend === 'up' &&
                    'text-green-600 dark:text-green-400',
                  computedTrend === 'down' && 'text-red-600 dark:text-red-400',
                  computedTrend === 'neutral' && 'text-muted-foreground'
                )}
              >
                {computedTrend === 'up' && <TrendingUp className="h-3 w-3" />}
                {computedTrend === 'down' && (
                  <TrendingDown className="h-3 w-3" />
                )}
                {computedTrend === 'neutral' && <Minus className="h-3 w-3" />}
                {computedTrendValue}
              </span>
            )}
            {description && (
              <span className="text-muted-foreground">{description}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function formatValue(
  value: string | number,
  format: 'number' | 'currency' | 'percent'
): string {
  if (typeof value === 'string') return value

  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value)
    case 'percent':
      return `${value.toFixed(1)}%`
    case 'number':
    default:
      return new Intl.NumberFormat('en-US').format(value)
  }
}
