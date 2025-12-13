'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type {
  ImportObjectType,
  ImportResult,
  MappingTemplate,
  ImportJob,
} from '@/lib/import/types'
import { transformRowForInsert, applyMapping } from '@/lib/import/validators'

// Table mapping for each object type
const TABLE_MAP: Record<ImportObjectType, string> = {
  leads: 'leads',
  clients: 'leads', // Clients are leads with status='client'
  invoices: 'invoices',
  meetings: 'meetings',
  services: 'client_services',
}

/**
 * Execute import for a batch of rows
 */
export async function executeImport(
  objectType: ImportObjectType,
  rows: Record<string, string>[],
  mapping: Record<string, string | null>,
  options: {
    fileName: string
    skipDuplicates?: boolean
    duplicateCheckField?: string
  }
): Promise<ImportResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      success: false,
      totalRows: rows.length,
      successfulRows: 0,
      failedRows: rows.length,
      skippedRows: 0,
      errors: [{ row: 0, message: 'Not authenticated' }],
    }
  }

  const tableName = TABLE_MAP[objectType]
  const errors: ImportResult['errors'] = []
  let successfulRows = 0
  let skippedRows = 0

  // Create import job record
  const { data: importJob, error: jobError } = await supabase
    .from('import_jobs')
    .insert({
      object_type: objectType,
      file_name: options.fileName,
      total_rows: rows.length,
      status: 'processing',
      mapping,
      created_by: user.id,
      started_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (jobError) {
    console.error('Failed to create import job:', jobError)
    // Continue without job tracking
  }

  // Process rows in batches of 50
  const BATCH_SIZE = 50
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE)
    const batchResults = await processBatch(
      supabase,
      tableName,
      objectType,
      batch,
      mapping,
      i,
      options
    )

    successfulRows += batchResults.successful
    skippedRows += batchResults.skipped
    errors.push(...batchResults.errors)
  }

  const failedRows = rows.length - successfulRows - skippedRows

  // Update import job with results
  if (importJob) {
    await supabase
      .from('import_jobs')
      .update({
        successful_rows: successfulRows,
        failed_rows: failedRows,
        skipped_rows: skippedRows,
        status: 'completed',
        error_log: errors,
        completed_at: new Date().toISOString(),
      })
      .eq('id', importJob.id)
  }

  // Revalidate the relevant pages
  revalidatePath('/admin')
  revalidatePath(`/admin/${objectType}`)

  return {
    success: failedRows === 0,
    totalRows: rows.length,
    successfulRows,
    failedRows,
    skippedRows,
    errors,
  }
}

/**
 * Process a batch of rows
 */
async function processBatch(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  tableName: string,
  objectType: ImportObjectType,
  rows: Record<string, string>[],
  mapping: Record<string, string | null>,
  startIndex: number,
  options: {
    skipDuplicates?: boolean
    duplicateCheckField?: string
  }
): Promise<{
  successful: number
  skipped: number
  errors: ImportResult['errors']
}> {
  let successful = 0
  let skipped = 0
  const errors: ImportResult['errors'] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!
    const rowNumber = startIndex + i + 1

    try {
      // Apply mapping and transform for insert
      const mappedData = applyMapping(row, mapping)
      const insertData = transformRowForInsert(mappedData, objectType)

      // For clients, ensure status is set to 'client'
      if (objectType === 'clients') {
        insertData.status = 'client'
      }

      // For leads without status, default to 'new'
      if (objectType === 'leads' && !insertData.status) {
        insertData.status = 'new'
      }

      // Check for duplicates if enabled
      if (options.skipDuplicates && options.duplicateCheckField) {
        const checkValue = insertData[options.duplicateCheckField]
        if (checkValue) {
          const { data: existing } = await supabase
            .from(tableName)
            .select('id')
            .eq(options.duplicateCheckField, checkValue)
            .limit(1)
            .single()

          if (existing) {
            skipped++
            continue
          }
        }
      }

      // Insert the record
      const { error: insertError } = await supabase
        .from(tableName)
        .insert(insertData)

      if (insertError) {
        errors.push({
          row: rowNumber,
          message: insertError.message,
          data: insertData,
        })
      } else {
        successful++
      }
    } catch (err) {
      errors.push({
        row: rowNumber,
        message: err instanceof Error ? err.message : 'Unknown error',
      })
    }
  }

  return { successful, skipped, errors }
}

/**
 * Get import history
 */
export async function getImportHistory(
  limit: number = 20
): Promise<{ success: boolean; data: ImportJob[]; error?: string }> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('import_jobs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    return { success: false, data: [], error: error.message }
  }

  return {
    success: true,
    data: data.map(job => ({
      id: job.id,
      objectType: job.object_type as ImportObjectType,
      fileName: job.file_name,
      fileSize: job.file_size,
      totalRows: job.total_rows,
      successfulRows: job.successful_rows,
      failedRows: job.failed_rows,
      skippedRows: job.skipped_rows,
      status: job.status,
      mapping: job.mapping,
      errorLog: job.error_log,
      createdBy: job.created_by,
      createdAt: job.created_at,
      startedAt: job.started_at,
      completedAt: job.completed_at,
    })),
  }
}

/**
 * Save a mapping template
 */
export async function saveMappingTemplate(
  name: string,
  objectType: ImportObjectType,
  mappings: Record<string, string>,
  description?: string
): Promise<{ success: boolean; data?: MappingTemplate; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const { data, error } = await supabase
    .from('import_mapping_templates')
    .insert({
      name,
      object_type: objectType,
      mappings,
      description,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  return {
    success: true,
    data: {
      id: data.id,
      name: data.name,
      description: data.description,
      objectType: data.object_type as ImportObjectType,
      mappings: data.mappings,
      createdAt: data.created_at,
    },
  }
}

/**
 * Get saved mapping templates
 */
export async function getMappingTemplates(
  objectType?: ImportObjectType
): Promise<{ success: boolean; data: MappingTemplate[]; error?: string }> {
  const supabase = await createClient()

  let query = supabase
    .from('import_mapping_templates')
    .select('*')
    .order('name')

  if (objectType) {
    query = query.eq('object_type', objectType)
  }

  const { data, error } = await query

  if (error) {
    return { success: false, data: [], error: error.message }
  }

  return {
    success: true,
    data: data.map(template => ({
      id: template.id,
      name: template.name,
      description: template.description,
      objectType: template.object_type as ImportObjectType,
      mappings: template.mappings,
      createdAt: template.created_at,
    })),
  }
}

/**
 * Delete a mapping template
 */
export async function deleteMappingTemplate(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('import_mapping_templates')
    .delete()
    .eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}
