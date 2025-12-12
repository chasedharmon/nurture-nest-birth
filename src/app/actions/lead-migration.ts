'use server'

/**
 * Lead Migration Server Actions
 *
 * Handles migration of data from the legacy `leads` table to the new CRM `crm_leads` table.
 * This is a one-time migration operation that:
 *
 * 1. Analyzes the legacy leads and shows a preview
 * 2. Maps field values from old schema to new schema
 * 3. Migrates in batches with progress tracking
 * 4. Tracks migration status to prevent duplicates (idempotent)
 * 5. Validates data before and after migration
 *
 * Field Mapping Strategy:
 * - name (single field) -> first_name + last_name (split on first space)
 * - status (new, contacted, scheduled, client, lost) -> lead_status (new, contacted, qualified, unqualified, converted)
 * - due_date + expected_due_date -> expected_due_date
 * - source (contact_form, newsletter, manual) -> lead_source
 * - All timestamps preserved (created_at, updated_at)
 */

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// =====================================================
// TYPES
// =====================================================

export interface LegacyLead {
  id: string
  created_at: string
  updated_at: string
  source: 'contact_form' | 'newsletter' | 'manual'
  status: 'new' | 'contacted' | 'scheduled' | 'client' | 'lost'
  name: string
  email: string
  phone: string | null
  due_date: string | null
  service_interest: string | null
  message: string | null
  email_domain: string | null
  assigned_to_user_id: string | null
  partner_name: string | null
  address: Record<string, unknown> | null
  birth_preferences: Record<string, unknown> | null
  medical_info: Record<string, unknown> | null
  emergency_contact: Record<string, unknown> | null
  expected_due_date: string | null
  actual_birth_date: string | null
  client_type: string | null
  tags: string[] | null
  lifecycle_stage: string | null
  email_verified: boolean | null
  last_login_at: string | null
  password_hash: string | null
  primary_provider_id: string | null
  journey_phase: string | null
  journey_started_at: string | null
  last_portal_visit: string | null
  migrated_to_crm_id?: string | null
}

export interface MigrationPreview {
  totalLegacyLeads: number
  alreadyMigrated: number
  toMigrate: number
  sampleMappings: Array<{
    legacy: Partial<LegacyLead>
    crm: Record<string, unknown>
  }>
  statusBreakdown: Record<string, number>
  sourceBreakdown: Record<string, number>
}

export interface MigrationResult {
  success: boolean
  migratedCount: number
  skippedCount: number
  errors: Array<{ legacyId: string; error: string }>
  dryRun: boolean
}

export interface MigrationStatus {
  totalLegacy: number
  migrated: number
  remaining: number
  lastMigratedAt: string | null
  hasMigrationColumn: boolean
}

// =====================================================
// STATUS MAPPING
// =====================================================

type LegacyStatus = 'new' | 'contacted' | 'scheduled' | 'client' | 'lost'
type CrmLeadStatus =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'unqualified'
  | 'converted'

/**
 * Maps legacy lead status to CRM lead status
 *
 * Legacy -> CRM mapping:
 * - new -> new
 * - contacted -> contacted
 * - scheduled -> qualified (they've agreed to a consultation)
 * - client -> converted (they became a client)
 * - lost -> unqualified
 */
function mapLegacyStatus(legacyStatus: LegacyStatus): CrmLeadStatus {
  const statusMap: Record<LegacyStatus, CrmLeadStatus> = {
    new: 'new',
    contacted: 'contacted',
    scheduled: 'qualified',
    client: 'converted',
    lost: 'unqualified',
  }
  return statusMap[legacyStatus] || 'new'
}

/**
 * Maps legacy source to CRM lead source
 */
function mapLegacySource(legacySource: string): string {
  const sourceMap: Record<string, string> = {
    contact_form: 'Website Form',
    newsletter: 'Newsletter',
    manual: 'Manual Entry',
  }
  return sourceMap[legacySource] || legacySource
}

// =====================================================
// NAME PARSING
// =====================================================

/**
 * Splits a full name into first and last name
 * Handles edge cases like single names, multiple middle names, etc.
 */
