'use client'

import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { BaseFieldProps } from './field-types'
import { isNumberFieldConfig, isCurrencyFieldConfig } from './field-types'
import type { NumberFieldConfig, CurrencyFieldConfig } from '@/lib/crm/types'

/**
 * NumberField - Numeric input with validation
 *
 * Handles precision, scale, min/max constraints from type_config.
 */
export function NumberField({
  field,
  value,
  onChange,
  disabled,
  readOnly,
  error,
  className,
}: BaseFieldProps) {
  const config = field.type_config as NumberFieldConfig
  const min = isNumberFieldConfig(config) ? config.min : undefined
  const max = isNumberFieldConfig(config) ? config.max : undefined
  const step = getStep(config)

  if (readOnly) {
    const displayValue = formatNumber(value, config)
    return (
      <div className={cn('text-sm py-2', className)}>
        {displayValue || <span className="text-muted-foreground">—</span>}
      </div>
    )
  }

  return (
    <Input
      type="number"
      value={value !== null && value !== undefined ? String(value) : ''}
      onChange={e => {
        const val = e.target.value
        if (val === '') {
          onChange(null)
        } else {
          const num = parseFloat(val)
          onChange(isNaN(num) ? null : num)
        }
      }}
      disabled={disabled}
      min={min}
      max={max}
      step={step}
      placeholder="0"
      aria-invalid={!!error}
      className={cn(className)}
    />
  )
}

/**
 * CurrencyField - Currency input with symbol and formatting
 */
export function CurrencyField({
  field,
  value,
  onChange,
  disabled,
  readOnly,
  error,
  className,
}: BaseFieldProps) {
  const config = field.type_config as CurrencyFieldConfig
  const currencyCode = isCurrencyFieldConfig(config)
    ? config.currencyCode || 'USD'
    : 'USD'

  const currencySymbol = getCurrencySymbol(currencyCode)

  if (readOnly) {
    const displayValue = formatCurrency(value, currencyCode)
    return (
      <div className={cn('text-sm py-2', className)}>
        {displayValue || <span className="text-muted-foreground">—</span>}
      </div>
    )
  }

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
        {currencySymbol}
      </span>
      <Input
        type="number"
        value={value !== null && value !== undefined ? String(value) : ''}
        onChange={e => {
          const val = e.target.value
          if (val === '') {
            onChange(null)
          } else {
            const num = parseFloat(val)
            onChange(isNaN(num) ? null : num)
          }
        }}
        disabled={disabled}
        min={0}
        step="0.01"
        placeholder="0.00"
        aria-invalid={!!error}
        className={cn('pl-7', className)}
      />
    </div>
  )
}

/**
 * PercentField - Percentage input (0-100 by default)
 */
export function PercentField({
  value,
  onChange,
  disabled,
  readOnly,
  error,
  className,
}: BaseFieldProps) {
  if (readOnly) {
    const displayValue =
      value !== null && value !== undefined ? `${value}%` : null
    return (
      <div className={cn('text-sm py-2', className)}>
        {displayValue || <span className="text-muted-foreground">—</span>}
      </div>
    )
  }

  return (
    <div className="relative">
      <Input
        type="number"
        value={value !== null && value !== undefined ? String(value) : ''}
        onChange={e => {
          const val = e.target.value
          if (val === '') {
            onChange(null)
          } else {
            const num = parseFloat(val)
            onChange(isNaN(num) ? null : num)
          }
        }}
        disabled={disabled}
        min={0}
        max={100}
        step="0.1"
        placeholder="0"
        aria-invalid={!!error}
        className={cn('pr-8', className)}
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
        %
      </span>
    </div>
  )
}

// Helper functions

function getStep(config: unknown): string {
  if (!isNumberFieldConfig(config as NumberFieldConfig)) return '1'
  const scale = (config as NumberFieldConfig).scale
  if (!scale || scale === 0) return '1'
  return (1 / Math.pow(10, scale)).toString()
}

function formatNumber(value: unknown, config: unknown): string {
  if (value === null || value === undefined) return ''
  const num = typeof value === 'number' ? value : parseFloat(String(value))
  if (isNaN(num)) return ''

  if (isNumberFieldConfig(config as NumberFieldConfig)) {
    const scale = (config as NumberFieldConfig).scale
    if (scale !== undefined) {
      return num.toFixed(scale)
    }
  }

  return num.toString()
}

function formatCurrency(value: unknown, currencyCode: string): string {
  if (value === null || value === undefined) return ''
  const num = typeof value === 'number' ? value : parseFloat(String(value))
  if (isNaN(num)) return ''

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
  }).format(num)
}

function getCurrencySymbol(currencyCode: string): string {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    CAD: 'CA$',
    AUD: 'A$',
  }
  return symbols[currencyCode] || currencyCode
}
