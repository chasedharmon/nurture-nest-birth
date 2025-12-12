'use client'

import { useState } from 'react'
import { Check, ChevronsUpDown, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import type { BaseFieldProps } from './field-types'

/**
 * PicklistField - Single-select dropdown
 *
 * Uses the picklist_values from field definition.
 */
export function PicklistField({
  field,
  value,
  onChange,
  disabled,
  readOnly,
  error,
  className,
}: BaseFieldProps) {
  const [open, setOpen] = useState(false)
  const options = field.picklist_values || []

  // Find the selected option
  const selectedOption = options.find(opt => opt.value === value)

  if (readOnly) {
    return (
      <div className={cn('text-sm py-2', className)}>
        {selectedOption ? (
          <Badge
            variant="secondary"
            style={
              selectedOption.color
                ? { backgroundColor: selectedOption.color, color: 'white' }
                : undefined
            }
          >
            {selectedOption.label}
          </Badge>
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
          role="combobox"
          aria-expanded={open}
          aria-invalid={!!error}
          disabled={disabled}
          className={cn(
            'w-full justify-between font-normal',
            !value && 'text-muted-foreground',
            className
          )}
        >
          {selectedOption ? (
            <span className="flex items-center gap-2">
              {selectedOption.color && (
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: selectedOption.color }}
                />
              )}
              {selectedOption.label}
            </span>
          ) : (
            'Select...'
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Search..." />
          <CommandList>
            <CommandEmpty>No options found.</CommandEmpty>
            <CommandGroup>
              {/* Allow clearing */}
              {Boolean(value) && (
                <CommandItem
                  value=""
                  onSelect={() => {
                    onChange(null)
                    setOpen(false)
                  }}
                >
                  <X className="mr-2 h-4 w-4 text-muted-foreground" />
                  Clear selection
                </CommandItem>
              )}
              {options
                .filter(opt => opt.is_active)
                .map(option => (
                  <CommandItem
                    key={option.id}
                    value={option.value}
                    onSelect={() => {
                      onChange(option.value)
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === option.value ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <span className="flex items-center gap-2">
                      {option.color && (
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: option.color }}
                        />
                      )}
                      {option.label}
                    </span>
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

/**
 * MultiPicklistField - Multi-select dropdown
 *
 * Stores values as an array.
 */
export function MultiPicklistField({
  field,
  value,
  onChange,
  disabled,
  readOnly,
  error,
  className,
}: BaseFieldProps) {
  const [open, setOpen] = useState(false)
  const options = field.picklist_values || []

  // Ensure value is an array
  const selectedValues: string[] = Array.isArray(value)
    ? value
    : value
      ? [String(value)]
      : []

  // Find selected options
  const selectedOptions = options.filter(opt =>
    selectedValues.includes(opt.value)
  )

  const toggleValue = (optionValue: string) => {
    const newValues = selectedValues.includes(optionValue)
      ? selectedValues.filter(v => v !== optionValue)
      : [...selectedValues, optionValue]
    onChange(newValues.length > 0 ? newValues : null)
  }

  const removeValue = (optionValue: string) => {
    const newValues = selectedValues.filter(v => v !== optionValue)
    onChange(newValues.length > 0 ? newValues : null)
  }

  if (readOnly) {
    return (
      <div className={cn('text-sm py-2 flex flex-wrap gap-1', className)}>
        {selectedOptions.length > 0 ? (
          selectedOptions.map(option => (
            <Badge
              key={option.id}
              variant="secondary"
              style={
                option.color
                  ? { backgroundColor: option.color, color: 'white' }
                  : undefined
              }
            >
              {option.label}
            </Badge>
          ))
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </div>
    )
  }

  return (
    <div className={cn('space-y-2', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-invalid={!!error}
            disabled={disabled}
            className={cn(
              'w-full justify-between font-normal min-h-9',
              selectedValues.length === 0 && 'text-muted-foreground'
            )}
          >
            {selectedValues.length > 0
              ? `${selectedValues.length} selected`
              : 'Select...'}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Search..." />
            <CommandList>
              <CommandEmpty>No options found.</CommandEmpty>
              <CommandGroup>
                {options
                  .filter(opt => opt.is_active)
                  .map(option => (
                    <CommandItem
                      key={option.id}
                      value={option.value}
                      onSelect={() => toggleValue(option.value)}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          selectedValues.includes(option.value)
                            ? 'opacity-100'
                            : 'opacity-0'
                        )}
                      />
                      <span className="flex items-center gap-2">
                        {option.color && (
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: option.color }}
                          />
                        )}
                        {option.label}
                      </span>
                    </CommandItem>
                  ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected values as badges */}
      {selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedOptions.map(option => (
            <Badge
              key={option.id}
              variant="secondary"
              className="cursor-pointer"
              style={
                option.color
                  ? { backgroundColor: option.color, color: 'white' }
                  : undefined
              }
              onClick={() => !disabled && removeValue(option.value)}
            >
              {option.label}
              {!disabled && <X className="ml-1 h-3 w-3" />}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
