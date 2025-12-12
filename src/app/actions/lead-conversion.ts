'use server'

/**
 * Lead Conversion Server Actions
 *
 * Handles the conversion of a Lead into Contact, Account, and optionally
 * Opportunity records. This is a core CRM workflow that:
 *
 * 1. Validates the Lead is eligible for conversion
 * 2. Creates or links to an Account
 * 3. Creates a new Contact with Lead data mapped
 * 4. Optionally creates an Opportunity
 * 5. Transfers Lead activities to the new Contact
 * 6. Marks the Lead as converted with FK references
 *
 * The entire operation is designed to be atomic - if any step fails,
 * the whole conversion should be rolled back.
 */

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type {
  CrmLead,
  CrmContact,
  CrmAccount,
  CrmOpportunity,
  OpportunityStage,
} from '@/lib/crm/types'

// =====================================================
// TYPES
// =====================================================

export interface ConvertLeadOptions {
  leadId: string

  // Account handling
  accountOption: 'create' | 'existing'
  existingAccountId?: string
  accountData?: Partial<CrmAccount>

  // Contact customizations
  contactData?: Partial<CrmContact>

  // Opportunity options
  createOpportunity: boolean
  opportunityData?: Partial<CrmOpportunity>
}

export interface ConvertLeadResult {
  success: boolean
  contactId?: string
  accountId?: string
  opportunityId?: string
  error?: string
}

export interface LeadConversionPreview {
  lead: CrmLead
  mappedContactData: Partial<CrmContact>
  mappedAccountData: Partial<CrmAccount>
  suggestedOpportunityName: string
}

// =====================================================
// FIELD MAPPINGS
// =====================================================

/**
 * Maps Lead fields to Contact fields
 */
function mapLeadToContact(lead: CrmLead): Partial<CrmContact> {
  return {
    first_name: lead.first_name,
    last_name: lead.last_name,
    email: lead.email,
    phone: lead.phone,
    lead_source: lead.lead_source,
    expected_due_date: lead.expected_due_date,
    // Attribution fields
    referral_partner_id: lead.referral_partner_id,
    utm_source: lead.utm_source,
    utm_medium: lead.utm_medium,
    utm_campaign: lead.utm_campaign,
    // Custom fields transfer
    custom_fields: lead.custom_fields || {},
  }
}

/**
 * Maps Lead fields to Account fields
 * For doula CRM, accounts represent households/families
 */
function mapLeadToAccount(lead: CrmLead): Partial<CrmAccount> {
  // Default account name is "The [LastName] Family"
  const accountName = lead.last_name
    ? `The ${lead.last_name} Family`
    : `${lead.first_name} ${lead.last_name}`.trim()

  return {
    name: accountName,
    account_type: 'household',
    account_status: 'prospect',
  }
}

/**
 * Generate default opportunity name
 */
function generateOpportunityName(lead: CrmLead, serviceType?: string): string {
  const name = `${lead.first_name} ${lead.last_name}`.trim()
  const service = serviceType || lead.service_interest || 'Doula Services'
  return `${name} - ${service}`
}

// =====================================================
// VALIDATION
// =====================================================

/**
 * Validate that a lead can be converted
 */
export async function validateLeadForConversion(leadId: string): Promise<{
  valid: boolean
  lead?: CrmLead
  error?: string
}> {
  try {
    const supabase = await createClient()

    const { data: lead, error } = await supabase
      .from('crm_leads')
      .select('*')
      .eq('id', leadId)
      .single()

    if (error || !lead) {
      return { valid: false, error: 'Lead not found' }
    }

    if (lead.is_converted) {
      return {
        valid: false,
        lead: lead as CrmLead,
        error: 'This lead has already been converted',
      }
    }

    return { valid: true, lead: lead as CrmLead }
  } catch (err) {
    console.error('Error validating lead:', err)
    return { valid: false, error: 'An unexpected error occurred' }
  }
}

// =====================================================
// PREVIEW
// =====================================================

/**
 * Get conversion preview data (what will be created)
 */
export async function getConversionPreview(
  leadId: string
): Promise<{ data: LeadConversionPreview | null; error: string | null }> {
  try {
    const validation = await validateLeadForConversion(leadId)

    if (!validation.valid || !validation.lead) {
      return { data: null, error: validation.error || 'Lead not found' }
    }

    const lead = validation.lead

    return {
      data: {
        lead,
        mappedContactData: mapLeadToContact(lead),
        mappedAccountData: mapLeadToAccount(lead),
        suggestedOpportunityName: generateOpportunityName(lead),
      },
      error: null,
    }
  } catch (err) {
    console.error('Error getting conversion preview:', err)
    return { data: null, error: 'An unexpected error occurred' }
  }
}

// =====================================================
// MAIN CONVERSION ACTION
// =====================================================

/**
 * Convert a Lead into Contact, Account, and optionally Opportunity
 *
 * This is the main conversion action that orchestrates the entire process.
 */
