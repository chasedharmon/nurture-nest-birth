'use client'

import { useState } from 'react'
import { createInvoice } from '@/app/actions/invoices'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select-native'
import { Plus, Trash2, FileText } from 'lucide-react'
import type { ClientService, InvoiceLineItem } from '@/lib/supabase/types'

interface AddInvoiceFormProps {
  clientId: string
  services?: ClientService[]
  onSuccess?: () => void
}

const paymentTermsOptions = [
  { value: 'due_on_receipt', label: 'Due on Receipt' },
  { value: 'net_7', label: 'Net 7 Days' },
  { value: 'net_14', label: 'Net 14 Days' },
  { value: 'net_30', label: 'Net 30 Days' },
  { value: 'custom', label: 'Custom Date' },
]

export function AddInvoiceForm({
  clientId,
  services = [],
  onSuccess,
}: AddInvoiceFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([
    { description: '', quantity: 1, unit_price: 0, total: 0 },
  ])
  const [taxRate, setTaxRate] = useState(0)
  const [discountAmount, setDiscountAmount] = useState(0)
  const [paymentTerms, setPaymentTerms] = useState('due_on_receipt')

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      { description: '', quantity: 1, unit_price: 0, total: 0 },
    ])
  }

  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index))
    }
  }

  const updateLineItem = (
    index: number,
    field: keyof InvoiceLineItem,
    value: string | number
  ) => {
    const updated = [...lineItems]
    const item = updated[index]
    if (!item) return

    if (field === 'quantity' || field === 'unit_price') {
      const numValue =
        typeof value === 'string' ? parseFloat(value) || 0 : value
      item[field] = numValue
      item.total = item.quantity * item.unit_price
    } else {
      item[field as 'description'] = value as string
    }
    setLineItems(updated)
  }

  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0)
  const taxAmount = subtotal * (taxRate / 100)
  const total = subtotal + taxAmount - discountAmount

  const getDueDate = () => {
    const today = new Date()
    switch (paymentTerms) {
      case 'net_7':
        return new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0]
      case 'net_14':
        return new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0]
      case 'net_30':
        return new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0]
      default:
        return undefined
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const serviceId = formData.get('service_id') as string

    // Validate line items
    const validLineItems = lineItems.filter(
      item => item.description.trim() && item.total > 0
    )
    if (validLineItems.length === 0) {
      setError(
        'Please add at least one line item with a description and amount'
      )
      setIsSubmitting(false)
      return
    }

    const customDueDate = formData.get('custom_due_date') as string

    const result = await createInvoice({
      clientId,
      serviceId: serviceId || undefined,
      lineItems: validLineItems,
      taxRate: taxRate / 100, // Convert percentage to decimal
      discountAmount,
      dueDate:
        paymentTerms === 'custom' ? customDueDate : getDueDate() || undefined,
      clientNotes: (formData.get('client_notes') as string) || undefined,
      terms: (formData.get('terms') as string) || undefined,
    })

    setIsSubmitting(false)

    if (result.success) {
      setShowForm(false)
      setLineItems([{ description: '', quantity: 1, unit_price: 0, total: 0 }])
      setTaxRate(0)
      setDiscountAmount(0)
      onSuccess?.()
    } else {
      setError(result.error || 'Failed to create invoice')
    }
  }

  if (!showForm) {
    return (
      <Button onClick={() => setShowForm(true)} className="w-full">
        <FileText className="h-4 w-4 mr-2" />
        Create Invoice
      </Button>
    )
  }

  return (
    <div className="border border-border rounded-lg p-4 bg-muted/30">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Create Invoice</h3>
        <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
          Cancel
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-md text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Service Selection */}
        {services.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="service_id">Related Service (Optional)</Label>
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

        {/* Line Items */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Line Items</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addLineItem}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Item
            </Button>
          </div>

          <div className="space-y-2">
            {/* Header */}
            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-1">
              <div className="col-span-5">Description</div>
              <div className="col-span-2">Qty</div>
              <div className="col-span-2">Price</div>
              <div className="col-span-2">Total</div>
              <div className="col-span-1"></div>
            </div>

            {/* Items */}
            {lineItems.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-5">
                  <Input
                    placeholder="Description"
                    value={item.description}
                    onChange={e =>
                      updateLineItem(index, 'description', e.target.value)
                    }
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={e =>
                      updateLineItem(index, 'quantity', e.target.value)
                    }
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={item.unit_price || ''}
                    onChange={e =>
                      updateLineItem(index, 'unit_price', e.target.value)
                    }
                  />
                </div>
                <div className="col-span-2 text-right font-medium">
                  ${item.total.toFixed(2)}
                </div>
                <div className="col-span-1">
                  {lineItems.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLineItem(index)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span className="font-medium">${subtotal.toFixed(2)}</span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="tax_rate" className="text-sm whitespace-nowrap">
                Tax Rate (%)
              </Label>
              <Input
                type="number"
                id="tax_rate"
                min="0"
                max="100"
                step="0.01"
                value={taxRate || ''}
                onChange={e => setTaxRate(parseFloat(e.target.value) || 0)}
                className="w-20"
              />
            </div>
            <span className="text-sm font-medium">${taxAmount.toFixed(2)}</span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="discount" className="text-sm whitespace-nowrap">
                Discount ($)
              </Label>
              <Input
                type="number"
                id="discount"
                min="0"
                step="0.01"
                value={discountAmount || ''}
                onChange={e =>
                  setDiscountAmount(parseFloat(e.target.value) || 0)
                }
                className="w-24"
              />
            </div>
            <span className="text-sm font-medium text-red-600">
              -${discountAmount.toFixed(2)}
            </span>
          </div>

          <div className="flex justify-between text-lg font-bold border-t pt-2">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Terms */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="payment_terms">Payment Terms</Label>
            <Select
              id="payment_terms"
              value={paymentTerms}
              onChange={e => setPaymentTerms(e.target.value)}
            >
              {paymentTermsOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>

          {paymentTerms === 'custom' && (
            <div className="space-y-2">
              <Label htmlFor="custom_due_date">Due Date</Label>
              <Input
                type="date"
                name="custom_due_date"
                id="custom_due_date"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="client_notes">Notes for Client</Label>
          <Textarea
            name="client_notes"
            id="client_notes"
            placeholder="Notes visible on the invoice..."
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="terms">Payment Terms & Conditions</Label>
          <Textarea
            name="terms"
            id="terms"
            placeholder="Payment is due upon receipt. Late payments may incur additional fees..."
            rows={2}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowForm(false)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Invoice'}
          </Button>
        </div>
      </form>
    </div>
  )
}
