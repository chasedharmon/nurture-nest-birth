'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import type { FilterCondition } from '@/lib/supabase/types'

interface FilterBarProps {
  filters: FilterCondition[]
  onRemoveFilter: (id: string) => void
  onClearAll: () => void
}

const OPERATOR_DISPLAY: Record<string, string> = {
  equals: '=',
  not_equals: '≠',
  contains: 'contains',
  greater_than: '>',
  less_than: '<',
  is_null: 'is empty',
  is_not_null: 'is not empty',
  this_week: 'this week',
  this_month: 'this month',
}

export function FilterBar({
  filters,
  onRemoveFilter,
  onClearAll,
}: FilterBarProps) {
  if (filters.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/30 px-4 py-2">
      <span className="text-xs font-medium text-muted-foreground">
        Filters:
      </span>

      {filters.map((filter, index) => (
        <Badge
          key={filter.id}
          variant="secondary"
          className="flex items-center gap-1 pr-1"
        >
          {index > 0 && (
            <span className="mr-1 text-muted-foreground">{filter.logic}</span>
          )}
          <span className="font-medium">{filter.field}</span>
          <span className="text-muted-foreground">
            {OPERATOR_DISPLAY[filter.operator] || filter.operator}
          </span>
          {![
            'is_null',
            'is_not_null',
            'this_week',
            'this_month',
            'this_quarter',
          ].includes(filter.operator) && <span>{String(filter.value)}</span>}
          <button
            onClick={() => onRemoveFilter(filter.id)}
            className="ml-1 rounded-full p-0.5 hover:bg-muted"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}

      <Button
        variant="ghost"
        size="sm"
        onClick={onClearAll}
        className="h-6 text-xs text-muted-foreground"
      >
        Clear all
      </Button>
    </div>
  )
}
