'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  LogIn,
  LogOut,
  Download,
  Upload,
  User,
  Clock,
  Globe,
  Monitor,
  FileText,
  ArrowRight,
} from 'lucide-react'
import type { AuditLog } from '@/app/actions/audit-logs'

interface AuditLogDetailDialogProps {
  log: AuditLog | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
  create: <Plus className="h-4 w-4" />,
  read: <Eye className="h-4 w-4" />,
  update: <Pencil className="h-4 w-4" />,
  delete: <Trash2 className="h-4 w-4" />,
  login: <LogIn className="h-4 w-4" />,
  logout: <LogOut className="h-4 w-4" />,
  export: <Download className="h-4 w-4" />,
  import: <Upload className="h-4 w-4" />,
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

export function AuditLogDetailDialog({
  log,
  open,
  onOpenChange,
}: AuditLogDetailDialogProps) {
  if (!log) return null

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    })
  }

  const getActionBadge = (action: string) => {
    const icon = ACTION_ICONS[action] || <Eye className="h-4 w-4" />
    const colorClass = ACTION_COLORS[action] || 'bg-muted text-muted-foreground'

    return (
      <Badge variant="outline" className={`gap-1.5 capitalize ${colorClass}`}>
        {icon}
        {action}
      </Badge>
    )
  }

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return 'null'
    if (typeof value === 'object') return JSON.stringify(value, null, 2)
    return String(value)
  }

  // Get changed fields for update actions
  const getChangedFields = () => {
    if (log.action !== 'update' || !log.old_values || !log.new_values) {
      return null
    }

    const allKeys = new Set([
      ...Object.keys(log.old_values),
      ...Object.keys(log.new_values),
    ])

    const changes: {
      field: string
      oldValue: unknown
      newValue: unknown
    }[] = []

    allKeys.forEach(key => {
      const oldVal = log.old_values?.[key]
      const newVal = log.new_values?.[key]

      // Compare JSON stringified values for deep equality
      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        changes.push({
          field: key,
          oldValue: oldVal,
          newValue: newVal,
        })
      }
    })

    return changes
  }

  const changedFields = getChangedFields()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <FileText className="h-5 w-5" />
            Audit Log Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary Section */}
          <div className="flex flex-wrap items-center gap-3">
            {getActionBadge(log.action)}
            <Badge variant="secondary" className="capitalize">
              {log.entity_type}
            </Badge>
          </div>

          <Separator />

          {/* User Information */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">
              User Information
            </h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <User className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    {log.user?.full_name || 'Unknown User'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {log.user?.email || log.user_id || 'System'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Timestamp</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(log.created_at)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Request Context */}
          {(log.ip_address || log.user_agent) && (
            <>
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Request Context
                </h4>
                <div className="grid gap-3">
                  {log.ip_address && (
                    <div className="flex items-start gap-3">
                      <Globe className="mt-0.5 h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">IP Address</p>
                        <p className="text-xs text-muted-foreground">
                          {log.ip_address}
                        </p>
                      </div>
                    </div>
                  )}
                  {log.user_agent && (
                    <div className="flex items-start gap-3">
                      <Monitor className="mt-0.5 h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">User Agent</p>
                        <p className="break-all text-xs text-muted-foreground">
                          {log.user_agent}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Entity Information */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">
              Entity Information
            </h4>
            <div className="rounded-md border bg-muted/50 p-3">
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="font-medium capitalize">
                    {log.entity_type}
                  </span>
                </div>
                {log.entity_id && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ID:</span>
                    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                      {log.entity_id}
                    </code>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Changes Section (for updates) */}
          {changedFields && changedFields.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Changes ({changedFields.length} field
                  {changedFields.length !== 1 ? 's' : ''} modified)
                </h4>
                <div className="space-y-3">
                  {changedFields.map(({ field, oldValue, newValue }) => (
                    <div
                      key={field}
                      className="rounded-md border bg-muted/30 p-3"
                    >
                      <p className="mb-2 text-sm font-medium">{field}</p>
                      <div className="grid gap-2 sm:grid-cols-[1fr_auto_1fr]">
                        <div className="rounded bg-red-50 p-2 dark:bg-red-900/20">
                          <p className="mb-1 text-xs text-red-600 dark:text-red-400">
                            Previous
                          </p>
                          <pre className="max-h-20 overflow-auto whitespace-pre-wrap break-all font-mono text-xs">
                            {formatValue(oldValue)}
                          </pre>
                        </div>
                        <div className="hidden items-center justify-center sm:flex">
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="rounded bg-green-50 p-2 dark:bg-green-900/20">
                          <p className="mb-1 text-xs text-green-600 dark:text-green-400">
                            New
                          </p>
                          <pre className="max-h-20 overflow-auto whitespace-pre-wrap break-all font-mono text-xs">
                            {formatValue(newValue)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* New Values (for creates) */}
          {log.action === 'create' && log.new_values && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Created Record
                </h4>
                <div className="rounded-md border bg-green-50 p-3 dark:bg-green-900/20">
                  <pre className="max-h-60 overflow-auto whitespace-pre-wrap break-all font-mono text-xs">
                    {JSON.stringify(log.new_values, null, 2)}
                  </pre>
                </div>
              </div>
            </>
          )}

          {/* Old Values (for deletes) */}
          {log.action === 'delete' && log.old_values && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Deleted Record
                </h4>
                <div className="rounded-md border bg-red-50 p-3 dark:bg-red-900/20">
                  <pre className="max-h-60 overflow-auto whitespace-pre-wrap break-all font-mono text-xs">
                    {JSON.stringify(log.old_values, null, 2)}
                  </pre>
                </div>
              </div>
            </>
          )}

          {/* Metadata */}
          {log.metadata && Object.keys(log.metadata).length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Additional Metadata
                </h4>
                <div className="rounded-md border bg-muted/50 p-3">
                  <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-all font-mono text-xs">
                    {JSON.stringify(log.metadata, null, 2)}
                  </pre>
                </div>
              </div>
            </>
          )}

          {/* Log ID */}
          <Separator />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Log ID:</span>
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono">
              {log.id}
            </code>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
