import { getClientSession } from '@/app/actions/client-auth'
import {
  getClientPayments,
  getClientPaymentSummary,
} from '@/app/actions/payments'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { format } from 'date-fns'

const paymentMethodIcons = {
  stripe: '💳',
  check: '✍️',
  cash: '💵',
  venmo: '📱',
  zelle: '📱',
  other: '💰',
}

const paymentStatusColors = {
  pending: 'bg-secondary/10 text-secondary',
  completed: 'bg-primary/10 text-primary',
  failed: 'bg-destructive/10 text-destructive',
  refunded: 'bg-muted text-muted-foreground',
}

export default async function ClientPaymentsPage() {
  const session = await getClientSession()

  if (!session) {
    return null
  }

  const [paymentsResult, paymentSummaryResult] = await Promise.all([
    getClientPayments(session.clientId),
    getClientPaymentSummary(session.clientId),
  ])

  const payments = Array.isArray(paymentsResult) ? paymentsResult : []
  const paymentSummary =
    paymentSummaryResult && 'summary' in paymentSummaryResult
      ? paymentSummaryResult.summary
      : {
          total: 0,
          paid: 0,
          pending: 0,
          outstanding: 0,
        }

  // Sort payments by date (newest first)
  const sortedPayments = [...payments].sort((a, b) => {
    const dateA = a.payment_date
      ? new Date(a.payment_date)
      : new Date(a.created_at)
    const dateB = b.payment_date
      ? new Date(b.payment_date)
      : new Date(b.created_at)
    return dateB.getTime() - dateA.getTime()
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Payment History</h1>
        <p className="text-muted-foreground mt-2">
          View your payment history and account balance
        </p>
      </div>

      {/* Payment Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Amount
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ${paymentSummary.total.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Paid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              ${paymentSummary.paid.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">
              ${paymentSummary.pending.toLocaleString()}
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
              ${paymentSummary.outstanding.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">
          Transaction History
        </h2>
        {sortedPayments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No payment transactions yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {sortedPayments.map(payment => (
              <Card key={payment.id}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      {/* Payment Method Icon */}
                      <span className="text-2xl">
                        {paymentMethodIcons[
                          payment.payment_method as keyof typeof paymentMethodIcons
                        ] || '💰'}
                      </span>

                      {/* Payment Details */}
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-foreground">
                            ${payment.amount.toLocaleString()}
                          </p>
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${paymentStatusColors[payment.status as keyof typeof paymentStatusColors] || paymentStatusColors.pending}`}
                          >
                            {payment.status.toUpperCase()}
                          </span>
                        </div>

                        <p className="text-sm text-muted-foreground">
                          {payment.payment_date
                            ? format(
                                new Date(payment.payment_date),
                                'MMMM d, yyyy'
                              )
                            : format(
                                new Date(payment.created_at),
                                'MMMM d, yyyy'
                              )}
                        </p>

                        {payment.payment_method && (
                          <p className="text-sm text-muted-foreground">
                            via{' '}
                            {payment.payment_method.charAt(0).toUpperCase() +
                              payment.payment_method.slice(1)}
                          </p>
                        )}

                        {payment.service && (
                          <p className="text-sm text-muted-foreground">
                            For:{' '}
                            {payment.service.service_type
                              .replace('_', ' ')
                              .replace(/\b\w/g, (l: string) => l.toUpperCase())}
                            {payment.service.package_name &&
                              ` - ${payment.service.package_name}`}
                          </p>
                        )}

                        {payment.transaction_id && (
                          <p className="text-xs text-muted-foreground font-mono">
                            Transaction ID: {payment.transaction_id}
                          </p>
                        )}

                        {payment.notes && (
                          <p className="text-sm text-foreground mt-2 pt-2 border-t">
                            {payment.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Payment Information */}
      {paymentSummary.outstanding > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-foreground">
              Payment Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              If you have any questions about your balance or would like to make
              a payment, please contact your doula.
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
