'use client'

import { useState } from 'react'
import { addPayment } from '@/app/actions/payments'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select-native'
import type { ClientService } from '@/lib/supabase/types'

interface AddPaymentFormProps {
  clientId: string
  services?: ClientService[]
  onSuccess?: () => void
}

const paymentMethods = [
  { value: 'stripe', label: 'Stripe' },
  { value: 'check', label: 'Check' },
  { value: 'cash', label: 'Cash' },
  { value: 'venmo', label: 'Venmo' },
  { value: 'zelle', label: 'Zelle' },
  { value: 'other', label: 'Other' },
]

const paymentStatuses = [
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
  { value: 'refunded', label: 'Refunded' },
]

const paymentTypes = [
  { value: 'deposit', label: 'Deposit' },
  { value: 'partial', label: 'Partial Payment' },
  { value: 'final', label: 'Final Payment' },
  { value: 'full', label: 'Full Payment' },
  { value: 'refund', label: 'Refund' },
]

export function AddPaymentForm({
  clientId,
  services = [],
  onSuccess,
}: AddPaymentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const formData = new FormData(e.currentTarget)

    const serviceId = formData.get('service_id') as string

    const result = await addPayment(clientId, {
      service_id: serviceId || null,
      amount: parseFloat(formData.get('amount') as string),
      payment_type: formData.get('payment_type') as string,
      payment_method: (formData.get('payment_method') as string) || null,
      status: formData.get('status') as string,
      transaction_id: (formData.get('transaction_id') as string) || null,
      payment_date: (formData.get('payment_date') as string) || null,
      due_date: (formData.get('due_date') as string) || null,
      notes: (formData.get('notes') as string) || null,
    })

    setIsSubmitting(false)

    if (result.success) {
      setShowForm(false)
      onSuccess?.()
      ;(e.target as HTMLFormElement).reset()
    } else {
      setError(result.error || 'Failed to record payment')
    }
  }

  if (!showForm) {
    return (
      <Button onClick={() => setShowForm(true)} className="w-full">
        + Record Payment
      </Button>
    )
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="border border-border rounded-lg p-4 bg-muted/30">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Record Payment</h3>
        <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
          Cancel
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-md text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount ($) *</Label>
            <Input
              type="number"
              name="amount"
              id="amount"
              required
              min="0"
              step="0.01"
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_type">Payment Type *</Label>
            <Select name="payment_type" id="payment_type" required>
              <option value="">Select a type</option>
              {paymentTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="payment_method">Payment Method</Label>
            <Select name="payment_method" id="payment_method">
              <option value="">Select a method</option>
              {paymentMethods.map(method => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status *</Label>
            <Select name="status" id="status" required defaultValue="completed">
              {paymentStatuses.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {services.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="service_id">Related Service</Label>
            <Select name="service_id" id="service_id">
              <option value="">No linked service</option>
              {services.map(service => (
                <option key={service.id} value={service.id}>
                  {service.package_name ||
                    service.service_type
                      .replace(/_/g, ' ')
                      .replace(/\b\w/g, l => l.toUpperCase())}
                  {service.total_amount
                    ? ` - $${service.total_amount.toLocaleString()}`
                    : ''}
                </option>
              ))}
            </Select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="payment_date">Payment Date</Label>
            <Input
              type="date"
              name="payment_date"
              id="payment_date"
              defaultValue={today}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="due_date">Due Date</Label>
            <Input type="date" name="due_date" id="due_date" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="transaction_id">Transaction ID</Label>
          <Input
            type="text"
            name="transaction_id"
            id="transaction_id"
            placeholder="e.g., stripe_pi_xxx or check #1234"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            name="notes"
            id="notes"
            placeholder="Payment notes..."
            rows={2}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowForm(false)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Recording...' : 'Record Payment'}
          </Button>
        </div>
      </form>
    </div>
  )
}
