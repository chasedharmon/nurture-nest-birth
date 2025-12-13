'use client'

/**
 * ListViewToolbar - Unified toolbar for list view actions
 *
 * Contains:
 * - View selector dropdown
 * - Search input
 * - Filter button (with badge showing active filter count)
 * - Column selector button
 * - Save view button
 * - Export to CSV/Excel
 */

import { Search, Filter, Columns3, Save, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { ViewSelector, type SavedView } from './view-selector'
import { ExportButton } from '@/components/admin/export-button'
import type { FilterCondition } from '@/lib/crm/types'
import type { ColumnConfig } from './column-selector'
import type { ColumnConfig as ExportColumnConfig } from '@/lib/supabase/types'

interface ListViewToolbarProps {
  // View management
  views: SavedView[]
  currentViewId: string | null
  onViewChange: (viewId: string | null) => void
  onDeleteView?: (viewId: string) => Promise<void>
  onPinView?: (viewId: string, pinned: boolean) => Promise<void>
  currentUserId: string
  objectLabel: string

  // Search
  searchValue: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  enableSearch?: boolean

  // Filters
  filters: FilterCondition[]
  onOpenFilterBuilder: () => void

  // Columns
  onOpenColumnSelector: () => void
  visibleColumnCount: number
  totalColumnCount: number

  // Save view
  onOpenSaveDialog: () => void
  hasUnsavedChanges: boolean

  // Export
  exportData: Record<string, unknown>[]
  exportFilename: string
  exportColumns?: ColumnConfig[]
  selectedIds?: Set<string>
  totalCount?: number

  // Loading state
  isPending?: boolean
}

export function ListViewToolbar({
  views,
  currentViewId,
  onViewChange,
  onDeleteView,
  onPinView,
  currentUserId,
  objectLabel,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  enableSearch = true,
  filters,
  onOpenFilterBuilder,
  onOpenColumnSelector,
  visibleColumnCount,
  totalColumnCount,
  onOpenSaveDialog,
  hasUnsavedChanges,
  exportData,
  exportFilename,
  exportColumns,
  selectedIds,
  totalCount,
  isPending,
}: ListViewToolbarProps) {
  const activeFilterCount = filters.length

  // Convert ColumnConfig to export format
  const exportColumnsFormatted: ExportColumnConfig[] | undefined = exportColumns
    ? exportColumns
        .filter(col => col.visible)
        .map(col => ({
          field: col.apiName,
          label: col.label,
          visible: col.visible,
          sortable: col.sortable,
          width: col.width,
        }))
    : undefined

  return (
    <TooltipProvider>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
        {/* Left side: View selector + Search */}
        <div className="flex flex-wrap items-center gap-3">
          {/* View selector */}
          <ViewSelector
            views={views}
            currentViewId={currentViewId}
            onViewChange={onViewChange}
            onDeleteView={onDeleteView}
            onPinView={onPinView}
            currentUserId={currentUserId}
            objectLabel={objectLabel}
          />

          {/* Search */}
          {enableSearch && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder={
                  searchPlaceholder || `Search ${objectLabel.toLowerCase()}...`
                }
                value={searchValue}
                onChange={e => onSearchChange(e.target.value)}
                className="w-64 pl-9 pr-8"
                disabled={isPending}
              />
              {searchValue && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right side: Action buttons */}
        <div className="flex items-center gap-2">
          {/* Filter button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={activeFilterCount > 0 ? 'secondary' : 'outline'}
                size="sm"
                onClick={onOpenFilterBuilder}
                className={cn(
                  'relative',
                  activeFilterCount > 0 && 'border-primary/50'
                )}
              >
                <Filter className="mr-2 h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge
                    variant="default"
                    className="ml-2 h-5 min-w-[20px] rounded-full px-1.5"
                  >
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {activeFilterCount > 0
                ? `${activeFilterCount} filter${activeFilterCount !== 1 ? 's' : ''} active`
                : 'Add filters'}
            </TooltipContent>
          </Tooltip>

          {/* Column selector button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenColumnSelector}
              >
                <Columns3 className="mr-2 h-4 w-4" />
                Columns
                <span className="ml-1 text-xs text-muted-foreground">
                  ({visibleColumnCount}/{totalColumnCount})
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Customize columns</TooltipContent>
          </Tooltip>

          {/* Save view button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={hasUnsavedChanges ? 'default' : 'outline'}
                size="sm"
                onClick={onOpenSaveDialog}
              >
                <Save className="mr-2 h-4 w-4" />
                Save View
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {hasUnsavedChanges
                ? 'Save current configuration as a view'
                : 'Save as new view'}
            </TooltipContent>
          </Tooltip>

          {/* Export button */}
          <ExportButton
            data={exportData as (Record<string, unknown> & { id: string })[]}
            filename={exportFilename}
            columns={exportColumnsFormatted}
            selectedIds={selectedIds}
            totalCount={totalCount}
            disabled={isPending || exportData.length === 0}
          />
        </div>
      </div>
    </TooltipProvider>
  )
}
