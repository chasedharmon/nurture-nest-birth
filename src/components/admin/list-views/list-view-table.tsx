'use client'

import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ArrowUp, ArrowDown, Loader2 } from 'lucide-react'
import type { ColumnConfig, SortConfig, ObjectType } from '@/lib/supabase/types'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface ListViewTableProps<T> {
  data: T[]
  columns: ColumnConfig[]
  sortConfig: SortConfig
  selectedIds: Set<string>
  onSelectAll: (checked: boolean) => void
  onSelectRow: (id: string, checked: boolean) => void
  onSort: (field: string) => void
  onInlineEdit: (id: string, field: string, value: unknown) => void
  isPending: boolean
  objectType: ObjectType
}

export function ListViewTable<T extends { id: string }>({
  data,
  columns,
  sortConfig,
  selectedIds,
  onSelectAll,
  onSelectRow,
  onSort,
  isPending,
  objectType,
}: ListViewTableProps<T>) {
  const router = useRouter()
  const visibleColumns = columns.filter(col => col.visible)

  const handleRowClick = (id: string) => {
    // Navigate to detail page
    const basePath = objectType === 'clients' ? 'leads' : objectType
    router.push(`/admin/${basePath}/${id}`)
  }

  const formatCellValue = (
    value: unknown,
    format?: string,
    formatOptions?: Record<string, unknown>
  ) => {
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground">—</span>
    }

    switch (format) {
      case 'date':
        try {
          const date = new Date(value as string)
          return formatDate(date, 'MMM d, yyyy')
        } catch {
          return String(value)
        }
      case 'datetime':
        try {
          const date = new Date(value as string)
          return formatDate(date, 'MMM d, yyyy h:mm a')
        } catch {
          return String(value)
        }
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(value as number)
      case 'badge':
        return (
          <Badge variant={getBadgeVariant(value as string, formatOptions)}>
            {formatStatusLabel(value as string)}
          </Badge>
        )
      case 'boolean':
        return value ? (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Yes
          </Badge>
        ) : (
          <Badge variant="secondary" className="bg-gray-100 text-gray-600">
            No
          </Badge>
        )
      case 'link':
        return (
          <a
            href={value as string}
            className="text-primary hover:underline"
            onClick={e => e.stopPropagation()}
          >
            {value as string}
          </a>
        )
      default:
        return String(value)
    }
  }

  const allSelected = data.length > 0 && selectedIds.size === data.length
  const someSelected = selectedIds.size > 0 && selectedIds.size < data.length

  return (
    <div className="relative overflow-x-auto">
      {isPending && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}

      <table className="w-full text-sm">
        <thead className="border-b border-border bg-muted/50">
          <tr>
            {/* Checkbox column */}
            <th className="w-12 px-4 py-3">
              <Checkbox
                checked={
                  allSelected || (someSelected ? 'indeterminate' : false)
                }
                onCheckedChange={onSelectAll}
                aria-label="Select all"
              />
            </th>

            {/* Data columns */}
            {visibleColumns.map(column => (
              <th
                key={column.field}
                className={cn(
                  'px-4 py-3 text-left font-medium text-muted-foreground',
                  column.sortable && 'cursor-pointer hover:text-foreground'
                )}
                style={{ width: column.width ? `${column.width}px` : 'auto' }}
                onClick={() => column.sortable && onSort(column.field)}
              >
                <div className="flex items-center gap-1">
                  {column.label}
                  {column.sortable && sortConfig.field === column.field && (
                    <span className="text-primary">
                      {sortConfig.direction === 'asc' ? (
                        <ArrowUp className="h-3 w-3" />
                      ) : (
                        <ArrowDown className="h-3 w-3" />
                      )}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-border">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={visibleColumns.length + 1}
                className="px-4 py-12 text-center text-muted-foreground"
              >
                No records found
              </td>
            </tr>
          ) : (
            data.map(row => (
              <tr
                key={row.id}
                className={cn(
                  'cursor-pointer transition-colors hover:bg-muted/50',
                  selectedIds.has(row.id) && 'bg-muted/30'
                )}
                onClick={() => handleRowClick(row.id)}
              >
                {/* Checkbox */}
                <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedIds.has(row.id)}
                    onCheckedChange={checked =>
                      onSelectRow(row.id, checked as boolean)
                    }
                    aria-label={`Select row ${row.id}`}
                  />
                </td>

                {/* Data cells */}
                {visibleColumns.map(column => (
                  <td key={column.field} className="px-4 py-3">
                    {formatCellValue(
                      (row as Record<string, unknown>)[column.field],
                      column.format,
                      column.formatOptions
                    )}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

// Helper functions
function formatDate(date: Date, formatStr: string): string {
  return format(date, formatStr)
}

function formatStatusLabel(status: string): string {
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function getBadgeVariant(
  value: string,
  _options?: Record<string, unknown>
): 'default' | 'secondary' | 'destructive' | 'outline' {
  const positiveStatuses = [
    'client',
    'active',
    'paid',
    'completed',
    'signed',
    'yes',
    'true',
  ]
  const negativeStatuses = [
    'lost',
    'cancelled',
    'failed',
    'overdue',
    'no_show',
    'voided',
  ]
  const pendingStatuses = ['new', 'pending', 'draft', 'scheduled', 'partial']

  const lowerValue = value.toLowerCase()

  if (positiveStatuses.includes(lowerValue)) {
    return 'default'
  }
  if (negativeStatuses.includes(lowerValue)) {
    return 'destructive'
  }
  if (pendingStatuses.includes(lowerValue)) {
    return 'secondary'
  }
  return 'outline'
}
