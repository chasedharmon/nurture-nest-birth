'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  FileText,
  Shield,
  Trash2,
  XCircle,
} from 'lucide-react'

import {
  approveAccountDeletion,
  cancelAccountDeletion,
  getAccountDeletionRequests,
  getDataExportRequests,
  processDataExport,
  type AccountDeletionRequest,
  type DataExportRequest,
} from '@/app/actions/gdpr'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'

/**
 * GDPR Compliance Management Page
 *
 * Manages:
 * - Data export requests (Article 20 - Right to Data Portability)
 * - Account deletion requests (Article 17 - Right to Erasure)
 */
export default function GDPRManagementPage() {
  const searchParams = useSearchParams()
  const initialTab =
    searchParams.get('tab') === 'deletions' ? 'deletions' : 'exports'

  const [activeTab, setActiveTab] = useState(initialTab)
  const [exportRequests, setExportRequests] = useState<DataExportRequest[]>([])
  const [deletionRequests, setDeletionRequests] = useState<
    AccountDeletionRequest[]
  >([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  // Dialog states
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [cancellingRequest, setCancellingRequest] =
    useState<AccountDeletionRequest | null>(null)
  const [cancelReason, setCancelReason] = useState('')

  const loadData = async () => {
    setLoading(true)
    try {
      const [exportResult, deletionResult] = await Promise.all([
        getDataExportRequests(),
        getAccountDeletionRequests(),
      ])

      if (exportResult.success) setExportRequests(exportResult.data || [])
      if (deletionResult.success) setDeletionRequests(deletionResult.data || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleProcessExport = async (exportId: string) => {
    setProcessing(exportId)
    try {
      const result = await processDataExport(exportId)
      if (result.success) {
        await loadData()
      } else {
        alert(result.error || 'Failed to process export')
      }
    } finally {
      setProcessing(null)
    }
  }

  const handleApproveDeletion = async (requestId: string) => {
    setProcessing(requestId)
    try {
      const result = await approveAccountDeletion(requestId)
      if (result.success) {
        await loadData()
      } else {
        alert(result.error || 'Failed to approve deletion')
      }
    } finally {
      setProcessing(null)
    }
  }

  const handleCancelDeletion = async () => {
    if (!cancellingRequest) return

    setProcessing(cancellingRequest.id)
    try {
      const result = await cancelAccountDeletion(
        cancellingRequest.id,
        cancelReason
      )
      if (result.success) {
        setCancelDialogOpen(false)
        setCancellingRequest(null)
        setCancelReason('')
        await loadData()
      } else {
        alert(result.error || 'Failed to cancel deletion')
      }
    } finally {
      setProcessing(null)
    }
  }

  // Calculate stats
  const pendingExports = exportRequests.filter(
    e => e.status === 'pending'
  ).length
  const pendingDeletions = deletionRequests.filter(
    d => d.status === 'pending'
  ).length
  const approvedDeletions = deletionRequests.filter(
    d => d.status === 'approved'
  ).length

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          GDPR Compliance
        </h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          Manage data export and account deletion requests
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/50">
                <Download className="size-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingExports}</p>
                <p className="text-xs text-slate-500">Pending Exports</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-100 p-2 dark:bg-amber-900/50">
                <Clock className="size-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingDeletions}</p>
                <p className="text-xs text-slate-500">Pending Deletions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-red-100 p-2 dark:bg-red-900/50">
                <Trash2 className="size-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{approvedDeletions}</p>
                <p className="text-xs text-slate-500">Approved Deletions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-100 p-2 dark:bg-emerald-900/50">
                <Shield className="size-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {exportRequests.length + deletionRequests.length}
                </p>
                <p className="text-xs text-slate-500">Total Requests</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* GDPR Info Banner */}
      <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Shield className="mt-0.5 size-5 text-blue-600" />
            <div>
              <p className="font-medium text-blue-900 dark:text-blue-100">
                GDPR Compliance Requirements
              </p>
              <ul className="mt-2 space-y-1 text-sm text-blue-800 dark:text-blue-200">
                <li>
                  <strong>Article 17 (Right to Erasure):</strong> Process
                  deletion requests within 30 days
                </li>
                <li>
                  <strong>Article 20 (Data Portability):</strong> Provide data
                  exports in machine-readable format
                </li>
                <li>
                  <strong>Grace Period:</strong> 30-day grace period before
                  permanent deletion
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="exports" className="gap-2">
            <FileText className="size-4" />
            Data Exports
            {pendingExports > 0 && (
              <Badge variant="secondary" className="ml-1">
                {pendingExports}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="deletions" className="gap-2">
            <Trash2 className="size-4" />
            Account Deletions
            {pendingDeletions > 0 && (
              <Badge variant="destructive" className="ml-1">
                {pendingDeletions}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Data Exports Tab */}
        <TabsContent value="exports" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Data Export Requests</CardTitle>
              <CardDescription>
                Article 20 - Right to Data Portability requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-8 text-center text-slate-500">
                  Loading...
                </div>
              ) : exportRequests.length === 0 ? (
                <div className="py-8 text-center text-slate-500">
                  No data export requests
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Organization</TableHead>
                      <TableHead>Format</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Requested</TableHead>
                      <TableHead>Completed</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {exportRequests.map(request => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <span className="font-medium">
                            {request.organization?.name || 'Unknown'}
                          </span>
                        </TableCell>
                        <TableCell className="uppercase">
                          {request.file_format || 'json'}
                        </TableCell>
                        <TableCell>
                          <ExportStatusBadge status={request.status} />
                        </TableCell>
                        <TableCell className="text-slate-500">
                          {formatDate(request.requested_at)}
                        </TableCell>
                        <TableCell className="text-slate-500">
                          {request.completed_at
                            ? formatDate(request.completed_at)
                            : '—'}
                        </TableCell>
                        <TableCell>
                          {request.status === 'pending' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleProcessExport(request.id)}
                              disabled={processing === request.id}
                            >
                              {processing === request.id
                                ? 'Processing...'
                                : 'Process'}
                            </Button>
                          )}
                          {request.status === 'completed' &&
                            request.file_url && (
                              <Button variant="outline" size="sm" asChild>
                                <a
                                  href={request.file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Download className="mr-2 size-4" />
                                  Download
                                </a>
                              </Button>
                            )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Deletions Tab */}
        <TabsContent value="deletions" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Deletion Requests</CardTitle>
              <CardDescription>
                Article 17 - Right to Erasure requests (30-day grace period)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-8 text-center text-slate-500">
                  Loading...
                </div>
              ) : deletionRequests.length === 0 ? (
                <div className="py-8 text-center text-slate-500">
                  No deletion requests
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Organization</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Requested</TableHead>
                      <TableHead>Scheduled</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deletionRequests.map(request => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <span className="font-medium">
                            {request.organization_name || 'Unknown'}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-slate-500">
                          {request.reason || '—'}
                        </TableCell>
                        <TableCell>
                          <DeletionStatusBadge status={request.status} />
                        </TableCell>
                        <TableCell className="text-slate-500">
                          {formatDate(request.created_at)}
                        </TableCell>
                        <TableCell>
                          {request.scheduled_deletion_at ? (
                            <span
                              className={
                                isWithinDays(request.scheduled_deletion_at, 7)
                                  ? 'font-medium text-red-600'
                                  : 'text-slate-500'
                              }
                            >
                              {formatDate(request.scheduled_deletion_at)}
                            </span>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {request.status === 'pending' && (
                              <>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() =>
                                    handleApproveDeletion(request.id)
                                  }
                                  disabled={processing === request.id}
                                >
                                  Approve
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setCancellingRequest(request)
                                    setCancelDialogOpen(true)
                                  }}
                                  disabled={processing === request.id}
                                >
                                  Cancel
                                </Button>
                              </>
                            )}
                            {request.status === 'approved' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setCancellingRequest(request)
                                  setCancelDialogOpen(true)
                                }}
                                disabled={processing === request.id}
                              >
                                Cancel
                              </Button>
                            )}
                            {request.status === 'cancelled' && (
                              <span className="text-sm text-slate-500">
                                Cancelled
                              </span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Deletion Request</DialogTitle>
            <DialogDescription>
              Provide a reason for cancelling this deletion request. The
              organization owner will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="organization">Organization</Label>
              <Input
                id="organization"
                value={cancellingRequest?.organization_name || ''}
                disabled
              />
            </div>
            <div>
              <Label htmlFor="reason">Cancellation Reason</Label>
              <Textarea
                id="reason"
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                placeholder="Enter reason for cancellation..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCancelDialogOpen(false)
                setCancellingRequest(null)
                setCancelReason('')
              }}
            >
              Back
            </Button>
            <Button
              onClick={handleCancelDeletion}
              disabled={
                !cancelReason.trim() || processing === cancellingRequest?.id
              }
            >
              {processing === cancellingRequest?.id
                ? 'Cancelling...'
                : 'Cancel Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// =====================================================
// Helper Components & Functions
// =====================================================

function ExportStatusBadge({ status }: { status: string }) {
  const variants: Record<
    string,
    {
      icon: React.ReactNode
      variant: 'default' | 'secondary' | 'destructive' | 'outline'
    }
  > = {
    pending: { icon: <Clock className="mr-1 size-3" />, variant: 'secondary' },
    processing: {
      icon: <Clock className="mr-1 size-3 animate-spin" />,
      variant: 'secondary',
    },
    completed: {
      icon: <CheckCircle className="mr-1 size-3" />,
      variant: 'default',
    },
    failed: {
      icon: <XCircle className="mr-1 size-3" />,
      variant: 'destructive',
    },
  }

  const config = variants[status] ?? variants.pending

  return (
    <Badge variant={config!.variant} className="capitalize">
      {config!.icon}
      {status}
    </Badge>
  )
}

function DeletionStatusBadge({ status }: { status: string }) {
  const variants: Record<
    string,
    {
      icon: React.ReactNode
      variant: 'default' | 'secondary' | 'destructive' | 'outline'
      className: string
    }
  > = {
    pending: {
      icon: <Clock className="mr-1 size-3" />,
      variant: 'secondary',
      className: '',
    },
    approved: {
      icon: <AlertTriangle className="mr-1 size-3" />,
      variant: 'outline',
      className: 'border-amber-300 text-amber-700 bg-amber-50',
    },
    completed: {
      icon: <CheckCircle className="mr-1 size-3" />,
      variant: 'destructive',
      className: '',
    },
    cancelled: {
      icon: <XCircle className="mr-1 size-3" />,
      variant: 'outline',
      className: '',
    },
  }

  const config = variants[status] ?? variants.pending

  return (
    <Badge
      variant={config!.variant}
      className={`capitalize ${config!.className}`}
    >
      {config!.icon}
      {status}
    </Badge>
  )
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function isWithinDays(dateString: string, days: number): boolean {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = date.getTime() - now.getTime()
  const diffDays = diffTime / (1000 * 60 * 60 * 24)
  return diffDays <= days && diffDays > 0
}
