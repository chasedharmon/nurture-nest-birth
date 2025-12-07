'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server'
import type {
  Invoice,
  InvoiceLineItem,
  InvoicePayment,
  InvoiceStatus,
} from '@/lib/supabase/types'
import { sendInvoiceEmail, sendPaymentReceivedEmail } from './notifications'

// ============================================================================
// INVOICE CRUD
// ============================================================================

export async function createInvoice(data: {
  clientId: string
  serviceId?: string
  lineItems: InvoiceLineItem[]
  dueDate?: string
  notes?: string
  clientNotes?: string
  terms?: string
  taxRate?: number
  discountAmount?: number
}): Promise<{ success: boolean; invoice?: Invoice; error?: string }> {
  try {
    const supabase = createAdminClient()

    // Calculate totals
    const subtotal = data.lineItems.reduce((sum, item) => sum + item.total, 0)
    const taxRate = data.taxRate || 0
    const taxAmount = subtotal * taxRate
    const discountAmount = data.discountAmount || 0
    const total = subtotal + taxAmount - discountAmount

    // Generate invoice number using database function
    const { data: numberResult, error: numberError } = await supabase.rpc(
      'generate_invoice_number'
    )

    if (numberError) {
      // Fallback invoice number generation
      const timestamp = Date.now()
      const year = new Date().getFullYear()
      const fallbackNumber = `INV-${year}-${timestamp.toString().slice(-4)}`

      const { data: invoice, error } = await supabase
        .from('invoices')
        .insert({
          client_id: data.clientId,
          service_id: data.serviceId || null,
          invoice_number: fallbackNumber,
          status: 'draft',
          subtotal,
          tax_rate: taxRate,
          tax_amount: taxAmount,
          discount_amount: discountAmount,
          total,
          amount_paid: 0,
          issue_date: new Date().toISOString().split('T')[0],
          due_date: data.dueDate || null,
          line_items: data.lineItems,
          notes: data.notes || null,
          client_notes: data.clientNotes || null,
          terms: data.terms || null,
        })
        .select()
        .single()

      if (error) throw error

      revalidatePath(`/admin/leads/${data.clientId}`)
      return { success: true, invoice }
    }

    const { data: invoice, error } = await supabase
      .from('invoices')
      .insert({
        client_id: data.clientId,
        service_id: data.serviceId || null,
        invoice_number: numberResult,
        status: 'draft',
        subtotal,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        discount_amount: discountAmount,
        total,
        amount_paid: 0,
        issue_date: new Date().toISOString().split('T')[0],
        due_date: data.dueDate || null,
        line_items: data.lineItems,
        notes: data.notes || null,
        client_notes: data.clientNotes || null,
        terms: data.terms || null,
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath(`/admin/leads/${data.clientId}`)
    return { success: true, invoice }
  } catch (error) {
    console.error('[Invoices] Failed to create invoice:', error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to create invoice',
    }
  }
}

export async function getInvoice(
  invoiceId: string
): Promise<{ success: boolean; invoice?: Invoice; error?: string }> {
  try {
    const supabase = createAdminClient()

    const { data: invoice, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single()

    if (error) throw error

    return { success: true, invoice }
  } catch (error) {
    console.error('[Invoices] Failed to get invoice:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get invoice',
    }
  }
}

export async function getClientInvoices(
  clientId: string
): Promise<{ success: boolean; invoices?: Invoice[]; error?: string }> {
  try {
    const supabase = createAdminClient()

    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return { success: true, invoices: invoices || [] }
  } catch (error) {
    console.error('[Invoices] Failed to get client invoices:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to get client invoices',
    }
  }
}

export async function updateInvoice(
  invoiceId: string,
  data: {
    lineItems?: InvoiceLineItem[]
    dueDate?: string | null
    notes?: string | null
    clientNotes?: string | null
    terms?: string | null
    taxRate?: number
    discountAmount?: number
    status?: InvoiceStatus
  }
): Promise<{ success: boolean; invoice?: Invoice; error?: string }> {
  try {
    const supabase = createAdminClient()

    // Get current invoice to recalculate if line items changed
    const { data: currentInvoice, error: fetchError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single()

    if (fetchError) throw fetchError

    // Prepare update data
    const updateData: Record<string, unknown> = {}

    if (data.lineItems !== undefined) {
      updateData.line_items = data.lineItems
      const subtotal = data.lineItems.reduce((sum, item) => sum + item.total, 0)
      const taxRate = data.taxRate ?? currentInvoice.tax_rate
      const taxAmount = subtotal * taxRate
      const discountAmount =
        data.discountAmount ?? currentInvoice.discount_amount
      const total = subtotal + taxAmount - discountAmount

      updateData.subtotal = subtotal
      updateData.tax_rate = taxRate
      updateData.tax_amount = taxAmount
      updateData.discount_amount = discountAmount
      updateData.total = total
    } else if (
      data.taxRate !== undefined ||
      data.discountAmount !== undefined
    ) {
      const subtotal = currentInvoice.subtotal
      const taxRate = data.taxRate ?? currentInvoice.tax_rate
      const taxAmount = subtotal * taxRate
      const discountAmount =
        data.discountAmount ?? currentInvoice.discount_amount
      const total = subtotal + taxAmount - discountAmount

      updateData.tax_rate = taxRate
      updateData.tax_amount = taxAmount
      updateData.discount_amount = discountAmount
      updateData.total = total
    }

    if (data.dueDate !== undefined) updateData.due_date = data.dueDate
    if (data.notes !== undefined) updateData.notes = data.notes
    if (data.clientNotes !== undefined)
      updateData.client_notes = data.clientNotes
    if (data.terms !== undefined) updateData.terms = data.terms
    if (data.status !== undefined) updateData.status = data.status

    const { data: invoice, error } = await supabase
      .from('invoices')
      .update(updateData)
      .eq('id', invoiceId)
      .select()
      .single()

    if (error) throw error

    revalidatePath(`/admin/leads/${invoice.client_id}`)
    return { success: true, invoice }
  } catch (error) {
    console.error('[Invoices] Failed to update invoice:', error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to update invoice',
    }
  }
}

export async function deleteInvoice(
  invoiceId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient()

    // Get invoice first to get client_id for revalidation
    const { data: invoice, error: fetchError } = await supabase
      .from('invoices')
      .select('client_id, status')
      .eq('id', invoiceId)
      .single()

    if (fetchError) throw fetchError

    // Only allow deleting draft invoices
    if (invoice.status !== 'draft') {
      return {
        success: false,
        error:
          'Only draft invoices can be deleted. Cancel the invoice instead.',
      }
    }

    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', invoiceId)

    if (error) throw error

    revalidatePath(`/admin/leads/${invoice.client_id}`)
    return { success: true }
  } catch (error) {
    console.error('[Invoices] Failed to delete invoice:', error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to delete invoice',
    }
  }
}

// ============================================================================
// INVOICE ACTIONS
// ============================================================================

export async function sendInvoice(
  invoiceId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient()

    // Get invoice with client info
    const { data: invoice, error: fetchError } = await supabase
      .from('invoices')
      .select('*, client:leads(name, email)')
      .eq('id', invoiceId)
      .single()

    if (fetchError) throw fetchError

    if (invoice.status !== 'draft') {
      return { success: false, error: 'Invoice has already been sent' }
    }

    // Update invoice status
    const { error: updateError } = await supabase
      .from('invoices')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .eq('id', invoiceId)

    if (updateError) throw updateError

    // Send email notification
    await sendInvoiceEmail(invoiceId)

    revalidatePath(`/admin/leads/${invoice.client_id}`)
    return { success: true }
  } catch (error) {
    console.error('[Invoices] Failed to send invoice:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send invoice',
    }
  }
}

export async function recordPayment(data: {
  invoiceId: string
  amount: number
  paymentMethod: string
  paymentReference?: string
  paymentDate?: string
  notes?: string
}): Promise<{
  success: boolean
  payment?: InvoicePayment
  error?: string
}> {
  try {
    const supabase = createAdminClient()

    // Get current invoice
    const { data: invoice, error: fetchError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', data.invoiceId)
      .single()

    if (fetchError) throw fetchError

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from('invoice_payments')
      .insert({
        invoice_id: data.invoiceId,
        amount: data.amount,
        payment_method: data.paymentMethod,
        payment_reference: data.paymentReference || null,
        payment_date:
          data.paymentDate || new Date().toISOString().split('T')[0],
        notes: data.notes || null,
      })
      .select()
      .single()

    if (paymentError) throw paymentError

    // Update invoice amount_paid and status
    const newAmountPaid = Number(invoice.amount_paid) + data.amount
    const newStatus: InvoiceStatus =
      newAmountPaid >= invoice.total ? 'paid' : 'partial'

    const { error: updateError } = await supabase
      .from('invoices')
      .update({
        amount_paid: newAmountPaid,
        status: newStatus,
        payment_method: data.paymentMethod,
        ...(newStatus === 'paid' ? { paid_at: new Date().toISOString() } : {}),
      })
      .eq('id', data.invoiceId)

    if (updateError) throw updateError

    // Send payment confirmation email
    if (newStatus === 'paid') {
      await sendPaymentReceivedEmail(data.invoiceId)
    }

    revalidatePath(`/admin/leads/${invoice.client_id}`)
    return { success: true, payment }
  } catch (error) {
    console.error('[Invoices] Failed to record payment:', error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to record payment',
    }
  }
}

export async function getInvoicePayments(
  invoiceId: string
): Promise<{ success: boolean; payments?: InvoicePayment[]; error?: string }> {
  try {
    const supabase = createAdminClient()

    const { data: payments, error } = await supabase
      .from('invoice_payments')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('payment_date', { ascending: false })

    if (error) throw error

    return { success: true, payments: payments || [] }
  } catch (error) {
    console.error('[Invoices] Failed to get invoice payments:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to get invoice payments',
    }
  }
}

export async function cancelInvoice(
  invoiceId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient()

    const { data: invoice, error: fetchError } = await supabase
      .from('invoices')
      .select('client_id, status')
      .eq('id', invoiceId)
      .single()

    if (fetchError) throw fetchError

    if (invoice.status === 'paid') {
      return {
        success: false,
        error: 'Cannot cancel a paid invoice. Process a refund instead.',
      }
    }

    const { error } = await supabase
      .from('invoices')
      .update({ status: 'cancelled' })
      .eq('id', invoiceId)

    if (error) throw error

    revalidatePath(`/admin/leads/${invoice.client_id}`)
    return { success: true }
  } catch (error) {
    console.error('[Invoices] Failed to cancel invoice:', error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to cancel invoice',
    }
  }
}

export async function markInvoiceOverdue(
  invoiceId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient()

    const { data: invoice, error: fetchError } = await supabase
      .from('invoices')
      .select('client_id, status')
      .eq('id', invoiceId)
      .single()

    if (fetchError) throw fetchError

    if (invoice.status !== 'sent' && invoice.status !== 'partial') {
      return {
        success: false,
        error: 'Only sent or partial invoices can be marked as overdue',
      }
    }

    const { error } = await supabase
      .from('invoices')
      .update({ status: 'overdue' })
      .eq('id', invoiceId)

    if (error) throw error

    revalidatePath(`/admin/leads/${invoice.client_id}`)
    return { success: true }
  } catch (error) {
    console.error('[Invoices] Failed to mark invoice overdue:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to mark invoice overdue',
    }
  }
}

// ============================================================================
// CLIENT-FACING INVOICE FUNCTIONS
// ============================================================================

export async function getClientVisibleInvoices(
  clientId: string
): Promise<{ success: boolean; invoices?: Invoice[]; error?: string }> {
  try {
    const supabase = createAdminClient()

    // Only show sent, paid, partial, and overdue invoices to clients
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('client_id', clientId)
      .in('status', ['sent', 'paid', 'partial', 'overdue'])
      .order('created_at', { ascending: false })

    if (error) throw error

    return { success: true, invoices: invoices || [] }
  } catch (error) {
    console.error('[Invoices] Failed to get client visible invoices:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to get client invoices',
    }
  }
}

// ============================================================================
// INVOICE STATS
// ============================================================================

export async function getInvoiceStats(clientId?: string): Promise<{
  success: boolean
  stats?: {
    totalInvoiced: number
    totalPaid: number
    totalOutstanding: number
    invoiceCount: number
    paidCount: number
    pendingCount: number
    overdueCount: number
  }
  error?: string
}> {
  try {
    const supabase = createAdminClient()

    let query = supabase.from('invoices').select('total, amount_paid, status')

    if (clientId) {
      query = query.eq('client_id', clientId)
    }

    // Exclude draft and cancelled invoices from stats
    query = query.not('status', 'in', '("draft","cancelled")')

    const { data: invoices, error } = await query

    if (error) throw error

    const stats = {
      totalInvoiced: 0,
      totalPaid: 0,
      totalOutstanding: 0,
      invoiceCount: invoices?.length || 0,
      paidCount: 0,
      pendingCount: 0,
      overdueCount: 0,
    }

    invoices?.forEach(inv => {
      stats.totalInvoiced += Number(inv.total)
      stats.totalPaid += Number(inv.amount_paid)
      stats.totalOutstanding += Number(inv.total) - Number(inv.amount_paid)

      if (inv.status === 'paid') stats.paidCount++
      else if (inv.status === 'overdue') stats.overdueCount++
      else stats.pendingCount++
    })

    return { success: true, stats }
  } catch (error) {
    console.error('[Invoices] Failed to get invoice stats:', error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to get invoice stats',
    }
  }
}
