'use client'

import { useState, useCallback, useTransition, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type {
  ListView,
  FilterCondition,
  ColumnConfig,
  ObjectType,
} from '@/lib/supabase/types'
import { ListViewToolbar } from './list-view-toolbar'
import { ListViewTable } from './list-view-table'
import { FilterBuilder } from './filter-builder'
import { ColumnSelector } from './column-selector'
import { ViewSaveDialog } from './view-save-dialog'
import { BulkActionBar } from './bulk-action-bar'
import { Card } from '@/components/ui/card'
import {
  updateListView,
  createListView,
  bulkUpdateStatus,
  bulkDelete,
  inlineUpdate,
} from '@/app/actions/list-views'

interface ListViewContainerProps<T> {
  objectType: ObjectType
  data: T[]
  totalCount: number
  views: ListView[]
  currentView: ListView | null
  defaultColumns: ColumnConfig[]
  filterOptions: Record<string, { value: string; label: string }[]>
  page: number
  pageSize: number
}

export function ListViewContainer<T extends { id: string }>({
  objectType,
  data,
  totalCount,
  views,
  currentView,
  defaultColumns,
  filterOptions,
  page,
  pageSize,
}: ListViewContainerProps<T>) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  // Local state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showFilterBuilder, setShowFilterBuilder] = useState(false)
  const [showColumnSelector, setShowColumnSelector] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [pendingFilters, setPendingFilters] = useState<FilterCondition[]>(
    currentView?.filters || []
  )
  const [pendingColumns, setPendingColumns] = useState<ColumnConfig[]>(
    currentView?.columns || defaultColumns
  )

  // Derived state
  const columns = currentView?.columns?.length
    ? currentView.columns
    : defaultColumns
  const sortConfig = useMemo(
    () =>
      currentView?.sort_config || {
        field: 'created_at',
        direction: 'desc' as const,
      },
    [currentView?.sort_config]
  )

  // Selection handlers
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

  // View change handler
  const handleViewChange = useCallback(
    (viewId: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (viewId) {
        params.set('view', viewId)
      } else {
        params.delete('view')
      }
      params.delete('page') // Reset to page 1
      router.push(`?${params.toString()}`)
    },
    [router, searchParams]
  )

  // Sort handler
  const handleSort = useCallback(
    (field: string) => {
      const newDirection =
        sortConfig.field === field && sortConfig.direction === 'asc'
          ? 'desc'
          : 'asc'

      const params = new URLSearchParams(searchParams.toString())
      params.set('sort', field)
      params.set('dir', newDirection)
      router.push(`?${params.toString()}`)
    },
    [router, searchParams, sortConfig]
  )

  // Pagination handler
  const handlePageChange = useCallback(
    (newPage: number) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('page', newPage.toString())
      router.push(`?${params.toString()}`)
    },
    [router, searchParams]
  )

  // Filter handlers
  const handleQuickFilter = useCallback(
    (field: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(field, value)
      } else {
        params.delete(field)
      }
      params.delete('page')
      router.push(`?${params.toString()}`)
    },
    [router, searchParams]
  )

  const handleSearchChange = useCallback(
    (search: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (search) {
        params.set('q', search)
      } else {
        params.delete('q')
      }
      params.delete('page')
      router.push(`?${params.toString()}`)
    },
    [router, searchParams]
  )

  const handleApplyFilters = useCallback(
    async (filters: FilterCondition[]) => {
      if (currentView) {
        startTransition(async () => {
          await updateListView(currentView.id, { filters })
          router.refresh()
        })
      }
      setPendingFilters(filters)
      setShowFilterBuilder(false)
    },
    [currentView, router]
  )

  // Column handlers
  const handleApplyColumns = useCallback(
    async (cols: ColumnConfig[]) => {
      if (currentView) {
        startTransition(async () => {
          await updateListView(currentView.id, { columns: cols })
          router.refresh()
        })
      }
      setPendingColumns(cols)
      setShowColumnSelector(false)
    },
    [currentView, router]
  )

  // Save view handler
  const handleSaveView = useCallback(
    async (name: string, visibility: 'private' | 'shared' | 'org') => {
      startTransition(async () => {
        await createListView({
          name,
          visibility,
          object_type: objectType,
          filters: pendingFilters,
          columns: pendingColumns,
          sort_config: sortConfig,
          is_default: false,
          is_pinned: false,
          view_mode: 'table',
          kanban_config: { statusField: 'status', cardFields: [] },
          quick_filters: [],
        })
        router.refresh()
      })
      setShowSaveDialog(false)
    },
    [objectType, pendingFilters, pendingColumns, sortConfig, router]
  )

  // Bulk action handlers
  const handleBulkAction = useCallback(
    async (action: string) => {
      const ids = Array.from(selectedIds)
      if (ids.length === 0) return

      startTransition(async () => {
        if (action === 'delete') {
          await bulkDelete(objectType, ids)
        } else {
          await bulkUpdateStatus(objectType, ids, action)
        }
        setSelectedIds(new Set())
        router.refresh()
      })
    },
    [selectedIds, objectType, router]
  )

  // Inline edit handler
  const handleInlineEdit = useCallback(
    async (id: string, field: string, value: unknown) => {
      startTransition(async () => {
        await inlineUpdate(objectType, id, field, value)
        router.refresh()
      })
    },
    [objectType, router]
  )

  // Calculate pagination
  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <Card className="flex flex-col">
      {/* Toolbar */}
      <ListViewToolbar
        objectType={objectType}
        views={views}
        currentView={currentView}
        filterOptions={filterOptions}
        searchValue={searchParams.get('q') || ''}
        onSearchChange={handleSearchChange}
        onViewChange={handleViewChange}
        onQuickFilter={handleQuickFilter}
        onOpenFilterBuilder={() => setShowFilterBuilder(true)}
        onOpenColumnSelector={() => setShowColumnSelector(true)}
        onSaveView={() => setShowSaveDialog(true)}
        selectedFilters={Object.fromEntries(
          Array.from(searchParams.entries()).filter(
            ([key]) => !['view', 'page', 'q', 'sort', 'dir'].includes(key)
          )
        )}
        // Export props
        data={data}
        columns={columns}
        filters={pendingFilters}
        selectedIds={selectedIds}
        totalCount={totalCount}
      />

      {/* Bulk Action Bar (shown when items selected) */}
      {selectedIds.size > 0 && (
        <BulkActionBar
          selectedCount={selectedIds.size}
          selectedIds={Array.from(selectedIds)}
          objectType={objectType}
          onAction={handleBulkAction}
          onClearSelection={() => setSelectedIds(new Set())}
          isPending={isPending}
          onAssignmentComplete={() => router.refresh()}
        />
      )}

      {/* Table */}
      <ListViewTable
        data={data}
        columns={columns}
        sortConfig={sortConfig}
        selectedIds={selectedIds}
        onSelectAll={handleSelectAll}
        onSelectRow={handleSelectRow}
        onSort={handleSort}
        onInlineEdit={handleInlineEdit}
        isPending={isPending}
        objectType={objectType}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border px-4 py-3">
          <div className="text-sm text-muted-foreground">
            Showing {(page - 1) * pageSize + 1} to{' '}
            {Math.min(page * pageSize, totalCount)} of {totalCount}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1 || isPending}
              className="rounded border border-border px-3 py-1 text-sm hover:bg-muted disabled:opacity-50"
            >
              Previous
            </button>
            <span className="flex items-center px-3 text-sm">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages || isPending}
              className="rounded border border-border px-3 py-1 text-sm hover:bg-muted disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <FilterBuilder
        open={showFilterBuilder}
        onOpenChange={setShowFilterBuilder}
        objectType={objectType}
        filters={pendingFilters}
        onApply={handleApplyFilters}
      />

      <ColumnSelector
        open={showColumnSelector}
        onOpenChange={setShowColumnSelector}
        columns={pendingColumns}
        defaultColumns={defaultColumns}
        onApply={handleApplyColumns}
      />

      <ViewSaveDialog
        open={showSaveDialog}
        onOpenChange={setShowSaveDialog}
        onSave={handleSaveView}
      />
    </Card>
  )
}
