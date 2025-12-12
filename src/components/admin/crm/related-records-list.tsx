'use client'

/**
 * RelatedRecordsList - Displays related records in a simple table format
 *
 * Used within record detail pages to show related records like
 * Opportunities for a Contact, Activities for an Account, etc.
 */

import Link from 'next/link'
import { Plus, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// =====================================================
// TYPES
// =====================================================

export interface DisplayColumn {
  field: string
  label: string
  format?: 'text' | 'date' | 'datetime' | 'currency' | 'badge'
}

export interface RelatedRecordsListProps<T extends { id: string }> {
  /** Section title */
  title: string
  /** Object API name for linking (currently unused, for future extensibility) */
  objectApiName: string
  /** Records to display */
  records: T[]
  /** Total count (may be more than displayed) */
  totalCount: number
  /** Message when no records */
  emptyMessage: string
  /** Base path for record links */
  basePath: string
  /** Columns to display */
  displayColumns: DisplayColumn[]
  /** Path for "New" button (optional) */
  newRecordPath?: string
  /** Click handler for "View All" */
  onViewAll?: () => void
}

// =====================================================
// VALUE FORMATTERS
// =====================================================

function formatValue(
  value: unknown,
  format?: DisplayColumn['format']
): React.ReactNode {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground">—</span>
  }

  switch (format) {
    case 'date':
      try {
        return new Date(value as string).toLocaleDateString()
      } catch {
        return String(value)
      }

    case 'datetime':
      try {
        return new Date(value as string).toLocaleString()
      } catch {
        return String(value)
      }

    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(value as number)

    case 'badge':
      return <Badge variant="secondary">{String(value)}</Badge>

    default:
      return String(value)
  }
}

// =====================================================
// MAIN COMPONENT
// =====================================================

export function RelatedRecordsList<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T extends { id: string; [key: string]: any },
>({
  title,
  objectApiName: _objectApiName,
  records,
  totalCount,
  emptyMessage,
  basePath,
  displayColumns,
  newRecordPath,
  onViewAll,
}: RelatedRecordsListProps<T>) {
  const hasMore = totalCount > records.length

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between py-4">
        <CardTitle className="text-base font-medium">
          {title}
          {totalCount > 0 && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({totalCount})
            </span>
          )}
        </CardTitle>
        <div className="flex items-center gap-2">
          {newRecordPath && (
            <Link href={newRecordPath}>
              <Button variant="outline" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                New
              </Button>
            </Link>
          )}
          {hasMore && (
            <Button variant="ghost" size="sm" onClick={onViewAll}>
              View All
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {records.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {displayColumns.map(col => (
                    <th
                      key={col.field}
                      className="px-4 py-2 text-left font-medium text-muted-foreground"
                    >
                      {col.label}
                    </th>
                  ))}
                  <th className="w-12 px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {records.map(record => (
                  <tr
                    key={record.id}
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    {displayColumns.map((col, idx) => (
                      <td key={col.field} className="px-4 py-3">
                        {idx === 0 ? (
                          <Link
                            href={`${basePath}/${record.id}`}
                            className="font-medium text-primary hover:underline"
                          >
                            {formatValue(record[col.field], col.format)}
                          </Link>
                        ) : (
                          formatValue(record[col.field], col.format)
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <Link
                        href={`${basePath}/${record.id}`}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
