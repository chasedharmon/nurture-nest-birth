import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getClientSession } from '@/app/actions/client-auth'
import { getInvoice } from '@/app/actions/invoices'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import {
  ArrowLeft,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Printer,
} from 'lucide-react'
import { emailConfig } from '@/lib/email/config'
import type { InvoiceLineItem } from '@/lib/supabase/types'

const invoiceStatusConfig = {
  draft: {
    label: 'Pending',
    color: 'bg-gray-100 text-gray-800',
    icon: Clock,
  },
  sent: {
    label: 'Awaiting Payment',
    color: 'bg-blue-100 text-blue-800',
    icon: FileText,
  },
  paid: {
    label: 'Paid',
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle,
  },
  partial: {
    label: 'Partial Payment',
    color: 'bg-yellow-100 text-yellow-800',
    icon: Clock,
  },
  overdue: {
    label: 'Overdue',
    color: 'bg-red-100 text-red-800',
    icon: AlertCircle,
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-gray-100 text-gray-500',
    icon: FileText,
  },
  refunded: {
    label: 'Refunded',
    color: 'bg-purple-100 text-purple-800',
    icon: FileText,
  },
}

export default async function ClientInvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await getClientSession()

  if (!session) {
    return null
  }

  const result = await getInvoice(id)

  if (!result.success || !result.invoice) {
    notFound()
  }

  const invoice = result.invoice

  // Verify the invoice belongs to this client
  if (invoice.client_id !== session.clientId) {
    notFound()
  }

  const status =
    invoiceStatusConfig[invoice.status as keyof typeof invoiceStatusConfig] ||
    invoiceStatusConfig.sent
  const StatusIcon = status.icon
  const isOverdue =
    invoice.status !== 'paid' &&
    invoice.status !== 'cancelled' &&
    invoice.due_date &&
    new Date(invoice.due_date) < new Date()

  const lineItems = (invoice.line_items as InvoiceLineItem[]) || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/client/invoices">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Invoices
            </Button>
          </Link>
        </div>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-2" />
          Print
        </Button>
      </div>

      {/* Invoice Card */}
      <Card className="print:shadow-none print:border-none">
        <CardContent className="p-8">
          {/* Invoice Header */}
          <div className="flex justify-between items-start mb-10">
            <div>
              <div className="text-2xl font-bold text-[#8b7355]">
                {emailConfig.branding.name}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {emailConfig.doula.name}
              </div>
              {emailConfig.doula.phone && (
                <div className="text-sm text-muted-foreground">
                  {emailConfig.doula.phone}
                </div>
              )}
              {emailConfig.doula.email && (
                <div className="text-sm text-muted-foreground">
                  {emailConfig.doula.email}
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-foreground">INVOICE</div>
              <div className="text-sm text-muted-foreground mt-1">
                {invoice.invoice_number}
              </div>
              <div className="mt-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${status.color}`}
                >
                  <StatusIcon className="h-3 w-3" />
                  {isOverdue && invoice.status !== 'overdue'
                    ? 'Overdue'
                    : status.label}
                </span>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="flex justify-between mb-10">
            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase mb-2">
                Bill To
              </h4>
              <p className="font-medium text-foreground">{session.name}</p>
              <p className="text-muted-foreground">{session.email}</p>
            </div>
            <div className="text-right space-y-1 text-sm">
              {invoice.issue_date && (
                <div>
                  <span className="text-muted-foreground">Issue Date: </span>
                  <span className="text-foreground">
                    {format(new Date(invoice.issue_date), 'MMMM d, yyyy')}
                  </span>
                </div>
              )}
              {invoice.due_date && (
                <div>
                  <span className="text-muted-foreground">Due Date: </span>
                  <span
                    className={
                      isOverdue ? 'text-red-600 font-medium' : 'text-foreground'
                    }
                  >
                    {format(new Date(invoice.due_date), 'MMMM d, yyyy')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Line Items Table */}
          <table className="w-full mb-8">
            <thead>
              <tr className="border-b-2 border-border">
                <th className="text-left py-3 text-xs font-medium text-muted-foreground uppercase">
                  Description
                </th>
                <th className="text-right py-3 text-xs font-medium text-muted-foreground uppercase w-20">
                  Qty
                </th>
                <th className="text-right py-3 text-xs font-medium text-muted-foreground uppercase w-28">
                  Unit Price
                </th>
                <th className="text-right py-3 text-xs font-medium text-muted-foreground uppercase w-28">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item, index) => (
                <tr key={index} className="border-b border-border/50">
                  <td className="py-3 text-foreground">{item.description}</td>
                  <td className="py-3 text-right text-muted-foreground">
                    {item.quantity}
                  </td>
                  <td className="py-3 text-right text-muted-foreground">
                    ${item.unit_price.toFixed(2)}
                  </td>
                  <td className="py-3 text-right text-foreground font-medium">
                    ${item.total.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-72">
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-foreground">
                  ${invoice.subtotal.toFixed(2)}
                </span>
              </div>
              {invoice.tax_amount > 0 && (
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">
                    Tax ({((invoice.tax_rate || 0) * 100).toFixed(2)}%)
                  </span>
                  <span className="text-foreground">
                    ${invoice.tax_amount.toFixed(2)}
                  </span>
                </div>
              )}
              {invoice.discount_amount > 0 && (
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="text-red-600">
                    -${invoice.discount_amount.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between py-3 border-t-2 border-foreground mt-2">
                <span className="text-lg font-bold text-foreground">Total</span>
                <span className="text-lg font-bold text-foreground">
                  ${invoice.total.toFixed(2)}
                </span>
              </div>
              {invoice.amount_paid > 0 && (
                <>
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Amount Paid</span>
                    <span className="text-green-600">
                      -${invoice.amount_paid.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 font-bold">
                    <span className="text-foreground">Balance Due</span>
                    <span
                      className={
                        invoice.balance_due > 0
                          ? 'text-red-600'
                          : 'text-green-600'
                      }
                    >
                      ${invoice.balance_due.toFixed(2)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Notes */}
          {(invoice.client_notes || invoice.terms) && (
            <div className="mt-10 pt-6 border-t border-border">
              {invoice.client_notes && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">
                    Notes
                  </h4>
                  <p className="text-foreground whitespace-pre-wrap">
                    {invoice.client_notes}
                  </p>
                </div>
              )}
              {invoice.terms && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">
                    Terms & Conditions
                  </h4>
                  <p className="text-muted-foreground whitespace-pre-wrap text-sm">
                    {invoice.terms}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="mt-12 pt-6 border-t border-border text-center text-sm text-muted-foreground print:border-none">
            <p>Thank you for choosing {emailConfig.branding.name}!</p>
            {emailConfig.urls.website && (
              <p className="mt-1">{emailConfig.urls.website}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment Call to Action */}
      {invoice.balance_due > 0 && (
        <Card className="bg-amber-50 border-amber-200 print:hidden">
          <CardHeader>
            <CardTitle className="text-amber-900 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Payment Due: ${invoice.balance_due.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-amber-800">
            <p>
              Please contact your doula to arrange payment. We accept multiple
              payment methods for your convenience.
            </p>
            <p className="font-medium">
              Accepted payment methods: Credit Card, Check, Cash, Venmo, Zelle
            </p>
            {emailConfig.doula.phone && (
              <p className="pt-2">
                Contact: {emailConfig.doula.phone}
                {emailConfig.doula.email && ` or ${emailConfig.doula.email}`}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
