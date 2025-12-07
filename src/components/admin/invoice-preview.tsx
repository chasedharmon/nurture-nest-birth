'use client'

import { useRef } from 'react'
import { format } from 'date-fns'
import type { Invoice, InvoiceLineItem } from '@/lib/supabase/types'
import { Button } from '@/components/ui/button'
import { X, Printer } from 'lucide-react'
import { emailConfig } from '@/lib/email/config'

interface InvoicePreviewProps {
  invoice: Invoice
  clientName: string
  clientEmail: string
  onClose: () => void
}

export function InvoicePreview({
  invoice,
  clientName,
  clientEmail,
  onClose,
}: InvoicePreviewProps) {
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    const printContent = printRef.current
    if (!printContent) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${invoice.invoice_number}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              padding: 40px;
              max-width: 800px;
              margin: 0 auto;
              color: #1a1a1a;
            }
            .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
            .logo { font-size: 24px; font-weight: bold; color: #8b7355; }
            .invoice-number { font-size: 14px; color: #666; margin-top: 8px; }
            .status {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 500;
              text-transform: uppercase;
            }
            .status-draft { background: #f3f4f6; color: #4b5563; }
            .status-sent { background: #dbeafe; color: #1d4ed8; }
            .status-paid { background: #dcfce7; color: #15803d; }
            .status-overdue { background: #fee2e2; color: #dc2626; }
            .addresses { display: flex; justify-content: space-between; margin-bottom: 40px; }
            .address-block { flex: 1; }
            .address-block h4 { font-size: 12px; color: #666; margin-bottom: 8px; text-transform: uppercase; }
            .address-block p { margin: 0; line-height: 1.6; }
            .dates { margin-bottom: 30px; }
            .dates p { margin: 4px 0; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { text-align: left; padding: 12px 8px; border-bottom: 2px solid #e5e7eb; font-size: 12px; text-transform: uppercase; color: #666; }
            td { padding: 12px 8px; border-bottom: 1px solid #e5e7eb; }
            .text-right { text-align: right; }
            .totals { margin-left: auto; width: 300px; }
            .totals-row { display: flex; justify-content: space-between; padding: 8px 0; }
            .totals-row.total { font-weight: bold; font-size: 18px; border-top: 2px solid #1a1a1a; padding-top: 12px; }
            .notes { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
            .notes h4 { font-size: 14px; color: #666; margin-bottom: 8px; }
            .notes p { font-size: 14px; color: #4b5563; }
            .footer { margin-top: 60px; text-align: center; font-size: 12px; color: #666; }
            @media print {
              body { padding: 20px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  const statusClass =
    {
      draft: 'status-draft',
      sent: 'status-sent',
      paid: 'status-paid',
      partial: 'status-sent',
      overdue: 'status-overdue',
      cancelled: 'status-draft',
      refunded: 'status-draft',
    }[invoice.status] || 'status-draft'

  const lineItems = (invoice.line_items as InvoiceLineItem[]) || []

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Invoice Preview</h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-1" />
              Print
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-8 bg-white">
          <div ref={printRef}>
            {/* Invoice Header */}
            <div className="flex justify-between items-start mb-10">
              <div>
                <div className="text-2xl font-bold text-[#8b7355]">
                  {emailConfig.branding.name}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {emailConfig.doula.name}
                </div>
                {emailConfig.doula.phone && (
                  <div className="text-sm text-gray-600">
                    {emailConfig.doula.phone}
                  </div>
                )}
                {emailConfig.doula.email && (
                  <div className="text-sm text-gray-600">
                    {emailConfig.doula.email}
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-800">INVOICE</div>
                <div className="text-sm text-gray-600 mt-1">
                  {invoice.invoice_number}
                </div>
                <div
                  className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${
                    statusClass === 'status-draft'
                      ? 'bg-gray-100 text-gray-600'
                      : statusClass === 'status-sent'
                        ? 'bg-blue-100 text-blue-700'
                        : statusClass === 'status-paid'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                  }`}
                >
                  {invoice.status.toUpperCase()}
                </div>
              </div>
            </div>

            {/* Addresses */}
            <div className="flex justify-between mb-10">
              <div>
                <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">
                  Bill To
                </h4>
                <p className="font-medium text-gray-800">{clientName}</p>
                <p className="text-gray-600">{clientEmail}</p>
              </div>
              <div className="text-right">
                <div className="space-y-1 text-sm">
                  {invoice.issue_date && (
                    <div>
                      <span className="text-gray-500">Issue Date: </span>
                      <span className="text-gray-800">
                        {format(new Date(invoice.issue_date), 'MMMM d, yyyy')}
                      </span>
                    </div>
                  )}
                  {invoice.due_date && (
                    <div>
                      <span className="text-gray-500">Due Date: </span>
                      <span
                        className={
                          new Date(invoice.due_date) < new Date() &&
                          invoice.status !== 'paid'
                            ? 'text-red-600 font-medium'
                            : 'text-gray-800'
                        }
                      >
                        {format(new Date(invoice.due_date), 'MMMM d, yyyy')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <table className="w-full mb-8">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase">
                    Description
                  </th>
                  <th className="text-right py-3 text-xs font-medium text-gray-500 uppercase w-20">
                    Qty
                  </th>
                  <th className="text-right py-3 text-xs font-medium text-gray-500 uppercase w-28">
                    Unit Price
                  </th>
                  <th className="text-right py-3 text-xs font-medium text-gray-500 uppercase w-28">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-3 text-gray-800">{item.description}</td>
                    <td className="py-3 text-right text-gray-600">
                      {item.quantity}
                    </td>
                    <td className="py-3 text-right text-gray-600">
                      ${item.unit_price.toFixed(2)}
                    </td>
                    <td className="py-3 text-right text-gray-800 font-medium">
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
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-800">
                    ${invoice.subtotal.toFixed(2)}
                  </span>
                </div>
                {invoice.tax_amount > 0 && (
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">
                      Tax ({((invoice.tax_rate || 0) * 100).toFixed(2)}%)
                    </span>
                    <span className="text-gray-800">
                      ${invoice.tax_amount.toFixed(2)}
                    </span>
                  </div>
                )}
                {invoice.discount_amount > 0 && (
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Discount</span>
                    <span className="text-red-600">
                      -${invoice.discount_amount.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between py-3 border-t-2 border-gray-800 mt-2">
                  <span className="text-lg font-bold text-gray-800">Total</span>
                  <span className="text-lg font-bold text-gray-800">
                    ${invoice.total.toFixed(2)}
                  </span>
                </div>
                {invoice.amount_paid > 0 && (
                  <>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Amount Paid</span>
                      <span className="text-green-600">
                        -${invoice.amount_paid.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 font-bold">
                      <span className="text-gray-800">Balance Due</span>
                      <span className="text-gray-800">
                        ${invoice.balance_due.toFixed(2)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Notes */}
            {(invoice.client_notes || invoice.terms) && (
              <div className="mt-10 pt-6 border-t border-gray-200">
                {invoice.client_notes && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">
                      Notes
                    </h4>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {invoice.client_notes}
                    </p>
                  </div>
                )}
                {invoice.terms && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">
                      Terms & Conditions
                    </h4>
                    <p className="text-gray-700 whitespace-pre-wrap text-sm">
                      {invoice.terms}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="mt-12 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
              <p>Thank you for choosing {emailConfig.branding.name}!</p>
              {emailConfig.urls.website && (
                <p className="mt-1">{emailConfig.urls.website}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
