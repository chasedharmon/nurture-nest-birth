'use client'

import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { BaseFieldProps } from './field-types'
import { isTextFieldConfig } from './field-types'

/**
 * TextAreaField - Multi-line text input
 *
 * Used for longer text content like descriptions, notes, etc.
 */
export function TextAreaField({
  field,
  value,
  onChange,
  disabled,
  readOnly,
  error,
  className,
}: BaseFieldProps) {
  const config = field.type_config
  const maxLength = isTextFieldConfig(config) ? config.maxLength : undefined

  if (readOnly) {
    return (
      <div className={cn('text-sm py-2 whitespace-pre-wrap', className)}>
        {value ? (
          String(value)
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </div>
    )
  }

  return (
    <Textarea
      value={value !== null && value !== undefined ? String(value) : ''}
      onChange={e => onChange(e.target.value || null)}
      disabled={disabled}
      maxLength={maxLength}
      placeholder={`Enter ${field.label.toLowerCase()}`}
      aria-invalid={!!error}
      rows={4}
      className={cn('resize-y min-h-[100px]', className)}
    />
  )
}
