'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import type { Invoice, ClientService } from '@/lib/supabase/types'
import {
  sendInvoice,
  cancelInvoice,
  deleteInvoice,
} from '@/app/actions/invoices'
import { Button } from '@/components/ui/button'
import { AddInvoiceForm } from './add-invoice-form'
import { InvoicePreview } from './invoice-preview'
import {
  Send,
  Eye,
  Trash2,
  XCircle,
  MoreVertical,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface InvoicesListProps {
  invoices: Invoice[]
  clientId: string
  clientName: string
  clientEmail: string
  services?: ClientService[]
}

const invoiceStatusConfig: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  draft: {
    label: 'Draft',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300',
    icon: <FileText className="h-3 w-3" />,
  },
  sent: {
    label: 'Sent',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
    icon: <Send className="h-3 w-3" />,
  },
  paid: {
    label: 'Paid',
    color:
      'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
    icon: <CheckCircle className="h-3 w-3" />,
  },
  partial: {
    label: 'Partial',
    color:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
    icon: <Clock className="h-3 w-3" />,
  },
  overdue: {
    label: 'Overdue',
    color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
    icon: <AlertCircle className="h-3 w-3" />,
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300',
    icon: <XCircle className="h-3 w-3" />,
  },
  refunded: {
    label: 'Refunded',
    color:
      'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300',
    icon: <XCircle className="h-3 w-3" />,
  },
}

export function InvoicesList({
  invoices,
  clientId,
  clientName,
  clientEmail,
  services = [],
}: InvoicesListProps) {
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null)

  // Calculate totals
  const totals = invoices.reduce(
    (acc, invoice) => {
      acc.total += invoice.total || 0
      acc.paid += invoice.amount_paid || 0
      acc.outstanding += invoice.balance_due || 0

      if (invoice.status === 'overdue') {
        acc.overdue += invoice.balance_due || 0
      }

      return acc
    },
    { total: 0, paid: 0, outstanding: 0, overdue: 0 }
  )

  return (
    <div className="space-y-6">
      <AddInvoiceForm clientId={clientId} services={services} />

      {/* Invoice Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Invoiced</p>
          <p className="text-2xl font-bold">${totals.total.toLocaleString()}</p>
        </div>
        <div className="border border-border rounded-lg p-4 bg-green-50 dark:bg-green-950/20">
          <p className="text-sm text-muted-foreground">Paid</p>
          <p className="text-2xl font-bold text-green-600">
            ${totals.paid.toLocaleString()}
          </p>
        </div>
        <div className="border border-border rounded-lg p-4 bg-yellow-50 dark:bg-yellow-950/20">
          <p className="text-sm text-muted-foreground">Outstanding</p>
          <p className="text-2xl font-bold text-yellow-600">
            ${totals.outstanding.toLocaleString()}
          </p>
        </div>
        <div className="border border-border rounded-lg p-4 bg-red-50 dark:bg-red-950/20">
          <p className="text-sm text-muted-foreground">Overdue</p>
          <p className="text-2xl font-bold text-red-600">
            ${totals.overdue.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Invoice List */}
      {invoices.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No invoices created yet</p>
          <p className="text-sm mt-1">Create an invoice to bill this client</p>
        </div>
      ) : (
        <div>
          <h3 className="text-lg font-semibold mb-3">Invoices</h3>
          <div className="space-y-3">
            {invoices.map(invoice => (
              <InvoiceCard
                key={invoice.id}
                invoice={invoice}
                onPreview={() => setPreviewInvoice(invoice)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Invoice Preview Modal */}
      {previewInvoice && (
        <InvoicePreview
          invoice={previewInvoice}
          clientName={clientName}
          clientEmail={clientEmail}
          onClose={() => setPreviewInvoice(null)}
        />
      )}
    </div>
  )
}

function InvoiceCard({
  invoice,
  onPreview,
}: {
  invoice: Invoice
  onPreview: () => void
}) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const statusConfig =
    invoiceStatusConfig[invoice.status] ?? invoiceStatusConfig.draft!

  async function handleSend() {
    setIsProcessing(true)
    await sendInvoice(invoice.id)
    setIsProcessing(false)
  }

  async function handleCancel() {
    setIsProcessing(true)
    await cancelInvoice(invoice.id)
    setIsProcessing(false)
  }

  async function handleDelete() {
    setIsProcessing(true)
    await deleteInvoice(invoice.id)
    setIsProcessing(false)
    setShowDeleteConfirm(false)
  }

  const isOverdue =
    invoice.status !== 'paid' &&
    invoice.status !== 'cancelled' &&
    invoice.due_date &&
    new Date(invoice.due_date) < new Date()

  return (
    <div className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-sm font-medium">
              {invoice.invoice_number}
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${statusConfig.color}`}
            >
              {statusConfig.icon}
              {statusConfig.label}
            </span>
            {isOverdue && invoice.status !== 'overdue' && (
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium bg-red-100 text-red-800">
                <AlertCircle className="h-3 w-3" />
                Overdue
              </span>
            )}
          </div>

          <div className="mt-2 flex items-baseline gap-4">
            <span className="text-2xl font-bold">
              ${invoice.total.toLocaleString()}
            </span>
            {invoice.balance_due > 0 && invoice.status !== 'draft' && (
              <span className="text-sm text-muted-foreground">
                ${invoice.balance_due.toLocaleString()} due
              </span>
            )}
          </div>

          <div className="mt-2 space-y-1 text-sm text-muted-foreground">
            {invoice.issue_date && (
              <div>
                Issued: {format(new Date(invoice.issue_date), 'MMM d, yyyy')}
              </div>
            )}
            {invoice.due_date && (
              <div className={isOverdue ? 'text-red-600 font-medium' : ''}>
                Due: {format(new Date(invoice.due_date), 'MMM d, yyyy')}
              </div>
            )}
            {invoice.sent_at && (
              <div>
                Sent: {format(new Date(invoice.sent_at), 'MMM d, yyyy h:mm a')}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 ml-4">
          <Button variant="outline" size="sm" onClick={onPreview}>
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" disabled={isProcessing}>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {invoice.status === 'draft' && (
                <DropdownMenuItem onClick={handleSend} disabled={isProcessing}>
                  <Send className="h-4 w-4 mr-2" />
                  Send Invoice
                </DropdownMenuItem>
              )}
              {invoice.status === 'sent' && (
                <DropdownMenuItem onClick={handleSend} disabled={isProcessing}>
                  <Send className="h-4 w-4 mr-2" />
                  Resend Invoice
                </DropdownMenuItem>
              )}
              {(invoice.status === 'draft' || invoice.status === 'sent') && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleCancel}
                    disabled={isProcessing}
                    className="text-yellow-600"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel Invoice
                  </DropdownMenuItem>
                </>
              )}
              {invoice.status === 'draft' && (
                <>
                  <DropdownMenuSeparator />
                  {showDeleteConfirm ? (
                    <div className="px-2 py-1.5 text-sm">
                      <p className="mb-2">Delete this invoice?</p>
                      <div className="flex gap-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleDelete}
                          disabled={isProcessing}
                        >
                          Yes
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowDeleteConfirm(false)}
                        >
                          No
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <DropdownMenuItem
                      onClick={() => setShowDeleteConfirm(true)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Invoice
                    </DropdownMenuItem>
                  )}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
