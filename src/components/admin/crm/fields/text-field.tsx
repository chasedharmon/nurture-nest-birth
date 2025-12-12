'use client'

import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { BaseFieldProps } from './field-types'
import { isTextFieldConfig } from './field-types'

/**
 * TextField - Renders text, email, phone, and URL field types
 *
 * Handles input validation patterns and character limits based on field type.
 */
export function TextField({
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

  // Determine input type based on field data_type
  const inputType = getInputType(field.data_type)
  const pattern = getInputPattern(field.data_type)
  const placeholder = getPlaceholder(field.data_type, field.label)

  if (readOnly) {
    return (
      <div className={cn('text-sm py-2', className)}>
        {value ? (
          String(value)
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </div>
    )
  }

  return (
    <Input
      type={inputType}
      value={value !== null && value !== undefined ? String(value) : ''}
      onChange={e => onChange(e.target.value || null)}
      disabled={disabled}
      maxLength={maxLength}
      pattern={pattern}
      placeholder={placeholder}
      aria-invalid={!!error}
      className={cn(className)}
    />
  )
}

function getInputType(dataType: string): string {
  switch (dataType) {
    case 'email':
      return 'email'
    case 'phone':
      return 'tel'
    case 'url':
      return 'url'
    default:
      return 'text'
  }
}

function getInputPattern(dataType: string): string | undefined {
  switch (dataType) {
    case 'phone':
      // Allow various phone formats
      return undefined
    default:
      return undefined
  }
}

function getPlaceholder(dataType: string, label: string): string {
  switch (dataType) {
    case 'email':
      return 'email@example.com'
    case 'phone':
      return '(555) 555-5555'
    case 'url':
      return 'https://example.com'
    default:
      return `Enter ${label.toLowerCase()}`
  }
}

/**
 * EmailField - Specialized wrapper for email inputs
 */
export function EmailField(props: BaseFieldProps) {
  return <TextField {...props} />
}

/**
 * PhoneField - Specialized wrapper for phone inputs
 */
export function PhoneField(props: BaseFieldProps) {
  return <TextField {...props} />
}

/**
 * UrlField - Specialized wrapper for URL inputs
 */
export function UrlField(props: BaseFieldProps) {
  return <TextField {...props} />
}