function parseName(fullName: string): { firstName: string; lastName: string } {
  if (!fullName || !fullName.trim()) {
    return { firstName: 'Unknown', lastName: '' }
  }

  const trimmed = fullName.trim()
  const parts = trimmed.split(/\s+/)

  if (parts.length === 1) {
    return { firstName: parts[0] ?? 'Unknown', lastName: '' }
  }

  // First word is first name, rest is last name
  const [first, ...rest] = parts
  return {
    firstName: first ?? 'Unknown',
    lastName: rest.join(' '),
  }
}

// =====================================================
// FIELD MAPPING
// =====================================================

/**
 * Maps a legacy lead to the CRM lead schema
 */
function mapLegacyToCrm(
  legacy: LegacyLead,
  organizationId: string
): Record<string, unknown> {
  const { firstName, lastName } = parseName(legacy.name)

  return {
    // Organization (required for RLS)
    organization_id: organizationId,

    // Person info
    first_name: firstName,
    last_name: lastName || 'Unknown',
    email: legacy.email || null,
    phone: legacy.phone || null,

    // Status mapping
    lead_status: mapLegacyStatus(legacy.status),
    lead_source: mapLegacySource(legacy.source),

    // Interest
    service_interest: legacy.service_interest || null,
    message: legacy.message || null,

    // Doula-specific
    expected_due_date: legacy.expected_due_date || legacy.due_date || null,

    // Ownership
    owner_id: legacy.assigned_to_user_id || null,

    // Conversion tracking (for already-converted leads)
    is_converted: legacy.status === 'client',
    converted_at: legacy.status === 'client' ? legacy.updated_at : null,

    // Custom fields - store extra data that doesn't have a direct mapping
    custom_fields: {
      legacy_id: legacy.id,
      legacy_partner_name: legacy.partner_name,
      legacy_client_type: legacy.client_type,
      legacy_tags: legacy.tags,
      legacy_lifecycle_stage: legacy.lifecycle_stage,
      legacy_address: legacy.address,
      legacy_birth_preferences: legacy.birth_preferences,
      legacy_medical_info: legacy.medical_info,
      legacy_emergency_contact: legacy.emergency_contact,
    },

    // Preserve timestamps
    created_at: legacy.created_at,
    updated_at: legacy.updated_at,
  }
}

// =====================================================
// MIGRATION PREVIEW
// =====================================================

/**
 * Get a preview of what will be migrated
 * Shows counts, sample mappings, and breakdown by status/source
 */
export async function getMigrationPreview(): Promise<{
  data: MigrationPreview | null
  error: string | null
}> {
  try {
    const supabase = await createClient()

    // Get organization ID for the current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { data: null, error: 'Not authenticated' }
    }

    // Get all legacy leads
    const { data: allLeads, error: leadsError } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })

    if (leadsError) {
      return {
        data: null,
        error: `Failed to fetch leads: ${leadsError.message}`,
      }
    }

    const leads = (allLeads || []) as LegacyLead[]

    // Check which have been migrated (if column exists)
    const alreadyMigrated = leads.filter(l => l.migrated_to_crm_id).length

    // Calculate breakdowns
    const statusBreakdown: Record<string, number> = {}
    const sourceBreakdown: Record<string, number> = {}

    for (const lead of leads) {
      statusBreakdown[lead.status] = (statusBreakdown[lead.status] || 0) + 1
      sourceBreakdown[lead.source] = (sourceBreakdown[lead.source] || 0) + 1
    }

    // Get user's organization ID
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    const organizationId = userData?.organization_id || user.id

    // Create sample mappings (first 3 unmigrated leads)
    const unmigrated = leads.filter(l => !l.migrated_to_crm_id).slice(0, 3)
    const sampleMappings = unmigrated.map(legacy => ({
      legacy: {
        id: legacy.id,
        name: legacy.name,
        email: legacy.email,
        status: legacy.status,
        source: legacy.source,
        service_interest: legacy.service_interest,
        expected_due_date: legacy.expected_due_date,
        created_at: legacy.created_at,
      },
      crm: mapLegacyToCrm(legacy, organizationId),
    }))

    return {
      data: {
        totalLegacyLeads: leads.length,
        alreadyMigrated,
        toMigrate: leads.length - alreadyMigrated,
        sampleMappings,
        statusBreakdown,
        sourceBreakdown,
      },
      error: null,
    }
  } catch (err) {
    console.error('Error getting migration preview:', err)
    return { data: null, error: 'An unexpected error occurred' }
  }
}

