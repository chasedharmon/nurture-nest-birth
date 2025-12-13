'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react'
import { exportToCSV } from '@/lib/export/csv'
import { toast } from 'sonner'

interface AuditLogExportProps {
  filters: {
    search?: string
    action?: string
    entityType?: string
    userId?: string
    dateFrom?: string
    dateTo?: string
  }
}

interface ExportAuditLog {
  timestamp: string
  user_name: string
  user_email: string
  action: string
  entity_type: string
  entity_id: string
  changes_summary: string
  ip_address: string
  user_agent: string
}

export function AuditLogExport({ filters }: AuditLogExportProps) {
  const [isExporting, setIsExporting] = useState(false)

  const fetchAllLogs = async (): Promise<ExportAuditLog[]> => {
    // Build query params from filters
    const params = new URLSearchParams()

    if (filters.search) params.set('search', filters.search)
    if (filters.action) params.set('action', filters.action)
    if (filters.entityType) params.set('entityType', filters.entityType)
    if (filters.userId) params.set('userId', filters.userId)
    if (filters.dateFrom) params.set('dateFrom', filters.dateFrom)
    if (filters.dateTo) params.set('dateTo', filters.dateTo)

    // Fetch up to 10,000 records for export
    const response = await fetch(`/api/audit-logs/export?${params.toString()}`)

    if (!response.ok) {
      throw new Error('Failed to fetch audit logs for export')
    }

    const data = await response.json()
    return data.logs as ExportAuditLog[]
  }

  const handleExportCSV = async () => {
    setIsExporting(true)

    try {
      const logs = await fetchAllLogs()

      if (logs.length === 0) {
        toast.info('No logs to export', {
          description: 'Try adjusting your filters',
        })
        return
      }

      // Transform logs for CSV
      const exportData = logs.map(log => ({
        timestamp: log.timestamp,
        user_name: log.user_name,
        user_email: log.user_email,
        action: log.action,
        entity_type: log.entity_type,
        entity_id: log.entity_id || '',
        changes_summary: log.changes_summary,
        ip_address: log.ip_address || '',
        user_agent: log.user_agent || '',
      }))

      exportToCSV(exportData, {
        filename: 'audit_logs',
        includeMetadata: true,
        columns: [
          { field: 'timestamp', label: 'Timestamp', visible: true },
          { field: 'user_name', label: 'User Name', visible: true },
          { field: 'user_email', label: 'User Email', visible: true },
          { field: 'action', label: 'Action', visible: true },
          { field: 'entity_type', label: 'Entity Type', visible: true },
          { field: 'entity_id', label: 'Entity ID', visible: true },
          { field: 'changes_summary', label: 'Changes', visible: true },
          { field: 'ip_address', label: 'IP Address', visible: true },
          { field: 'user_agent', label: 'User Agent', visible: true },
        ],
      })

      toast.success(
        `Exported ${logs.length} audit log${logs.length !== 1 ? 's' : ''}`
      )
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportJSON = async () => {
    setIsExporting(true)

    try {
      const logs = await fetchAllLogs()

      if (logs.length === 0) {
        toast.info('No logs to export', {
          description: 'Try adjusting your filters',
        })
        return
      }

      // Create JSON blob
      const blob = new Blob([JSON.stringify(logs, null, 2)], {
        type: 'application/json',
      })

      // Download
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      const timestamp = new Date().toISOString().split('T')[0]
      link.href = url
      link.download = `audit_logs_${timestamp}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success(
        `Exported ${logs.length} audit log${logs.length !== 1 ? 's' : ''}`
      )
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isExporting}>
          {isExporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Export
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportCSV}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportJSON}>
          <FileText className="mr-2 h-4 w-4" />
          Export as JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
