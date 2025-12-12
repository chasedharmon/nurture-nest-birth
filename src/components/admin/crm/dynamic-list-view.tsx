'use client'

/**
 * DynamicListView - A metadata-driven list view for CRM objects
 *
 * This component renders a sortable, filterable data table for any CRM object.
 * It uses field definitions from the metadata system to:
 * - Generate columns dynamically
 * - Format cell values based on field type
 * - Enable search across text fields
 * - Support bulk actions
 *
 * Unlike the legacy ListViewContainer, this component is designed to work
 * with the new CRM object model and metadata-driven architecture.
 */

import { useState, useCallback, useTransition, useMemo } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  Search,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Trash2,
  Edit,
  Eye,
  Loader2,
  Check,
  X,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'

import type { FieldWithPicklistValues, ObjectDefinition } from '@/lib/crm/types'
import { bulkDeleteRecords } from '@/app/actions/crm-records'

// =====================================================
// TYPES
// =====================================================

export interface DynamicListViewProps<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T extends { id: string; [key: string]: any },
> {
  /** Object definition metadata */
  objectDefinition: ObjectDefinition
  /** Field definitions for columns */
  fields: FieldWithPicklistValues[]
  /** The record data to display */
  data: T[]
  /** Total count for pagination */
  totalCount: number
  /** Current page (1-indexed) */
  page: number
  /** Page size */
  pageSize: number
  /** Loading state */
  isLoading?: boolean
  /** Search fields to enable text search */
  searchFields?: string[]
  /** Which fields to display as columns (defaults to visible fields) */
  displayFields?: string[]
  /** Base path for record links (e.g., '/admin/contacts') */
  basePath: string
  /** Enable bulk actions */
  enableBulkActions?: boolean
  /** Enable inline editing */
  enableInlineEdit?: boolean
  /** Custom row actions */
  rowActions?: (record: T) => React.ReactNode
  /** Additional header actions (shown in toolbar) */
  headerActions?: React.ReactNode
}

interface ColumnDef {
  field: FieldWithPicklistValues
  width?: string
}

// =====================================================
// CELL VALUE FORMATTERS
// =====================================================

function formatCellValue(
  value: unknown,
  field: FieldWithPicklistValues
): React.ReactNode {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground">—</span>
  }

  switch (field.data_type) {
    case 'checkbox':
      return value ? (
        <Check className="h-4 w-4 text-green-600" />
      ) : (
        <X className="h-4 w-4 text-muted-foreground" />
      )

    case 'date':
      return formatDate(value as string)

    case 'datetime':
      return formatDateTime(value as string)

    case 'currency':
      return formatCurrency(value as number, field)

    case 'percent':
      return `${value}%`

    case 'number':
      return formatNumber(value as number, field)

    case 'picklist':
      return formatPicklistValue(value as string, field)

    case 'multipicklist':
      return formatMultiPicklistValue(value as string[], field)

    case 'email':
      return (
        <a
          href={`mailto:${value}`}
          className="text-primary hover:underline"
          onClick={e => e.stopPropagation()}
        >
          {String(value)}
        </a>
      )

    case 'phone':
      return (
        <a
          href={`tel:${value}`}
          className="text-primary hover:underline"
          onClick={e => e.stopPropagation()}
        >
          {String(value)}
        </a>
      )

    case 'url':
      return (
        <a
          href={String(value)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
          onClick={e => e.stopPropagation()}
        >
          {truncateUrl(String(value))}
        </a>
      )

    default:
      // Truncate long text
      const text = String(value)
      if (text.length > 50) {
        return text.substring(0, 50) + '...'
      }
      return text
  }
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString()
  } catch {
    return dateStr
  }
}

function formatDateTime(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleString()
  } catch {
    return dateStr
  }
}

function formatCurrency(value: number, field: FieldWithPicklistValues): string {
  const config = field.type_config as { currencyCode?: string } | undefined
  const currencyCode = config?.currencyCode || 'USD'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
  }).format(value)
}

function formatNumber(value: number, field: FieldWithPicklistValues): string {
  const config = field.type_config as
    | { precision?: number; scale?: number }
    | undefined
  const scale = config?.scale ?? 0
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: scale,
    maximumFractionDigits: scale,
  }).format(value)
}

