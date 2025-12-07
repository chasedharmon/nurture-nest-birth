'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type {
  Payment,
  PaymentInsert,
  PaymentStatusType,
} from '@/lib/supabase/types'
import { sendPaymentReceivedEmail } from './notifications'

export async function getClientPayments(clientId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('payments')
    .select('*, client_services(service_type, package_name)')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching client payments:', error)
    return { success: false, error: error.message, payments: [] }
  }

  return { success: true, payments: data }
}

export async function getServicePayments(serviceId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('service_id', serviceId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching service payments:', error)
    return { success: false, error: error.message, payments: [] }
  }

  return { success: true, payments: data as Payment[] }
}

export async function getPaymentById(paymentId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('id', paymentId)
    .single()

  if (error) {
    console.error('Error fetching payment:', error)
    return { success: false, error: error.message, payment: null }
  }

  return { success: true, payment: data as Payment }
}

export async function addPayment(
  clientId: string,
  payment: Omit<PaymentInsert, 'client_id'>
) {
  const supabase = await createClient()

  // Check auth
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  const { data, error } = await supabase
    .from('payments')
    .insert({
      client_id: clientId,
      ...payment,
    })
    .select()
    .single()

  if (error) {
    console.error('Error adding payment:', error)
    return { success: false, error: error.message }
  }

  // Send notification email for completed payments
  if (payment.status === 'completed') {
    sendPaymentReceivedEmail(data.id).catch(err => {
      console.error('[Payments] Failed to send payment notification:', err)
    })
  }

  revalidatePath(`/admin/leads/${clientId}`)
  revalidatePath('/admin')

  return { success: true, payment: data as Payment }
}

export async function updatePayment(
  paymentId: string,
  updates: Partial<PaymentInsert>
) {
  const supabase = await createClient()

  // Check auth
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  // Get payment for revalidation
  const { data: payment } = await supabase
    .from('payments')
    .select('client_id, service_id')
    .eq('id', paymentId)
    .single()

  const { data, error } = await supabase
    .from('payments')
    .update(updates)
    .eq('id', paymentId)
    .select()
    .single()

  if (error) {
    console.error('Error updating payment:', error)
    return { success: false, error: error.message }
  }

  if (payment?.client_id) {
    revalidatePath(`/admin/leads/${payment.client_id}`)
  }
  revalidatePath('/admin')

  return { success: true, payment: data as Payment }
}

export async function updatePaymentStatus(
  paymentId: string,
  status: PaymentStatusType
) {
  const supabase = await createClient()

  // Check auth
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  // Get payment for revalidation
  const { data: payment } = await supabase
    .from('payments')
    .select('client_id, service_id')
    .eq('id', paymentId)
    .single()

  const { error } = await supabase
    .from('payments')
    .update({ status })
    .eq('id', paymentId)

  if (error) {
    console.error('Error updating payment status:', error)
    return { success: false, error: error.message }
  }

  // Send notification email when status is updated to completed
  if (status === 'completed') {
    sendPaymentReceivedEmail(paymentId).catch(err => {
      console.error('[Payments] Failed to send payment notification:', err)
    })
  }

  if (payment?.client_id) {
    revalidatePath(`/admin/leads/${payment.client_id}`)
  }
  revalidatePath('/admin')

  return { success: true }
}

export async function deletePayment(paymentId: string) {
  const supabase = await createClient()

  // Check auth
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  // Get payment for revalidation
  const { data: payment } = await supabase
    .from('payments')
    .select('client_id, service_id')
    .eq('id', paymentId)
    .single()

  const { error } = await supabase.from('payments').delete().eq('id', paymentId)

  if (error) {
    console.error('Error deleting payment:', error)
    return { success: false, error: error.message }
  }

  if (payment?.client_id) {
    revalidatePath(`/admin/leads/${payment.client_id}`)
  }
  revalidatePath('/admin')

  return { success: true }
}

// Helper function to calculate payment summary for a client
export async function getClientPaymentSummary(clientId: string) {
  const supabase = await createClient()

  const { data: payments, error } = await supabase
    .from('payments')
    .select('amount, status')
    .eq('client_id', clientId)

  if (error) {
    console.error('Error fetching payment summary:', error)
    return {
      success: false,
      error: error.message,
      summary: { total: 0, paid: 0, pending: 0, outstanding: 0 },
    }
  }

  const summary = payments.reduce(
    (acc, payment) => {
      const amount = payment.amount || 0
      acc.total += amount

      if (payment.status === 'completed') {
        acc.paid += amount
      } else if (payment.status === 'pending') {
        acc.pending += amount
      }

      return acc
    },
    { total: 0, paid: 0, pending: 0, outstanding: 0 }
  )

  summary.outstanding = summary.total - summary.paid

  return { success: true, summary }
}
