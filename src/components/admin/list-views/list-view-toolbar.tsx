'use client'

import { useState } from 'react'
import { Search, Filter, Columns, ChevronDown, Save, X } from 'lucide-react'
import type {
  ListView,
  ObjectType,
  FilterCondition,
  ColumnConfig,
} from '@/lib/supabase/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { ExportButton } from '@/components/admin/export-button'

interface ListViewToolbarProps<
  T extends Record<string, unknown> & { id: string },
> {
  objectType: ObjectType
  views: ListView[]
  currentView: ListView | null
  filterOptions: Record<string, { value: string; label: string }[]>
  searchValue: string
  selectedFilters: Record<string, string>
  onSearchChange: (value: string) => void
  onViewChange: (viewId: string | null) => void
  onQuickFilter: (field: string, value: string | null) => void
  onOpenFilterBuilder: () => void
  onOpenColumnSelector: () => void
  onSaveView: () => void
  // Export props
  data: T[]
  columns: ColumnConfig[]
  filters: FilterCondition[]
  selectedIds: Set<string>
  totalCount: number
}

export function ListViewToolbar<
  T extends Record<string, unknown> & { id: string },
>({
  objectType,
  views,
  currentView,
  filterOptions,
  searchValue,
  selectedFilters,
  onSearchChange,
  onViewChange,
  onQuickFilter,
  onOpenFilterBuilder,
  onOpenColumnSelector,
  onSaveView,
  // Export props
  data,
  columns,
  filters,
  selectedIds,
  totalCount,
}: ListViewToolbarProps<T>) {
  const [localSearch, setLocalSearch] = useState(searchValue)

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearchChange(localSearch)
  }

  const handleClearSearch = () => {
    setLocalSearch('')
    onSearchChange('')
  }

  const activeFilterCount = Object.keys(selectedFilters).length

  return (
    <div className="border-b border-border p-4">
      {/* Top row: View selector and search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* View Selector */}
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="min-w-[180px] justify-between"
              >
                <span className="truncate">
                  {currentView?.name || 'All Records'}
                </span>
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[220px]">
              <DropdownMenuItem onClick={() => onViewChange(null)}>
                All Records
              </DropdownMenuItem>
              {views.length > 0 && <DropdownMenuSeparator />}
              {views
                .filter(v => v.is_pinned)
                .map(view => (
                  <DropdownMenuItem
                    key={view.id}
                    onClick={() => onViewChange(view.id)}
                    className={currentView?.id === view.id ? 'bg-muted' : ''}
                  >
                    <span className="mr-2">📌</span>
                    {view.name}
                  </DropdownMenuItem>
                ))}
              {views.filter(v => v.is_pinned).length > 0 &&
                views.filter(v => !v.is_pinned).length > 0 && (
                  <DropdownMenuSeparator />
                )}
              {views
                .filter(v => !v.is_pinned)
                .map(view => (
                  <DropdownMenuItem
                    key={view.id}
                    onClick={() => onViewChange(view.id)}
                    className={currentView?.id === view.id ? 'bg-muted' : ''}
                  >
                    {view.name}
                    {view.visibility === 'shared' && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        Shared
                      </Badge>
                    )}
                  </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Save View Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onSaveView}
            title="Save as new view"
          >
            <Save className="h-4 w-4" />
          </Button>
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search..."
              value={localSearch}
              onChange={e => setLocalSearch(e.target.value)}
              className="w-[250px] pl-9 pr-8"
            />
            {localSearch && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>
      </div>

      {/* Bottom row: Quick filters and actions */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {/* Quick Filters */}
        {Object.entries(filterOptions).map(([field, options]) => (
          <DropdownMenu key={field}>
            <DropdownMenuTrigger asChild>
              <Button
                variant={selectedFilters[field] ? 'default' : 'outline'}
                size="sm"
                className="h-8"
              >
                {selectedFilters[field]
                  ? options.find(o => o.value === selectedFilters[field])
                      ?.label || field
                  : field.charAt(0).toUpperCase() +
                    field.slice(1).replace('_', ' ')}
                <ChevronDown className="ml-1 h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => onQuickFilter(field, null)}>
                All
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {options.map(option => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => onQuickFilter(field, option.value)}
                  className={
                    selectedFilters[field] === option.value ? 'bg-muted' : ''
                  }
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ))}

        {/* Clear Filters */}
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-muted-foreground"
            onClick={() => {
              Object.keys(selectedFilters).forEach(field =>
                onQuickFilter(field, null)
              )
            }}
          >
            Clear filters ({activeFilterCount})
          </Button>
        )}

        <div className="flex-1" />

        {/* Advanced Filter */}
        <Button
          variant="outline"
          size="sm"
          className="h-8"
          onClick={onOpenFilterBuilder}
        >
          <Filter className="mr-1 h-3 w-3" />
          Advanced
        </Button>

        {/* Column Selector */}
        <Button
          variant="outline"
          size="sm"
          className="h-8"
          onClick={onOpenColumnSelector}
        >
          <Columns className="mr-1 h-3 w-3" />
          Columns
        </Button>

        {/* Export Button */}
        <ExportButton
          data={data}
          filename={objectType}
          columns={columns}
          filters={filters}
          selectedIds={selectedIds}
          totalCount={totalCount}
        />
      </div>
    </div>
  )
}