export async function convertLead(
  options: ConvertLeadOptions
): Promise<ConvertLeadResult> {
  const {
    leadId,
    accountOption,
    existingAccountId,
    accountData,
    contactData,
    createOpportunity,
    opportunityData,
  } = options

  try {
    const supabase = await createClient()

    // 1. Validate lead is convertible
    const validation = await validateLeadForConversion(leadId)
    if (!validation.valid || !validation.lead) {
      return { success: false, error: validation.error || 'Lead not found' }
    }

    const lead = validation.lead

    // 2. Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // 3. Handle Account (create or use existing)
    let accountId: string

    if (accountOption === 'existing' && existingAccountId) {
      // Verify existing account exists
      const { data: existingAccount, error: accountError } = await supabase
        .from('crm_accounts')
        .select('id')
        .eq('id', existingAccountId)
        .single()

      if (accountError || !existingAccount) {
        return { success: false, error: 'Selected account not found' }
      }

      accountId = existingAccountId
    } else {
      // Create new account
      const mappedAccountData = mapLeadToAccount(lead)
      const newAccountData = {
        ...mappedAccountData,
        ...accountData, // Override with user customizations
        owner_id: user.id,
      }

      const { data: newAccount, error: createAccountError } = await supabase
        .from('crm_accounts')
        .insert(newAccountData)
        .select('id')
        .single()

      if (createAccountError || !newAccount) {
        console.error('Error creating account:', createAccountError)
        return { success: false, error: 'Failed to create account' }
      }

      accountId = newAccount.id
    }

    // 4. Create Contact
    const mappedContactData = mapLeadToContact(lead)
    const newContactData = {
      ...mappedContactData,
      ...contactData, // Override with user customizations
      account_id: accountId,
      owner_id: user.id,
      is_active: true,
    }

    const { data: newContact, error: createContactError } = await supabase
      .from('crm_contacts')
      .insert(newContactData)
      .select('id')
      .single()

    if (createContactError || !newContact) {
      console.error('Error creating contact:', createContactError)
      // Note: In a production system, we'd roll back the account creation
      // For now, we'll just return the error
      return { success: false, error: 'Failed to create contact' }
    }

    const contactId = newContact.id

    // 5. Update Account with primary contact
    await supabase
      .from('crm_accounts')
      .update({ primary_contact_id: contactId })
      .eq('id', accountId)

    // 6. Create Contact-Account relationship
    await supabase.from('contact_account_relationships').insert({
      contact_id: contactId,
      account_id: accountId,
      relationship_type: 'primary',
      is_primary: true,
    })

    // 7. Create Opportunity (if requested)
    let opportunityId: string | undefined

    if (createOpportunity) {
      const newOpportunityData = {
        name:
          opportunityData?.name ||
          generateOpportunityName(
            lead,
            opportunityData?.service_type as string | undefined
          ),
        account_id: accountId,
        primary_contact_id: contactId,
        stage: (opportunityData?.stage as OpportunityStage) || 'qualification',
        stage_probability: 10,
        amount: opportunityData?.amount || lead.estimated_value,
        close_date: opportunityData?.close_date,
        service_type: opportunityData?.service_type || lead.service_interest,
        owner_id: user.id,
        is_closed: false,
        is_won: false,
        ...opportunityData,
      }

      const { data: newOpportunity, error: createOppError } = await supabase
        .from('crm_opportunities')
        .insert(newOpportunityData)
        .select('id')
        .single()

      if (createOppError) {
        console.error('Error creating opportunity:', createOppError)
        // Continue without opportunity - not critical
      } else if (newOpportunity) {
        opportunityId = newOpportunity.id
      }
    }

    // 8. Transfer activities from Lead to Contact
    await supabase
      .from('crm_activities')
      .update({
        who_type: 'Contact',
        who_id: contactId,
      })
      .eq('who_type', 'Lead')
      .eq('who_id', leadId)

    // 9. Mark Lead as converted
    const { error: updateLeadError } = await supabase
      .from('crm_leads')
      .update({
        is_converted: true,
        converted_at: new Date().toISOString(),
        converted_contact_id: contactId,
        converted_account_id: accountId,
        converted_opportunity_id: opportunityId || null,
        converted_by: user.id,
        lead_status: 'converted',
      })
      .eq('id', leadId)

    if (updateLeadError) {
      console.error('Error updating lead:', updateLeadError)
      // The conversion succeeded, but marking the lead failed
      // In production, this should be handled more carefully
    }

    // Revalidate paths
    revalidatePath('/admin/crm-leads')
    revalidatePath(`/admin/crm-leads/${leadId}`)
    revalidatePath('/admin/contacts')
    revalidatePath(`/admin/contacts/${contactId}`)
    revalidatePath('/admin/accounts')
    revalidatePath(`/admin/accounts/${accountId}`)
    if (opportunityId) {
      revalidatePath('/admin/opportunities')
      revalidatePath(`/admin/opportunities/${opportunityId}`)
    }

    return {
      success: true,
      contactId,
      accountId,
      opportunityId,
    }
  } catch (err) {
    console.error('Unexpected error in convertLead:', err)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

// =====================================================
// ACCOUNT SEARCH FOR WIZARD
// =====================================================

/**
 * Search existing accounts for the wizard
 */
export async function searchAccountsForConversion(
  searchTerm: string,
  limit: number = 10
): Promise<{
  data: Array<{
    id: string
    name: string
    account_type: string
    account_status: string
    primary_contact_name?: string
  }> | null
  error: string | null
}> {
  try {
    const supabase = await createClient()

    let query = supabase
      .from('crm_accounts')
      .select(
        `
        id,
        name,
        account_type,
        account_status,
        crm_contacts!crm_accounts_primary_contact_id_fkey (
          first_name,
          last_name
        )
      `
      )
      .limit(limit)
      .order('name', { ascending: true })

    if (searchTerm && searchTerm.trim()) {
      query = query.ilike('name', `%${searchTerm}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error searching accounts:', error)
      return { data: null, error: error.message }
    }

    const accounts = (data || []).map(account => {
      const contact = account.crm_contacts as {
        first_name?: string
        last_name?: string
      } | null
      return {
        id: account.id,
        name: account.name,
        account_type: account.account_type,
        account_status: account.account_status,
        primary_contact_name: contact
          ? `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
          : undefined,
      }
    })

    return { data: accounts, error: null }
  } catch (err) {
    console.error('Unexpected error in searchAccountsForConversion:', err)
    return { data: null, error: 'An unexpected error occurred' }
  }
}
