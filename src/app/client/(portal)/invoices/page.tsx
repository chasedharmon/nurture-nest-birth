import { getClientSession } from '@/app/actions/client-auth'
import { getClientVisibleInvoices } from '@/app/actions/invoices'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { format } from 'date-fns'
import Link from 'next/link'
import { FileText, CheckCircle, Clock, AlertCircle, Send } from 'lucide-react'

const invoiceStatusConfig = {
  draft: {
    label: 'Pending',
    color: 'bg-muted text-muted-foreground',
    icon: Clock,
  },
  sent: {
    label: 'Awaiting Payment',
    color: 'bg-secondary/10 text-secondary',
    icon: Send,
  },
  paid: {
    label: 'Paid',
    color: 'bg-primary/10 text-primary',
    icon: CheckCircle,
  },
  partial: {
    label: 'Partial Payment',
    color: 'bg-secondary/10 text-secondary',
    icon: Clock,
  },
  overdue: {
    label: 'Overdue',
    color: 'bg-destructive/10 text-destructive',
    icon: AlertCircle,
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-muted text-muted-foreground',
    icon: FileText,
  },
  refunded: {
    label: 'Refunded',
    color: 'bg-muted text-muted-foreground',
    icon: FileText,
  },
}

export default async function ClientInvoicesPage() {
  const session = await getClientSession()

  if (!session) {
    return null
  }

  const result = await getClientVisibleInvoices(session.clientId)
  const invoices = result.success ? result.invoices || [] : []

  // Calculate totals
  const totals = invoices.reduce(
    (acc, invoice) => {
      acc.total += invoice.total || 0
      acc.paid += invoice.amount_paid || 0
      acc.outstanding += invoice.balance_due || 0
      return acc
    },
    { total: 0, paid: 0, outstanding: 0 }
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Invoices</h1>
        <p className="text-muted-foreground mt-2">
          View and manage your invoices
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Invoiced
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ${totals.total.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Amount Paid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              ${totals.paid.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-secondary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Outstanding Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">
              ${totals.outstanding.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoices List */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">
          Your Invoices
        </h2>
        {invoices.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No invoices yet.</p>
              <p className="text-sm text-muted-foreground mt-1">
                When your doula sends you an invoice, it will appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {invoices.map(invoice => {
              const status =
                invoiceStatusConfig[
                  invoice.status as keyof typeof invoiceStatusConfig
                ] || invoiceStatusConfig.sent
              const StatusIcon = status.icon
              const isOverdue =
                invoice.status !== 'paid' &&
                invoice.status !== 'cancelled' &&
                invoice.due_date &&
                new Date(invoice.due_date) < new Date()

              return (
                <Link key={invoice.id} href={`/client/invoices/${invoice.id}`}>
                  <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="p-2 bg-stone-100 rounded-lg">
                            <FileText className="h-5 w-5 text-stone-600" />
                          </div>

                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-foreground">
                                Invoice {invoice.invoice_number}
                              </p>
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${status.color}`}
                              >
                                <StatusIcon className="h-3 w-3" />
                                {isOverdue && invoice.status !== 'overdue'
                                  ? 'Overdue'
                                  : status.label}
                              </span>
                            </div>

                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              {invoice.issue_date && (
                                <span>
                                  Issued:{' '}
                                  {format(
                                    new Date(invoice.issue_date),
                                    'MMM d, yyyy'
                                  )}
                                </span>
                              )}
                              {invoice.due_date && (
                                <span
                                  className={
                                    isOverdue
                                      ? 'text-secondary font-medium'
                                      : ''
                                  }
                                >
                                  Due:{' '}
                                  {format(
                                    new Date(invoice.due_date),
                                    'MMM d, yyyy'
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-lg font-bold text-foreground">
                            ${invoice.total.toLocaleString()}
                          </p>
                          {invoice.balance_due > 0 &&
                            invoice.balance_due < invoice.total && (
                              <p className="text-sm text-muted-foreground">
                                ${invoice.balance_due.toLocaleString()} due
                              </p>
                            )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Payment Information */}
      {totals.outstanding > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-foreground">
              Payment Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              If you have any questions about your invoices or would like to
              make a payment, please contact your doula.
            </p>
            <p className="font-medium text-foreground">
              Accepted payment methods: Credit Card, Check, Cash, Venmo, Zelle
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
