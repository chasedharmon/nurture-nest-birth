'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/server'
import type { ContractTemplate, ContractSignature } from '@/lib/supabase/types'

// ============================================================================
// CONTRACT TEMPLATES
// ============================================================================

export async function getContractTemplates(): Promise<{
  success: boolean
  templates?: ContractTemplate[]
  error?: string
}> {
  try {
    const supabase = createAdminClient()

    const { data: templates, error } = await supabase
      .from('contract_templates')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (error) throw error

    return { success: true, templates: templates || [] }
  } catch (error) {
    console.error('[Contracts] Failed to get templates:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to get contract templates',
    }
  }
}

export async function getContractTemplate(
  templateId: string
): Promise<{ success: boolean; template?: ContractTemplate; error?: string }> {
  try {
    const supabase = createAdminClient()

    const { data: template, error } = await supabase
      .from('contract_templates')
      .select('*')
      .eq('id', templateId)
      .single()

    if (error) throw error

    return { success: true, template }
  } catch (error) {
    console.error('[Contracts] Failed to get template:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to get contract template',
    }
  }
}

export async function getDefaultContractTemplate(
  serviceType: string
): Promise<{ success: boolean; template?: ContractTemplate; error?: string }> {
  try {
    const supabase = createAdminClient()

    // First try to find a default template for the service type
    let { data: template, error } = await supabase
      .from('contract_templates')
      .select('*')
      .eq('service_type', serviceType)
      .eq('is_default', true)
      .eq('is_active', true)
      .single()

    // If not found, try any active template for the service type
    if (error || !template) {
      const result = await supabase
        .from('contract_templates')
        .select('*')
        .eq('service_type', serviceType)
        .eq('is_active', true)
        .limit(1)
        .single()

      template = result.data
      error = result.error
    }

    // If still not found, try a general template
    if (error || !template) {
      const result = await supabase
        .from('contract_templates')
        .select('*')
        .is('service_type', null)
        .eq('is_active', true)
        .limit(1)
        .single()

      template = result.data
      error = result.error
    }

    if (error || !template) {
      return { success: false, error: 'No contract template found' }
    }

    return { success: true, template }
  } catch (error) {
    console.error('[Contracts] Failed to get default template:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to get contract template',
    }
  }
}

export async function createContractTemplate(data: {
  name: string
  description?: string
  serviceType?: string
  content: string
  isDefault?: boolean
}): Promise<{ success: boolean; template?: ContractTemplate; error?: string }> {
  try {
    const supabase = createAdminClient()

    // If setting as default, unset other defaults for this service type
    if (data.isDefault && data.serviceType) {
      await supabase
        .from('contract_templates')
        .update({ is_default: false })
        .eq('service_type', data.serviceType)
    }

    const { data: template, error } = await supabase
      .from('contract_templates')
      .insert({
        name: data.name,
        description: data.description || null,
        service_type: data.serviceType || null,
        content: data.content,
        is_default: data.isDefault || false,
        is_active: true,
        version: 1,
      })
      .select()
      .single()

    if (error) throw error

    return { success: true, template }
  } catch (error) {
    console.error('[Contracts] Failed to create template:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to create contract template',
    }
  }
}

export async function updateContractTemplate(
  templateId: string,
  data: {
    name?: string
    description?: string
    content?: string
    isDefault?: boolean
    isActive?: boolean
  }
): Promise<{ success: boolean; template?: ContractTemplate; error?: string }> {
  try {
    const supabase = createAdminClient()

    // Get current template to check service type and increment version
    const { data: current, error: fetchError } = await supabase
      .from('contract_templates')
      .select('service_type, version')
      .eq('id', templateId)
      .single()

    if (fetchError) throw fetchError

    // If setting as default, unset other defaults for this service type
    if (data.isDefault && current.service_type) {
      await supabase
        .from('contract_templates')
        .update({ is_default: false })
        .eq('service_type', current.service_type)
        .neq('id', templateId)
    }

    const updateData: Record<string, unknown> = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined)
      updateData.description = data.description
    if (data.content !== undefined) {
      updateData.content = data.content
      updateData.version = current.version + 1
    }
    if (data.isDefault !== undefined) updateData.is_default = data.isDefault
    if (data.isActive !== undefined) updateData.is_active = data.isActive

    const { data: template, error } = await supabase
      .from('contract_templates')
      .update(updateData)
      .eq('id', templateId)
      .select()
      .single()

    if (error) throw error

    return { success: true, template }
  } catch (error) {
    console.error('[Contracts] Failed to update template:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to update contract template',
    }
  }
}

// ============================================================================
// CONTRACT SIGNATURES
// ============================================================================

