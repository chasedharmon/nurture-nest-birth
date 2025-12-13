/**
 * Export types for data management
 */
import type { FilterCondition, ColumnConfig } from '@/lib/supabase/types'

export type ExportFormat = 'csv' | 'excel'

export interface ExportConfig {
  format: ExportFormat
  filename: string
  columns?: ColumnConfig[]
  filters?: FilterCondition[]
  includeMetadata?: boolean
}

export interface ExportScope {
  type: 'all' | 'page' | 'selected'
  selectedIds?: string[]
  pageSize?: number
  pageNumber?: number
}
