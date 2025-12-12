'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { BaseFieldProps } from './field-types'
import { isFormulaFieldConfig } from './field-types'
import type { FormulaFieldConfig } from '@/lib/crm/types'

/**
 * FormulaField - Read-only computed field
 *
 * Displays the computed value based on the formula.
 * The actual computation happens on the server/database side.
 */
export function FormulaField({ field, value, className }: BaseFieldProps) {
  const config = field.type_config as FormulaFieldConfig

  // Format based on return type
  const displayValue = formatFormulaValue(value, config)

  return (
    <div className={cn('text-sm py-2', className)}>
      {displayValue !== null && displayValue !== '' ? (
        <span className="flex items-center gap-2">
          {displayValue}
          <Badge variant="outline" className="text-xs">
            Formula
          </Badge>
        </span>
      ) : (
        <span className="text-muted-foreground">—</span>
      )}
    </div>
  )
}

function formatFormulaValue(
  value: unknown,
  config: FormulaFieldConfig
): string {
  if (value === null || value === undefined) return ''

  if (!isFormulaFieldConfig(config)) {
    return String(value)
  }

  switch (config.returnType) {
    case 'currency': {
      const num = typeof value === 'number' ? value : parseFloat(String(value))
      if (isNaN(num)) return ''
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(num)
    }

    case 'percent': {
      const num = typeof value === 'number' ? value : parseFloat(String(value))
      if (isNaN(num)) return ''
      return `${num.toFixed(config.decimalPlaces || 0)}%`
    }

    case 'number': {
      const num = typeof value === 'number' ? value : parseFloat(String(value))
      if (isNaN(num)) return ''
      return num.toFixed(config.decimalPlaces || 0)
    }

    case 'date': {
      const date = value instanceof Date ? value : new Date(String(value))
      if (isNaN(date.getTime())) return ''
      return date.toLocaleDateString()
    }

    case 'datetime': {
      const date = value instanceof Date ? value : new Date(String(value))
      if (isNaN(date.getTime())) return ''
      return date.toLocaleString()
    }

    case 'checkbox':
      return value ? 'Yes' : 'No'

    case 'text':
    default:
      return String(value)
  }
}
