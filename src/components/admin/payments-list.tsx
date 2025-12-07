'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import type { Payment, ClientService } from '@/lib/supabase/types'
import { deletePayment, updatePaymentStatus } from '@/app/actions/payments'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select-native'
import { AddPaymentForm } from './add-payment-form'

interface PaymentsListProps {
  payments: (Payment & {
    client_services?: { service_type: string; package_name?: string | null }
  })[]
  clientId: string
  services?: ClientService[]
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
  stripe: 'Stripe',
  check: 'Check',
  cash: 'Cash',
  venmo: 'Venmo',
  zelle: 'Zelle',
  other: 'Other',
}

const paymentStatuses = [
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
  { value: 'refunded', label: 'Refunded' },
]

export function PaymentsList({
  payments,
  clientId,
  services = [],
}: PaymentsListProps) {
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
      <AddPaymentForm clientId={clientId} services={services} />

      {/* Payment Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
      </div>

      {/* Payment List */}
      {payments.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">
          <p>No payments recorded yet</p>
          <p className="text-sm mt-1">Add a payment to track transactions</p>
        </div>
      ) : (
        <div>
          <h3 className="text-lg font-semibold mb-3">Payment History</h3>
          <div className="space-y-3">
            {payments.map(payment => (
              <PaymentCard key={payment.id} payment={payment} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function PaymentCard({
  payment,
}: {
  payment: Payment & {
    client_services?: { service_type: string; package_name?: string | null }
  }
}) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  async function handleStatusChange(newStatus: string) {
    setIsUpdating(true)
    await updatePaymentStatus(
      payment.id,
      newStatus as 'pending' | 'completed' | 'failed' | 'refunded'
    )
    setIsUpdating(false)
  }

  async function handleDelete() {
    setIsDeleting(true)
    await deletePayment(payment.id)
    setIsDeleting(false)
    setShowDeleteConfirm(false)
  }

  return (
    <div className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-2xl font-bold text-foreground">
              ${payment.amount.toLocaleString()}
            </span>
            <span
              className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${paymentStatusColors[payment.status] || paymentStatusColors.pending}`}
            >
              {payment.status}
            </span>
            {payment.payment_method && (
              <span className="text-sm text-muted-foreground">
                {paymentMethodLabels[payment.payment_method] ||
                  payment.payment_method}
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
                  {format(new Date(payment.payment_date), 'MMM d, yyyy')}
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

        {/* Actions */}
        <div className="flex flex-col gap-2 ml-4">
          <Select
            value={payment.status}
            onChange={e => handleStatusChange(e.target.value)}
            disabled={isUpdating}
            className="text-xs h-8"
          >
            {paymentStatuses.map(status => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </Select>

          {showDeleteConfirm ? (
            <div className="flex gap-1">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-xs"
              >
                {isDeleting ? '...' : 'Yes'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
                className="text-xs"
              >
                No
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-xs text-red-600 hover:text-red-700 hover:bg-red-100"
            >
              Delete
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
