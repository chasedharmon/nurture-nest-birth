'use server'

/**
 * CRM-Invoicing Integration
 *
 * Connects CRM Opportunities with the Invoicing system.
 * When an opportunity reaches 'closed_won' stage, this integration
 * can automatically create an invoice or prompt for invoice creation.
 */

import { createAdminClient } from '@/lib/supabase/server'
import { createInvoice } from './invoices'
import { getRecordById } from './crm-records'
import { revalidatePath } from 'next/cache'
import type { CrmOpportunity } from '@/lib/crm/types'
import type { Invoice, InvoiceLineItem } from '@/lib/supabase/types'

// =====================================================
// TYPES
// =====================================================

export interface OpportunityInvoiceLink {
  opportunityId: string
  invoiceId: string | null
  hasInvoice: boolean
  invoiceStatus: string | null
}

export interface GenerateInvoiceFromOpportunityInput {
  opportunityId: string
  /** Override the opportunity amount */
  amount?: number
  /** Add line items (if not provided, creates single line item from opportunity) */
  lineItems?: InvoiceLineItem[]
  /** Due date for the invoice */
  dueDate?: string
  /** Internal notes */
  notes?: string
  /** Client-facing notes */
  clientNotes?: string
  /** Payment terms */
  terms?: string
  /** Tax rate (decimal, e.g., 0.08 for 8%) */
  taxRate?: number
  /** Discount amount */
  discountAmount?: number
  /** Auto-send invoice email */
  sendEmail?: boolean
}

// =====================================================
// LINK MANAGEMENT
// =====================================================

/**
 * Get the invoice link for an opportunity
 */
export async function getOpportunityInvoiceLink(
  opportunityId: string
): Promise<{ data: OpportunityInvoiceLink | null; error: string | null }> {
  try {
    const supabase = createAdminClient()

    // Check for existing invoice linked to this opportunity
    // We use the service_id field on invoices to link to opportunities
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('id, status')
      .eq('opportunity_id', opportunityId)
      .order('created_at', { ascending: false })
      .limit(1)

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      console.error('Error fetching invoice link:', error)
    }

    const invoice = invoices?.[0]

    return {
      data: {
        opportunityId,
        invoiceId: invoice?.id ?? null,
        hasInvoice: !!invoice,
        invoiceStatus: invoice?.status ?? null,
      },
      error: null,
    }
  } catch (err) {
    console.error('Error getting opportunity invoice link:', err)
    return { data: null, error: 'An unexpected error occurred' }
  }
}

/**
 * Get all invoices linked to an opportunity
 */
export async function getOpportunityInvoices(
  opportunityId: string
): Promise<{ data: Invoice[]; error: string | null }> {
  try {
    const supabase = createAdminClient()

    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('opportunity_id', opportunityId)
      .order('created_at', { ascending: false })

    if (error) {
      return { data: [], error: error.message }
    }

    return { data: invoices ?? [], error: null }
  } catch (err) {
    console.error('Error getting opportunity invoices:', err)
    return { data: [], error: 'An unexpected error occurred' }
  }
}

// =====================================================
// INVOICE GENERATION
// =====================================================

/**
 * Generate an invoice from a closed-won opportunity
 */
