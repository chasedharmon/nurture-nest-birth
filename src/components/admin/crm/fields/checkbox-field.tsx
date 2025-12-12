'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { BaseFieldProps } from './field-types'

/**
 * CheckboxField - Boolean toggle field
 *
 * Renders as a checkbox with label.
 */
export function CheckboxField({
  field,
  value,
  onChange,
  disabled,
  readOnly,
  error,
  className,
}: BaseFieldProps) {
  const checked = Boolean(value)

  if (readOnly) {
    return (
      <div className={cn('text-sm py-2 flex items-center gap-2', className)}>
        <div
          className={cn(
            'w-4 h-4 rounded border flex items-center justify-center',
            checked
              ? 'bg-primary border-primary text-primary-foreground'
              : 'border-input'
          )}
        >
          {checked && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-3 h-3"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </div>
        <span>{checked ? 'Yes' : 'No'}</span>
      </div>
    )
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Checkbox
        id={`field-${field.id}`}
        checked={checked}
        onCheckedChange={newChecked => onChange(Boolean(newChecked))}
        disabled={disabled}
        aria-invalid={!!error}
      />
      <Label
        htmlFor={`field-${field.id}`}
        className="text-sm font-normal cursor-pointer"
      >
        {field.help_text || field.label}
      </Label>
    </div>
  )
}
