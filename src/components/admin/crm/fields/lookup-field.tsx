'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, X, Loader2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { BaseFieldProps } from './field-types'
import { isLookupFieldConfig } from './field-types'
import type { LookupFieldConfig } from '@/lib/crm/types'

/**
 * Record option returned from search
 */
interface LookupRecord {
  id: string
  display_value: string
  secondary_value?: string
}

/**
 * Props for the lookup search function
 */
interface LookupSearchProps {
  objectApiName: string
  searchTerm: string
  limit?: number
}

/**
 * LookupField - Relationship field with search modal
 *
 * Allows selecting related records from another object.
 * Supports search, recent items, and clear functionality.
 */
export function LookupField({
  field,
  value,
  onChange,
  disabled,
  readOnly,
  error,
  className,
  onSearch,
  onRecordClick,
}: BaseFieldProps & {
  /** Function to search for related records */
  onSearch?: (props: LookupSearchProps) => Promise<LookupRecord[]>
  /** Function called when clicking the record link in read-only mode */
  onRecordClick?: (recordId: string, objectApiName: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [results, setResults] = useState<LookupRecord[]>([])
  const [selectedRecord, setSelectedRecord] = useState<LookupRecord | null>(
    null
  )

  const config = field.type_config as LookupFieldConfig
  const relatedObjectApiName = isLookupFieldConfig(config)
    ? config.relatedObjectApiName
    : ''

  const loadSelectedRecord = useCallback(
    async (recordId: string) => {
      if (!onSearch) return

      try {
        setIsSearching(true)
        // Search by ID to get display value
        const results = await onSearch({
          objectApiName: relatedObjectApiName,
          searchTerm: recordId,
          limit: 1,
        })
        if (results.length > 0) {
          setSelectedRecord(results[0] ?? null)
        }
      } finally {
        setIsSearching(false)
      }
    },
    [onSearch, relatedObjectApiName]
  )

  // Load selected record display value on mount
  useEffect(() => {
    if (value && typeof value === 'string' && onSearch && !selectedRecord) {
      // Fetch the display value for the selected ID
      loadSelectedRecord(value)
    }
  }, [value, onSearch, selectedRecord, loadSelectedRecord])

  const handleSearch = useCallback(
    async (term: string) => {
      if (!onSearch || !term.trim()) {
        setResults([])
        return
      }

      try {
        setIsSearching(true)
        const searchResults = await onSearch({
          objectApiName: relatedObjectApiName,
          searchTerm: term,
          limit: 10,
        })
        setResults(searchResults)
      } catch (err) {
        console.error('Lookup search error:', err)
        setResults([])
      } finally {
        setIsSearching(false)
      }
    },
    [onSearch, relatedObjectApiName]
  )

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(searchTerm)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm, handleSearch])

  const handleSelect = (record: LookupRecord) => {
    onChange(record.id)
    setSelectedRecord(record)
    setOpen(false)
    setSearchTerm('')
  }

  const handleClear = () => {
    onChange(null)
    setSelectedRecord(null)
  }

  if (readOnly) {
    return (
      <div className={cn('text-sm py-2', className)}>
        {selectedRecord || value ? (
          <button
            type="button"
            onClick={() => onRecordClick?.(String(value), relatedObjectApiName)}
            className="text-primary hover:underline flex items-center gap-1"
          >
            {selectedRecord?.display_value || String(value)}
            <ExternalLink className="h-3 w-3" />
          </button>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </div>
    )
  }

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setOpen(true)}
          disabled={disabled}
          aria-invalid={!!error}
          className={cn(
            'flex-1 justify-start text-left font-normal',
            !selectedRecord && !value && 'text-muted-foreground'
          )}
        >
          <Search className="mr-2 h-4 w-4 shrink-0" />
          {selectedRecord?.display_value ||
            (value ? 'Loading...' : 'Search...')}
        </Button>
        {Boolean(selectedRecord || value) && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleClear}
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Search Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select {field.label}</DialogTitle>
            <DialogDescription>
              Search for a {relatedObjectApiName.toLowerCase()} record
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9"
                autoFocus
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>

            <ScrollArea className="h-[300px]">
              {results.length > 0 ? (
                <div className="space-y-1">
                  {results.map(record => (
                    <button
                      key={record.id}
                      type="button"
                      onClick={() => handleSelect(record)}
                      className="w-full text-left p-3 rounded-md hover:bg-muted transition-colors"
                    >
                      <p className="font-medium">{record.display_value}</p>
                      {record.secondary_value && (
                        <p className="text-sm text-muted-foreground">
                          {record.secondary_value}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              ) : searchTerm && !isSearching ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                  <p className="text-muted-foreground">No results found</p>
                  <p className="text-sm text-muted-foreground">
                    Try a different search term
                  </p>
                </div>
              ) : !searchTerm ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                  <Search className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">
                    Start typing to search
                  </p>
                </div>
              ) : null}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/**
 * MasterDetailField - Non-nullable lookup (child to parent relationship)
 *
 * Same as LookupField but marks the relationship as required
 * and typically cascades deletes.
 */
export function MasterDetailField(
  props: BaseFieldProps & {
    onSearch?: (props: LookupSearchProps) => Promise<LookupRecord[]>
    onRecordClick?: (recordId: string, objectApiName: string) => void
  }
) {
  // Master-detail is essentially the same UI as lookup
  // The difference is in the database relationship (cascade delete)
  return <LookupField {...props} />
}

export type { LookupRecord, LookupSearchProps }
