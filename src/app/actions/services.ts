'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type {
  ClientService,
  ClientServiceInsert,
  ServiceStatus,
  PaymentStatus,
} from '@/lib/supabase/types'

export async function getClientServices(clientId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('client_services')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching client services:', error)
    return { success: false, error: error.message, services: [] }
  }

  return { success: true, services: data as ClientService[] }
}

export async function getServiceById(serviceId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('client_services')
    .select('*')
    .eq('id', serviceId)
    .single()

  if (error) {
    console.error('Error fetching service:', error)
    return { success: false, error: error.message, service: null }
  }

  return { success: true, service: data as ClientService }
}

export async function addService(
  clientId: string,
  service: Omit<ClientServiceInsert, 'client_id'>
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
    .from('client_services')
    .insert({
      client_id: clientId,
      ...service,
    })
    .select()
    .single()

  if (error) {
    console.error('Error adding service:', error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/admin/leads/${clientId}`)
  revalidatePath('/admin')

  return { success: true, service: data as ClientService }
}

export async function updateService(
  serviceId: string,
  updates: Partial<ClientServiceInsert>
) {
  const supabase = await createClient()

  // Check auth
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  // Get client_id for revalidation
  const { data: service } = await supabase
    .from('client_services')
    .select('client_id')
    .eq('id', serviceId)
    .single()

  const { data, error } = await supabase
    .from('client_services')
    .update(updates)
    .eq('id', serviceId)
    .select()
    .single()

  if (error) {
    console.error('Error updating service:', error)
    return { success: false, error: error.message }
  }

  if (service?.client_id) {
    revalidatePath(`/admin/leads/${service.client_id}`)
  }
  revalidatePath('/admin')

  return { success: true, service: data as ClientService }
}

export async function updateServiceStatus(
  serviceId: string,
  status: ServiceStatus
) {
  const supabase = await createClient()

  // Check auth
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  // Get client_id for revalidation
  const { data: service } = await supabase
    .from('client_services')
    .select('client_id')
    .eq('id', serviceId)
    .single()

  const { error } = await supabase
    .from('client_services')
    .update({ status })
    .eq('id', serviceId)

  if (error) {
    console.error('Error updating service status:', error)
    return { success: false, error: error.message }
  }

  if (service?.client_id) {
    revalidatePath(`/admin/leads/${service.client_id}`)
  }
  revalidatePath('/admin')

  return { success: true }
}

export async function updateServicePaymentStatus(
  serviceId: string,
  paymentStatus: PaymentStatus
) {
  const supabase = await createClient()

  // Check auth
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  // Get client_id for revalidation
  const { data: service } = await supabase
    .from('client_services')
    .select('client_id')
    .eq('id', serviceId)
    .single()

  const { error } = await supabase
    .from('client_services')
    .update({ payment_status: paymentStatus })
    .eq('id', serviceId)

  if (error) {
    console.error('Error updating service payment status:', error)
    return { success: false, error: error.message }
  }

  if (service?.client_id) {
    revalidatePath(`/admin/leads/${service.client_id}`)
  }
  revalidatePath('/admin')

  return { success: true }
}

export async function markContractSigned(
  serviceId: string,
  contractUrl?: string
) {
  const supabase = await createClient()

  // Check auth
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  // Get client_id for revalidation
  const { data: service } = await supabase
    .from('client_services')
    .select('client_id')
    .eq('id', serviceId)
    .single()

  const { error } = await supabase
    .from('client_services')
    .update({
      contract_signed: true,
      contract_url: contractUrl || null,
    })
    .eq('id', serviceId)

  if (error) {
    console.error('Error marking contract as signed:', error)
    return { success: false, error: error.message }
  }

  if (service?.client_id) {
    revalidatePath(`/admin/leads/${service.client_id}`)
  }
  revalidatePath('/admin')

  return { success: true }
}

export async function deleteService(serviceId: string) {
  const supabase = await createClient()

  // Check auth
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  // Get client_id for revalidation
  const { data: service } = await supabase
    .from('client_services')
    .select('client_id')
    .eq('id', serviceId)
    .single()

  const { error } = await supabase
    .from('client_services')
    .delete()
    .eq('id', serviceId)

  if (error) {
    console.error('Error deleting service:', error)
    return { success: false, error: error.message }
  }

  if (service?.client_id) {
    revalidatePath(`/admin/leads/${service.client_id}`)
  }
  revalidatePath('/admin')

  return { success: true }
}
