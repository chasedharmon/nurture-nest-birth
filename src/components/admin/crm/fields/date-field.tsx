'use client'

import { useState } from 'react'
import { format, parseISO, isValid } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import type { BaseFieldProps } from './field-types'

/**
 * DateField - Date picker with calendar popup
 *
 * Stores dates as ISO strings (YYYY-MM-DD format).
 */
export function DateField({
  value,
  onChange,
  disabled,
  readOnly,
  error,
  className,
}: BaseFieldProps) {
  const [open, setOpen] = useState(false)

  // Parse the date value
  const dateValue = parseDate(value)

  if (readOnly) {
    return (
      <div className={cn('text-sm py-2', className)}>
        {dateValue ? (
          format(dateValue, 'PPP')
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </div>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          aria-invalid={!!error}
          className={cn(
            'w-full justify-start text-left font-normal',
            !dateValue && 'text-muted-foreground',
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {dateValue ? format(dateValue, 'PPP') : 'Select date'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={dateValue ?? undefined}
          onSelect={date => {
            if (date) {
              // Store as ISO date string
              onChange(format(date, 'yyyy-MM-dd'))
            } else {
              onChange(null)
            }
            setOpen(false)
          }}
          disabled={disabled}
        />
      </PopoverContent>
    </Popover>
  )
}

/**
 * DateTimeField - Date and time picker
 *
 * Stores datetime as ISO strings.
 */
export function DateTimeField({
  value,
  onChange,
  disabled,
  readOnly,
  error,
  className,
}: BaseFieldProps) {
  const [open, setOpen] = useState(false)

  // Parse the datetime value
  const dateValue = parseDate(value)
  const timeValue = dateValue ? format(dateValue, 'HH:mm') : ''

  if (readOnly) {
    return (
      <div className={cn('text-sm py-2', className)}>
        {dateValue ? (
          format(dateValue, 'PPP p')
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </div>
    )
  }

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      // Preserve existing time if we have one
      if (dateValue) {
        date.setHours(dateValue.getHours(), dateValue.getMinutes())
      }
      onChange(date.toISOString())
    } else {
      onChange(null)
    }
    setOpen(false)
  }

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [hours, minutes] = e.target.value.split(':').map(Number)
    if (dateValue) {
      const newDate = new Date(dateValue)
      newDate.setHours(hours || 0, minutes || 0)
      onChange(newDate.toISOString())
    } else {
      // Create a new date with today + time
      const newDate = new Date()
      newDate.setHours(hours || 0, minutes || 0, 0, 0)
      onChange(newDate.toISOString())
    }
  }

  return (
    <div className={cn('flex gap-2', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            aria-invalid={!!error}
            className={cn(
              'flex-1 justify-start text-left font-normal',
              !dateValue && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateValue ? format(dateValue, 'PPP') : 'Select date'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={dateValue ?? undefined}
            onSelect={handleDateSelect}
            disabled={disabled}
          />
        </PopoverContent>
      </Popover>

      <Input
        type="time"
        value={timeValue}
        onChange={handleTimeChange}
        disabled={disabled}
        className="w-32"
        aria-invalid={!!error}
      />
    </div>
  )
}

// Helper functions

function parseDate(value: unknown): Date | null {
  if (!value) return null

  if (value instanceof Date) {
    return isValid(value) ? value : null
  }

  if (typeof value === 'string') {
    // Try parsing as ISO string
    const parsed = parseISO(value)
    if (isValid(parsed)) return parsed

    // Try parsing as date string
    const date = new Date(value)
    if (isValid(date)) return date
  }

  return null
}
