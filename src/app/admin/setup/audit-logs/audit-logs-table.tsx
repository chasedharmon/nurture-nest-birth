'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Plus,
  Pencil,
  Trash2,
  LogIn,
  LogOut,
  Download,
  Upload,
  User,
} from 'lucide-react'
import type { AuditLog } from '@/app/actions/audit-logs'
import { AuditLogDetailDialog } from './audit-log-detail-dialog'

interface AuditLogsTableProps {
  logs: AuditLog[]
  currentPage: number
  totalPages: number
  total: number
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
  create: <Plus className="h-3 w-3" />,
  read: <Eye className="h-3 w-3" />,
  update: <Pencil className="h-3 w-3" />,
  delete: <Trash2 className="h-3 w-3" />,
  login: <LogIn className="h-3 w-3" />,
  logout: <LogOut className="h-3 w-3" />,
  export: <Download className="h-3 w-3" />,
  import: <Upload className="h-3 w-3" />,
}

const ACTION_COLORS: Record<string, string> = {
  create: 'bg-green-500/10 text-green-700 border-green-200',
  read: 'bg-blue-500/10 text-blue-700 border-blue-200',
  update: 'bg-yellow-500/10 text-yellow-700 border-yellow-200',
  delete: 'bg-red-500/10 text-red-700 border-red-200',
  login: 'bg-purple-500/10 text-purple-700 border-purple-200',
  logout: 'bg-gray-500/10 text-gray-700 border-gray-200',
  export: 'bg-cyan-500/10 text-cyan-700 border-cyan-200',
  import: 'bg-indigo-500/10 text-indigo-700 border-indigo-200',
}

export function AuditLogsTable({
  logs,
  currentPage,
  totalPages,
  total,
}: AuditLogsTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', newPage.toString())
    router.push(`?${params.toString()}`)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  const getActionBadge = (action: string) => {
    const icon = ACTION_ICONS[action] || <Eye className="h-3 w-3" />
    const colorClass = ACTION_COLORS[action] || 'bg-muted text-muted-foreground'

    return (
      <Badge variant="outline" className={`gap-1 capitalize ${colorClass}`}>
        {icon}
        {action}
      </Badge>
    )
  }

  const getUserDisplay = (log: AuditLog) => {
    if (log.user) {
      return (
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
            <User className="h-3 w-3 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {log.user.full_name || 'Unknown'}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {log.user.email}
            </p>
          </div>
        </div>
      )
    }
    return <span className="text-muted-foreground">System</span>
  }

  const getChangesSummary = (log: AuditLog) => {
    if (log.action === 'create' && log.new_values) {
      return `Created new ${log.entity_type}`
    }
    if (log.action === 'delete') {
      return `Deleted ${log.entity_type}`
    }
    if (log.action === 'update' && log.old_values && log.new_values) {
      const changedFields = Object.keys(log.new_values).filter(
        key => log.old_values?.[key] !== log.new_values?.[key]
      )
      if (changedFields.length === 0) return 'No changes'
      if (changedFields.length === 1) return `Updated ${changedFields[0]}`
      return `Updated ${changedFields.length} fields`
    }
    if (log.action === 'login') {
      return 'User logged in'
    }
    if (log.action === 'logout') {
      return 'User logged out'
    }
    return log.action
  }

  if (logs.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">No audit logs found</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Activity will appear here as users interact with the system
        </p>
      </div>
    )
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">Timestamp</TableHead>
            <TableHead className="w-[200px]">User</TableHead>
            <TableHead className="w-[100px]">Action</TableHead>
            <TableHead className="w-[120px]">Entity Type</TableHead>
            <TableHead>Changes</TableHead>
            <TableHead className="w-[60px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map(log => (
            <TableRow key={log.id} className="cursor-pointer hover:bg-muted/50">
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(log.created_at)}
              </TableCell>
              <TableCell>{getUserDisplay(log)}</TableCell>
              <TableCell>{getActionBadge(log.action)}</TableCell>
              <TableCell>
                <span className="text-sm capitalize">{log.entity_type}</span>
                {log.entity_id && (
                  <p className="truncate text-xs text-muted-foreground">
                    {log.entity_id.substring(0, 8)}...
                  </p>
                )}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {getChangesSummary(log)}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedLog(log)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * 50 + 1} -{' '}
            {Math.min(currentPage * 50, total)} of {total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Detail Dialog */}
      <AuditLogDetailDialog
        log={selectedLog}
        open={!!selectedLog}
        onOpenChange={open => !open && setSelectedLog(null)}
      />
    </>
  )
}