export async function generateInvoiceFromOpportunity(
  input: GenerateInvoiceFromOpportunityInput
): Promise<{ success: boolean; invoice?: Invoice; error: string | null }> {
  try {
    const supabase = createAdminClient()

    // Get the opportunity
    const opportunityResult = await getRecordById<CrmOpportunity>(
      'Opportunity',
      input.opportunityId
    )

    if (opportunityResult.error || !opportunityResult.data) {
      return {
        success: false,
        error: opportunityResult.error ?? 'Opportunity not found',
      }
    }

    const opportunity = opportunityResult.data

    // Validate opportunity stage
    if (opportunity.stage !== 'closed_won') {
      return {
        success: false,
        error:
          'Invoice can only be generated for closed-won opportunities. Current stage: ' +
          opportunity.stage,
      }
    }

    // Get the primary contact for the invoice client
    if (!opportunity.primary_contact_id) {
      return {
        success: false,
        error: 'Opportunity must have a primary contact to generate invoice',
      }
    }

    // Get the client ID (legacy lead ID or contact ID mapping)
    const clientId = await resolveClientIdFromContact(
      opportunity.primary_contact_id
    )

    if (!clientId) {
      return {
        success: false,
        error: 'Could not find client for this opportunity contact',
      }
    }

    // Build line items
    const lineItems: InvoiceLineItem[] =
      input.lineItems && input.lineItems.length > 0
        ? input.lineItems
        : [
            {
              description: opportunity.name || 'Doula Services',
              quantity: 1,
              unit_price: input.amount ?? opportunity.amount ?? 0,
              total: input.amount ?? opportunity.amount ?? 0,
            },
          ]

    // Create the invoice
    const invoiceResult = await createInvoice({
      clientId,
      serviceId: undefined, // Will link via opportunity_id
      lineItems,
      dueDate: input.dueDate,
      notes: input.notes,
      clientNotes: input.clientNotes,
      terms: input.terms ?? 'Payment due within 30 days of invoice date.',
      taxRate: input.taxRate,
      discountAmount: input.discountAmount,
    })

    if (!invoiceResult.success || !invoiceResult.invoice) {
      return {
        success: false,
        error: invoiceResult.error ?? 'Failed to create invoice',
      }
    }

    // Link invoice to opportunity
    const { error: updateError } = await supabase
      .from('invoices')
      .update({ opportunity_id: input.opportunityId })
      .eq('id', invoiceResult.invoice.id)

    if (updateError) {
      console.error('Error linking invoice to opportunity:', updateError)
      // Invoice was created but not linked - not a fatal error
    }

    // Update opportunity with invoice reference
    await supabase
      .from('crm_opportunities')
      .update({
        custom_fields: {
          ...((opportunity.custom_fields as Record<string, unknown>) ?? {}),
          invoice_id: invoiceResult.invoice.id,
          invoice_number: invoiceResult.invoice.invoice_number,
        },
      })
      .eq('id', input.opportunityId)

    // Revalidate paths
    revalidatePath(`/admin/opportunities/${input.opportunityId}`)
    revalidatePath(`/admin/leads/${clientId}`)

    return {
      success: true,
      invoice: invoiceResult.invoice,
      error: null,
    }
  } catch (err) {
    console.error('Error generating invoice from opportunity:', err)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Check if an opportunity should have an invoice generated
 * Called when opportunity stage changes to closed_won
 */
export async function shouldGenerateInvoice(
  opportunityId: string
): Promise<{ shouldGenerate: boolean; reason: string | null }> {
  try {
    // Check if invoice already exists
    const { data: link } = await getOpportunityInvoiceLink(opportunityId)

    if (link?.hasInvoice) {
      return {
        shouldGenerate: false,
        reason: 'Invoice already exists for this opportunity',
      }
    }

    // Get opportunity to check amount
    const opportunityResult = await getRecordById<CrmOpportunity>(
      'Opportunity',
      opportunityId
    )

    if (!opportunityResult.data) {
      return {
        shouldGenerate: false,
        reason: 'Opportunity not found',
      }
    }

    const opportunity = opportunityResult.data

    // Don't generate invoice for $0 opportunities
    if (!opportunity.amount || opportunity.amount <= 0) {
      return {
        shouldGenerate: false,
        reason: 'Opportunity has no amount set',
      }
    }

    // Must have a primary contact
    if (!opportunity.primary_contact_id) {
      return {
        shouldGenerate: false,
        reason: 'No primary contact assigned',
      }
    }

    return {
      shouldGenerate: true,
      reason: null,
    }
  } catch {
    return {
      shouldGenerate: false,
      reason: 'Error checking opportunity',
    }
  }
}

// =====================================================
// HELPERS
// =====================================================

/**
 * Resolve the legacy lead/client ID from a CRM contact ID.
 * This handles the mapping between the CRM and legacy systems.
 */
async function resolveClientIdFromContact(
  contactId: string
): Promise<string | null> {
  try {
    const supabase = createAdminClient()

    // First, check if the contact was converted from a lead
    const { data: contact } = await supabase
      .from('crm_contacts')
      .select('id, email')
      .eq('id', contactId)
      .single()

    if (!contact) {
      return null
    }

    // Try to find matching lead by email
    const { data: lead } = await supabase
      .from('leads')
      .select('id')
      .eq('email', contact.email)
      .single()

    if (lead) {
      return lead.id
    }

    // If no matching lead, check if there's a CRM lead that was converted to this contact
    const { data: crmLead } = await supabase
      .from('crm_leads')
      .select('id')
      .eq('converted_contact_id', contactId)
      .single()

    if (crmLead) {
      // Check if there's a legacy lead with the same ID
      const { data: legacyLead } = await supabase
        .from('leads')
        .select('id')
        .eq('id', crmLead.id)
        .single()

      if (legacyLead) {
        return legacyLead.id
      }
    }

    // Fallback: Use the contact ID itself (for systems that support it)
    return contactId
  } catch (err) {
    console.error('Error resolving client ID from contact:', err)
    return null
  }
}

// =====================================================
// OPPORTUNITY STAGE CHANGE HANDLER
// =====================================================

/**
 * Handle opportunity stage change.
 * This can be called from workflow automation or directly when updating an opportunity.
 */
export async function handleOpportunityStageChange(
  opportunityId: string,
  _previousStage: string,
  newStage: string
): Promise<{
  invoiceCreated: boolean
  invoiceId: string | null
  message: string | null
}> {
  // Only act on transition to closed_won
  if (newStage !== 'closed_won') {
    return {
      invoiceCreated: false,
      invoiceId: null,
      message: null,
    }
  }

  // Check if we should generate an invoice
  const { shouldGenerate, reason } = await shouldGenerateInvoice(opportunityId)

  if (!shouldGenerate) {
    return {
      invoiceCreated: false,
      invoiceId: null,
      message: reason,
    }
  }

  // Generate the invoice
  const result = await generateInvoiceFromOpportunity({
    opportunityId,
  })

  return {
    invoiceCreated: result.success,
    invoiceId: result.invoice?.id ?? null,
    message: result.error,
  }
}