export async function signContract(data: {
  clientId: string
  serviceId?: string
  templateId: string
  signerName: string
  signerEmail: string
}): Promise<{
  success: boolean
  signature?: ContractSignature
  error?: string
}> {
  try {
    const supabase = createAdminClient()

    // Get the contract template
    const { data: template, error: templateError } = await supabase
      .from('contract_templates')
      .select('*')
      .eq('id', data.templateId)
      .single()

    if (templateError || !template) {
      return { success: false, error: 'Contract template not found' }
    }

    // Get IP address and user agent from headers
    const headersList = await headers()
    const ipAddress =
      headersList.get('x-forwarded-for')?.split(',')[0] ||
      headersList.get('x-real-ip') ||
      null
    const userAgent = headersList.get('user-agent') || null

    // Create the signature record
    const { data: signature, error: signError } = await supabase
      .from('contract_signatures')
      .insert({
        client_id: data.clientId,
        service_id: data.serviceId || null,
        template_id: data.templateId,
        contract_content: template.content,
        contract_version: template.version,
        signer_name: data.signerName,
        signer_email: data.signerEmail,
        ip_address: ipAddress,
        user_agent: userAgent,
        status: 'signed',
      })
      .select()
      .single()

    if (signError) throw signError

    // Update the client_services record if service_id provided
    if (data.serviceId) {
      await supabase
        .from('client_services')
        .update({
          contract_signed: true,
          contract_signed_at: new Date().toISOString(),
          contract_signature_id: signature.id,
        })
        .eq('id', data.serviceId)
    }

    revalidatePath(`/admin/leads/${data.clientId}`)
    revalidatePath(`/client/services`)
    return { success: true, signature }
  } catch (error) {
    console.error('[Contracts] Failed to sign contract:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to sign contract',
    }
  }
}

export async function getContractSignature(signatureId: string): Promise<{
  success: boolean
  signature?: ContractSignature
  error?: string
}> {
  try {
    const supabase = createAdminClient()

    const { data: signature, error } = await supabase
      .from('contract_signatures')
      .select('*')
      .eq('id', signatureId)
      .single()

    if (error) throw error

    return { success: true, signature }
  } catch (error) {
    console.error('[Contracts] Failed to get signature:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to get contract signature',
    }
  }
}

export async function getClientContractSignatures(clientId: string): Promise<{
  success: boolean
  signatures?: ContractSignature[]
  error?: string
}> {
  try {
    const supabase = createAdminClient()

    const { data: signatures, error } = await supabase
      .from('contract_signatures')
      .select('*')
      .eq('client_id', clientId)
      .order('signed_at', { ascending: false })

    if (error) throw error

    return { success: true, signatures: signatures || [] }
  } catch (error) {
    console.error('[Contracts] Failed to get client signatures:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to get client signatures',
    }
  }
}

export async function getServiceContractSignature(serviceId: string): Promise<{
  success: boolean
  signature?: ContractSignature | null
  error?: string
}> {
  try {
    const supabase = createAdminClient()

    const { data: signature, error } = await supabase
      .from('contract_signatures')
      .select('*')
      .eq('service_id', serviceId)
      .eq('status', 'signed')
      .order('signed_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw error

    return { success: true, signature }
  } catch (error) {
    console.error('[Contracts] Failed to get service signature:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to get service contract signature',
    }
  }
}

export async function voidContractSignature(
  signatureId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient()

    // Get signature to find client_id for revalidation
    const { data: signature, error: fetchError } = await supabase
      .from('contract_signatures')
      .select('client_id, service_id')
      .eq('id', signatureId)
      .single()

    if (fetchError) throw fetchError

    // Void the signature
    const { error } = await supabase
      .from('contract_signatures')
      .update({
        status: 'voided',
        voided_at: new Date().toISOString(),
        voided_reason: reason,
      })
      .eq('id', signatureId)

    if (error) throw error

    // Update client_services if there was a linked service
    if (signature.service_id) {
      await supabase
        .from('client_services')
        .update({
          contract_signed: false,
          contract_signed_at: null,
          contract_signature_id: null,
        })
        .eq('id', signature.service_id)
    }

    revalidatePath(`/admin/leads/${signature.client_id}`)
    return { success: true }
  } catch (error) {
    console.error('[Contracts] Failed to void signature:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to void contract signature',
    }
  }
}

// ============================================================================
// CONTRACT REQUIREMENT CHECK
// ============================================================================

export async function checkContractRequired(serviceId: string): Promise<{
  required: boolean
  signed: boolean
  signature?: ContractSignature | null
}> {
  try {
    const supabase = createAdminClient()

    // Get service info
    const { data: service, error } = await supabase
      .from('client_services')
      .select('contract_required, contract_signed, contract_signature_id')
      .eq('id', serviceId)
      .single()

    if (error || !service) {
      return { required: false, signed: false }
    }

    let signature: ContractSignature | null = null
    if (service.contract_signature_id) {
      const result = await getContractSignature(service.contract_signature_id)
      signature = result.signature || null
    }

    return {
      required: service.contract_required,
      signed: service.contract_signed,
      signature,
    }
  } catch (error) {
    console.error('[Contracts] Failed to check contract requirement:', error)
    return { required: false, signed: false }
  }
}