// =====================================================
// MIGRATION STATUS
// =====================================================

/**
 * Get current migration status
 */
export async function getMigrationStatus(): Promise<{
  data: MigrationStatus | null
  error: string | null
}> {
  try {
    const supabase = await createClient()

    // Get total legacy leads
    const { count: totalLegacy, error: countError } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      return { data: null, error: countError.message }
    }

    // Check if migration column exists by trying to select it
    let hasMigrationColumn = false
    let migrated = 0
    let lastMigratedAt: string | null = null

    try {
      const { data: migratedLeads, error: migratedError } = await supabase
        .from('leads')
        .select('migrated_to_crm_id, updated_at')
        .not('migrated_to_crm_id', 'is', null)
        .order('updated_at', { ascending: false })
        .limit(1)

      if (!migratedError) {
        hasMigrationColumn = true

        // Count migrated
        const { count: migratedCount } = await supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .not('migrated_to_crm_id', 'is', null)

        migrated = migratedCount || 0
        lastMigratedAt = migratedLeads?.[0]?.updated_at || null
      }
    } catch {
      // Column doesn't exist yet
      hasMigrationColumn = false
    }

    return {
      data: {
        totalLegacy: totalLegacy || 0,
        migrated,
        remaining: (totalLegacy || 0) - migrated,
        lastMigratedAt,
        hasMigrationColumn,
      },
      error: null,
    }
  } catch (err) {
    console.error('Error getting migration status:', err)
    return { data: null, error: 'An unexpected error occurred' }
  }
}

// =====================================================
// MAIN MIGRATION ACTION
// =====================================================

/**
 * Migrate legacy leads to CRM leads
 *
 * Options:
 * - batchSize: Number of leads to migrate per batch (default: 50)
 * - dryRun: If true, validate but don't actually migrate (default: false)
 * - limit: Maximum number of leads to migrate (optional)
 */
export async function migrateLegacyLeads(options: {
  batchSize?: number
  dryRun?: boolean
  limit?: number
}): Promise<MigrationResult> {
  const { batchSize = 50, dryRun = false, limit } = options

  try {
    const supabase = await createClient()

    // Verify authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return {
        success: false,
        migratedCount: 0,
        skippedCount: 0,
        errors: [{ legacyId: '', error: 'Not authenticated' }],
        dryRun,
      }
    }

    // Get user's organization ID
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    // Use organization_id if available, otherwise use a default org
    // In production, we'd require an organization_id
    let organizationId = userData?.organization_id

    if (!organizationId) {
      // Get or create a default organization
      const { data: defaultOrg } = await supabase
        .from('organizations')
        .select('id')
        .limit(1)
        .single()

      if (!defaultOrg) {
        return {
          success: false,
          migratedCount: 0,
          skippedCount: 0,
          errors: [
            {
              legacyId: '',
              error:
                'No organization found. Please set up an organization first.',
            },
          ],
          dryRun,
        }
      }
      organizationId = defaultOrg.id
    }

    // Build query for unmigrated leads
    let query = supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: true })

    // Try to filter only unmigrated leads (if column exists)
    try {
      query = query.is('migrated_to_crm_id', null)
    } catch {
      // Column doesn't exist, will migrate all
    }

    if (limit) {
      query = query.limit(limit)
    }

    const { data: leadsToMigrate, error: fetchError } = await query

    if (fetchError) {
      return {
        success: false,
        migratedCount: 0,
        skippedCount: 0,
        errors: [
          {
            legacyId: '',
            error: `Failed to fetch leads: ${fetchError.message}`,
          },
        ],
        dryRun,
      }
    }

    const leads = (leadsToMigrate || []) as LegacyLead[]
    const errors: Array<{ legacyId: string; error: string }> = []
    let migratedCount = 0
    let skippedCount = 0

    // Process in batches
    for (let i = 0; i < leads.length; i += batchSize) {
      const batch = leads.slice(i, i + batchSize)

      for (const legacy of batch) {
        // Skip if already migrated
        if (legacy.migrated_to_crm_id) {
          skippedCount++
          continue
        }

        try {
          const crmData = mapLegacyToCrm(legacy, organizationId)

          if (dryRun) {
            // In dry run, just validate the mapping
            if (!crmData.first_name) {
              errors.push({
                legacyId: legacy.id,
                error: 'Missing first name after parsing',
              })
            } else {
              migratedCount++
            }
            continue
          }

          // Insert into CRM leads
          const { data: newCrmLead, error: insertError } = await supabase
            .from('crm_leads')
            .insert(crmData)
            .select('id')
            .single()

          if (insertError) {
            errors.push({ legacyId: legacy.id, error: insertError.message })
            continue
          }

          // Update legacy lead with migration reference
          const { error: updateError } = await supabase
            .from('leads')
            .update({ migrated_to_crm_id: newCrmLead.id })
            .eq('id', legacy.id)

          if (updateError) {
            // Migration succeeded but tracking failed - log but don't fail
            console.warn(
              `Failed to update migration tracking for ${legacy.id}: ${updateError.message}`
            )
          }

          migratedCount++
        } catch (err) {
          errors.push({
            legacyId: legacy.id,
            error: err instanceof Error ? err.message : 'Unknown error',
          })
        }
      }
    }

    // Revalidate paths
    if (!dryRun && migratedCount > 0) {
      revalidatePath('/admin/crm-leads')
      revalidatePath('/admin/leads')
      revalidatePath('/admin/setup/migration')
    }

    return {
      success: errors.length === 0,
      migratedCount,
      skippedCount,
      errors,
      dryRun,
    }
  } catch (err) {
    console.error('Unexpected error in migrateLegacyLeads:', err)
    return {
      success: false,
      migratedCount: 0,
      skippedCount: 0,
      errors: [{ legacyId: '', error: 'An unexpected error occurred' }],
      dryRun,
    }
  }
}

