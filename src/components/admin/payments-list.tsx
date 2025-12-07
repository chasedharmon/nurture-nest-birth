'use client'

import { format } from 'date-fns'
import type { Payment } from '@/lib/supabase/types'

interface PaymentsListProps {
  payments: (Payment & {
    client_services?: { service_type: string; package_name?: string | null }
  })[]
  clientId: string
}

const paymentStatusColors: Record<string, string> = {
  pending:
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
  completed:
    'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
  refunded: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300',
}

const paymentMethodLabels: Record<string, string> = {
  stripe: '💳 Stripe',
  check: '✅ Check',
  cash: '💵 Cash',
  venmo: '💙 Venmo',
  zelle: '🟣 Zelle',
  other: '💰 Other',
}

export function PaymentsList({ payments }: PaymentsListProps) {
  if (payments.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        <p>No payments recorded yet</p>
        <p className="text-sm mt-1">Add a payment to track transactions</p>
      </div>
    )
  }

  // Calculate totals
  const totals = payments.reduce(
    (acc, payment) => {
      const amount = payment.amount || 0
      acc.total += amount

      if (payment.status === 'completed') {
        acc.paid += amount
      } else if (payment.status === 'pending') {
        acc.pending += amount
      } else if (payment.status === 'failed') {
        acc.failed += amount
      } else if (payment.status === 'refunded') {
        acc.refunded += amount
      }

      return acc
    },
    { total: 0, paid: 0, pending: 0, failed: 0, refunded: 0 }
  )

  return (
    <div className="space-y-6">
      {/* Payment Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-2xl font-bold">${totals.total.toLocaleString()}</p>
        </div>
        <div className="border border-border rounded-lg p-4 bg-green-50 dark:bg-green-950/20">
          <p className="text-sm text-muted-foreground">Paid</p>
          <p className="text-2xl font-bold text-green-600">
            ${totals.paid.toLocaleString()}
          </p>
        </div>
        <div className="border border-border rounded-lg p-4 bg-yellow-50 dark:bg-yellow-950/20">
          <p className="text-sm text-muted-foreground">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">
            ${totals.pending.toLocaleString()}
          </p>
        </div>
        <div className="border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Outstanding</p>
          <p className="text-2xl font-bold text-red-600">
            ${(totals.total - totals.paid).toLocaleString()}
          </p>
        </div>
        {totals.refunded > 0 && (
          <div className="border border-border rounded-lg p-4 bg-gray-50 dark:bg-gray-950/20">
            <p className="text-sm text-muted-foreground">Refunded</p>
            <p className="text-2xl font-bold text-gray-600">
              ${totals.refunded.toLocaleString()}
            </p>
          </div>
        )}
      </div>

      {/* Payment List */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Payment History</h3>
        <div className="space-y-3">
          {payments.map(payment => (
            <div
              key={payment.id}
              className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-foreground">
                      ${payment.amount.toLocaleString()}
                    </span>
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${paymentStatusColors[payment.status]}`}
                    >
                      {payment.status}
                    </span>
                    {payment.payment_method && (
                      <span className="text-sm text-muted-foreground">
                        {paymentMethodLabels[payment.payment_method]}
                      </span>
                    )}
                  </div>

                  <div className="mt-2 space-y-1 text-sm">
                    {payment.payment_date && (
                      <div>
                        <span className="font-medium text-muted-foreground">
                          Date:{' '}
                        </span>
                        <span className="text-foreground">
                          {format(
                            new Date(payment.payment_date),
                            'MMM d, yyyy'
                          )}
                        </span>
                      </div>
                    )}

                    {payment.client_services && (
                      <div>
                        <span className="font-medium text-muted-foreground">
                          Service:{' '}
                        </span>
                        <span className="text-foreground">
                          {payment.client_services.package_name ||
                            payment.client_services.service_type}
                        </span>
                      </div>
                    )}

                    {payment.transaction_id && (
                      <div>
                        <span className="font-medium text-muted-foreground">
                          Transaction ID:{' '}
                        </span>
                        <span className="text-foreground font-mono text-xs">
                          {payment.transaction_id}
                        </span>
                      </div>
                    )}

                    {payment.notes && (
                      <div className="mt-2">
                        <p className="text-muted-foreground">{payment.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