function formatPicklistValue(
  value: string,
  field: FieldWithPicklistValues
): React.ReactNode {
  const picklistValue = field.picklist_values?.find(pv => pv.value === value)
  if (picklistValue?.color) {
    return (
      <Badge
        style={{ backgroundColor: picklistValue.color }}
        className="text-white"
      >
        {picklistValue.label}
      </Badge>
    )
  }
  return picklistValue?.label || value
}

function formatMultiPicklistValue(
  values: string[],
  field: FieldWithPicklistValues
): React.ReactNode {
  if (!Array.isArray(values)) return String(values)
  return (
    <div className="flex flex-wrap gap-1">
      {values.map(v => {
        const pv = field.picklist_values?.find(p => p.value === v)
        return (
          <Badge key={v} variant="secondary" className="text-xs">
            {pv?.label || v}
          </Badge>
        )
      })}
    </div>
  )
}

function truncateUrl(url: string): string {
  try {
    const parsed = new URL(url)
    return parsed.hostname + (parsed.pathname.length > 1 ? '/...' : '')
  } catch {
    return url.substring(0, 30) + '...'
  }
}

// =====================================================
// MAIN COMPONENT
// =====================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function DynamicListView<T extends { id: string; [key: string]: any }>({
  objectDefinition,
  fields,
  data,
  totalCount,
  page,
  pageSize,
  isLoading = false,
  searchFields = [],
  displayFields,
  basePath,
  enableBulkActions = true,
  rowActions,
  headerActions,
}: DynamicListViewProps<T>) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Search state with debounce
  const [searchInput, setSearchInput] = useState(searchParams.get('q') || '')

  // Get current sort from URL
  const sortField = searchParams.get('sort') || 'created_at'
  const sortDir = (searchParams.get('dir') || 'desc') as 'asc' | 'desc'

  // Build columns from fields
  const columns = useMemo((): ColumnDef[] => {
    let fieldsToShow = fields.filter(f => f.is_visible && f.is_active)

    // Filter to displayFields if provided
    if (displayFields?.length) {
      fieldsToShow = fieldsToShow.filter(f =>
        displayFields.includes(f.api_name)
      )
    }

    // Sort by display_order
    fieldsToShow.sort((a, b) => a.display_order - b.display_order)

    return fieldsToShow.map(f => ({ field: f }))
  }, [fields, displayFields])

  // =====================================================
  // URL HANDLERS
  // =====================================================

  const updateUrl = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString())
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null) {
          params.delete(key)
        } else {
          params.set(key, value)
        }
      })
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams]
  )

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      updateUrl({ q: searchInput || null, page: null })
    },
    [searchInput, updateUrl]
  )

  const handleSort = useCallback(
    (fieldApiName: string) => {
      const newDir =
        sortField === fieldApiName && sortDir === 'asc' ? 'desc' : 'asc'
      updateUrl({ sort: fieldApiName, dir: newDir })
    },
    [sortField, sortDir, updateUrl]
  )

  const handlePageChange = useCallback(
    (newPage: number) => {
      updateUrl({ page: newPage.toString() })
    },
    [updateUrl]
  )

  // =====================================================
  // SELECTION HANDLERS
  // =====================================================

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        setSelectedIds(new Set(data.map(item => item.id)))
      } else {
        setSelectedIds(new Set())
      }
    },
    [data]
  )

  const handleSelectRow = useCallback((id: string, checked: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (checked) {
        next.add(id)
      } else {
        next.delete(id)
      }
      return next
    })
  }, [])

  // =====================================================
  // BULK ACTION HANDLERS
  // =====================================================

  const handleBulkDelete = useCallback(async () => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return

    startTransition(async () => {
      const result = await bulkDeleteRecords(objectDefinition.api_name, ids)
      if (result.success) {
        setSelectedIds(new Set())
        router.refresh()
      }
    })
    setShowDeleteDialog(false)
  }, [selectedIds, objectDefinition.api_name, router])

  // =====================================================
  // HELPERS
  // =====================================================

  const getRecordValue = (
    record: T,
    field: FieldWithPicklistValues
  ): unknown => {
    // Custom fields are nested in custom_fields
    if (field.is_custom_field) {
      const customFields = record.custom_fields as
        | Record<string, unknown>
        | undefined
      return customFields?.[field.api_name]
    }
    // Standard fields use column_name
    const key = field.column_name || field.api_name
    return record[key]
  }

  const totalPages = Math.ceil(totalCount / pageSize)
  const allSelected = data.length > 0 && selectedIds.size === data.length
  const someSelected = selectedIds.size > 0 && selectedIds.size < data.length

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <Card className="flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-border p-4">
        <div className="flex items-center gap-4">
          {/* Search */}
          {searchFields.length > 0 && (
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder={`Search ${objectDefinition.plural_label.toLowerCase()}...`}
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                className="w-64 pl-9"
              />
            </form>
          )}
        </div>

        <div className="flex items-center gap-2">{headerActions}</div>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && enableBulkActions && (
        <div className="flex items-center gap-4 border-b border-border bg-muted/50 px-4 py-2">
          <span className="text-sm font-medium">
            {selectedIds.size} selected
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
            disabled={isPending}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedIds(new Set())}
          >
            Clear selection
          </Button>
        </div>
      )}

      {/* Loading Overlay */}
      {(isLoading || isPending) && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Table */}
      <div className="relative overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/30">
            <tr>
              {/* Selection Column */}
              {enableBulkActions && (
                <th className="w-12 px-4 py-3">
                  <Checkbox
                    checked={someSelected ? 'indeterminate' : allSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all"
                  />
                </th>
              )}

              {/* Data Columns */}
              {columns.map(({ field }) => (
                <th
                  key={field.id}
                  className={cn(
                    'px-4 py-3 text-left font-medium text-muted-foreground',
                    'cursor-pointer hover:text-foreground transition-colors'
                  )}
                  onClick={() =>
                    handleSort(field.column_name || field.api_name)
                  }
                >
                  <div className="flex items-center gap-1">
                    {field.label}
                    {sortField === (field.column_name || field.api_name) &&
                      (sortDir === 'asc' ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      ))}
                  </div>
                </th>
              ))}

              {/* Actions Column */}
              <th className="w-12 px-4 py-3" />
            </tr>
          </thead>

          <tbody>
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + 2}
                  className="px-4 py-12 text-center text-muted-foreground"
                >
                  No {objectDefinition.plural_label.toLowerCase()} found
                </td>
              </tr>
            ) : (
              data.map(record => (
                <tr
                  key={record.id}
                  className={cn(
                    'border-b border-border hover:bg-muted/30 transition-colors',
                    selectedIds.has(record.id) && 'bg-muted/50'
                  )}
                >
                  {/* Selection */}
                  {enableBulkActions && (
                    <td className="px-4 py-3">
                      <Checkbox
                        checked={selectedIds.has(record.id)}
                        onCheckedChange={checked =>
                          handleSelectRow(record.id, checked as boolean)
                        }
                        aria-label={`Select row`}
                      />
                    </td>
                  )}

                  {/* Data Cells */}
                  {columns.map(({ field }, idx) => (
                    <td key={field.id} className="px-4 py-3">
                      {idx === 0 ? (
                        // First column links to record
                        <Link
                          href={`${basePath}/${record.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {formatCellValue(
                            getRecordValue(record, field),
                            field
                          )}
                        </Link>
                      ) : (
                        formatCellValue(getRecordValue(record, field), field)
                      )}
                    </td>
                  ))}

                  {/* Row Actions */}
                  <td className="px-4 py-3">
                    {rowActions ? (
                      rowActions(record)
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`${basePath}/${record.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`${basePath}/${record.id}/edit`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setSelectedIds(new Set([record.id]))
                              setShowDeleteDialog(true)
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border px-4 py-3">
          <div className="text-sm text-muted-foreground">
            Showing {(page - 1) * pageSize + 1} to{' '}
            {Math.min(page * pageSize, totalCount)} of {totalCount}{' '}
            {objectDefinition.plural_label.toLowerCase()}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1 || isPending}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages || isPending}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {selectedIds.size === 1 ? 'Record' : 'Records'}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selectedIds.size}{' '}
              {selectedIds.size === 1
                ? objectDefinition.label.toLowerCase()
                : objectDefinition.plural_label.toLowerCase()}
              . This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}

export type { ColumnDef }