// =====================================================
// VALIDATION
// =====================================================

/**
 * Validate migration by comparing counts and spot-checking records
 */
export async function validateMigration(): Promise<{
  valid: boolean
  legacyCount: number
  crmCount: number
  discrepancy: number
  sampleValidation: Array<{
    legacyId: string
    crmId: string
    matches: boolean
    issues: string[]
  }>
}> {
  try {
    const supabase = await createClient()

    // Get counts
    const { count: legacyCount } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .not('migrated_to_crm_id', 'is', null)

    const { count: crmCount } = await supabase
      .from('crm_leads')
      .select('*', { count: 'exact', head: true })

    // Get sample of migrated leads for spot-check
    const { data: sampleLeads } = await supabase
      .from('leads')
      .select('id, name, email, status, migrated_to_crm_id')
      .not('migrated_to_crm_id', 'is', null)
      .limit(5)

    const sampleValidation: Array<{
      legacyId: string
      crmId: string
      matches: boolean
      issues: string[]
    }> = []

    if (sampleLeads) {
      for (const legacy of sampleLeads) {
        if (!legacy.migrated_to_crm_id) continue

        const { data: crmLead } = await supabase
          .from('crm_leads')
          .select('*')
          .eq('id', legacy.migrated_to_crm_id)
          .single()

        const issues: string[] = []

        if (!crmLead) {
          issues.push('CRM lead not found')
        } else {
          // Validate email matches
          if (legacy.email !== crmLead.email) {
            issues.push(`Email mismatch: ${legacy.email} vs ${crmLead.email}`)
          }

          // Validate name was parsed correctly
          const { firstName } = parseName(legacy.name)
          if (firstName !== crmLead.first_name) {
            issues.push(
              `First name mismatch: ${firstName} vs ${crmLead.first_name}`
            )
          }
        }

        sampleValidation.push({
          legacyId: legacy.id,
          crmId: legacy.migrated_to_crm_id,
          matches: issues.length === 0,
          issues,
        })
      }
    }

    return {
      valid:
        (legacyCount || 0) === (crmCount || 0) &&
        sampleValidation.every(s => s.matches),
      legacyCount: legacyCount || 0,
      crmCount: crmCount || 0,
      discrepancy: Math.abs((legacyCount || 0) - (crmCount || 0)),
      sampleValidation,
    }
  } catch (err) {
    console.error('Error validating migration:', err)
    return {
      valid: false,
      legacyCount: 0,
      crmCount: 0,
      discrepancy: 0,
      sampleValidation: [],
    }
  }
}
