'use server'

/**
 * Generic CRM Record Server Actions
 *
 * These actions provide CRUD operations for any CRM object using
 * the metadata-driven architecture. They work with:
 * - Contact, Account, Lead, Opportunity, Activity
 * - Custom objects (with table_name in object_definitions)
 *
 * The actions dynamically determine the table to query based on
 * object_definitions metadata.
 */

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type {
  FilterCondition,
  FilterOperator,
  CrmContact,
  CrmAccount,
  CrmLead,
  CrmOpportunity,
  CrmActivity,
} from '@/lib/crm/types'

// =====================================================
// TYPES
// =====================================================

export interface PaginationConfig {
  page: number
  pageSize: number
}

export interface SortConfig {
  field: string
  direction: 'asc' | 'desc'
}

export interface GetRecordsOptions {
  filters?: FilterCondition[]
  sort?: SortConfig
  pagination?: PaginationConfig
  search?: string
  searchFields?: string[]
}

export interface GetRecordsResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  error: string | null
}

export interface RecordResult<T> {
  data: T | null
  error: string | null
}

// Union type for all CRM record types
export type CrmRecord =
  | CrmContact
  | CrmAccount
  | CrmLead
  | CrmOpportunity
  | CrmActivity

// =====================================================
// TABLE MAPPING
// =====================================================

const OBJECT_TABLE_MAP: Record<string, string> = {
  Contact: 'crm_contacts',
  Account: 'crm_accounts',
  Lead: 'crm_leads',
  Opportunity: 'crm_opportunities',
  Activity: 'crm_activities',
}

/**
 * Get table name for an object API name
 */
async function getTableName(objectApiName: string): Promise<string | null> {
  // First check static map
  if (OBJECT_TABLE_MAP[objectApiName]) {
    return OBJECT_TABLE_MAP[objectApiName]
  }

  // For custom objects, look up in object_definitions
  const supabase = await createClient()
  const { data } = await supabase
    .from('object_definitions')
    .select('table_name')
    .eq('api_name', objectApiName)
    .eq('is_active', true)
    .single()

  return data?.table_name || null
}

// =====================================================
// GET RECORDS (LIST)
// =====================================================

/**
 * Get a list of records for any CRM object with filtering, sorting, and pagination
 */
export async function getRecords<T = CrmRecord>(
  objectApiName: string,
  options: GetRecordsOptions = {}
): Promise<GetRecordsResult<T>> {
  try {
    const supabase = await createClient()

    // Get table name
    const tableName = await getTableName(objectApiName)
    if (!tableName) {
      return {
        data: [],
        total: 0,
        page: 1,
        pageSize: 50,
        totalPages: 0,
        error: `Unknown object: ${objectApiName}`,
      }
    }

    const {
      filters = [],
      sort = { field: 'created_at', direction: 'desc' },
      pagination = { page: 1, pageSize: 50 },
      search,
      searchFields = [],
    } = options

    // Start query with count
    let query = supabase.from(tableName).select('*', { count: 'exact' })

    // Apply search across multiple fields
    if (search && search.trim() && searchFields.length > 0) {
      const searchTerm = search.trim()
      const searchConditions = searchFields
        .map(field => `${field}.ilike.%${searchTerm}%`)
        .join(',')
      query = query.or(searchConditions)
    }

    // Apply filters
    for (const filter of filters) {
      query = applyFilter(query, filter)
    }

    // Apply sorting
    query = query.order(sort.field, { ascending: sort.direction === 'asc' })

    // Apply pagination
    const offset = (pagination.page - 1) * pagination.pageSize
    query = query.range(offset, offset + pagination.pageSize - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching records:', error)
      return {
        data: [],
        total: 0,
        page: pagination.page,
        pageSize: pagination.pageSize,
        totalPages: 0,
        error: error.message,
      }
    }

    const total = count || 0
    const totalPages = Math.ceil(total / pagination.pageSize)

    return {
      data: (data || []) as T[],
      total,
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalPages,
      error: null,
    }
  } catch (err) {
    console.error('Unexpected error in getRecords:', err)
    return {
      data: [],
      total: 0,
      page: 1,
      pageSize: 50,
      totalPages: 0,
      error: 'An unexpected error occurred',
    }
  }
}

// =====================================================
// GET RECORD BY ID
// =====================================================

/**
 * Get a single record by ID
 */
export async function getRecordById<T = CrmRecord>(
  objectApiName: string,
  id: string
): Promise<RecordResult<T>> {
  try {
    const supabase = await createClient()

    const tableName = await getTableName(objectApiName)
    if (!tableName) {
      return { data: null, error: `Unknown object: ${objectApiName}` }
    }

    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return { data: null, error: 'Record not found' }
      }
      return { data: null, error: error.message }
    }

    return { data: data as T, error: null }
  } catch (err) {
    console.error('Unexpected error in getRecordById:', err)
    return { data: null, error: 'An unexpected error occurred' }
  }
}

// =====================================================
// CREATE RECORD
// =====================================================

/**
 * Create a new record
 */
export async function createRecord<T = CrmRecord>(
  objectApiName: string,
  data: Partial<T>
): Promise<RecordResult<T>> {
  try {
    const supabase = await createClient()

    const tableName = await getTableName(objectApiName)
    if (!tableName) {
      return { data: null, error: `Unknown object: ${objectApiName}` }
    }

    // Get current user for owner_id
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: 'Not authenticated' }
    }

    // Prepare record data
    const recordData = {
      ...data,
      owner_id: (data as Record<string, unknown>).owner_id || user.id,
    }

    const { data: created, error } = await supabase
      .from(tableName)
      .insert(recordData)
      .select()
      .single()

    if (error) {
      console.error('Error creating record:', error)
      return { data: null, error: error.message }
    }

    // Revalidate paths
    revalidatePath(`/admin/${objectApiName.toLowerCase()}s`)

    return { data: created as T, error: null }
  } catch (err) {
    console.error('Unexpected error in createRecord:', err)
    return { data: null, error: 'An unexpected error occurred' }
  }
}

// =====================================================
// UPDATE RECORD
// =====================================================

/**
 * Update an existing record
 */
export async function updateRecord<T = CrmRecord>(
  objectApiName: string,
  id: string,
  updates: Partial<T>
): Promise<RecordResult<T>> {
  try {
    const supabase = await createClient()

    const tableName = await getTableName(objectApiName)
    if (!tableName) {
      return { data: null, error: `Unknown object: ${objectApiName}` }
    }

    // Remove fields that shouldn't be updated
    const {
      id: _,
      created_at: _created,
      organization_id: _org,
      ...safeUpdates
    } = updates as Record<string, unknown>

    const { data, error } = await supabase
      .from(tableName)
      .update(safeUpdates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating record:', error)
      return { data: null, error: error.message }
    }

    // Revalidate paths
    revalidatePath(`/admin/${objectApiName.toLowerCase()}s`)
    revalidatePath(`/admin/${objectApiName.toLowerCase()}s/${id}`)

    return { data: data as T, error: null }
  } catch (err) {
    console.error('Unexpected error in updateRecord:', err)
    return { data: null, error: 'An unexpected error occurred' }
  }
}

// =====================================================
// DELETE RECORD
// =====================================================

/**
 * Delete a record by ID
 */
export async function deleteRecord(
  objectApiName: string,
  id: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient()

    const tableName = await getTableName(objectApiName)
    if (!tableName) {
      return { success: false, error: `Unknown object: ${objectApiName}` }
    }

    const { error } = await supabase.from(tableName).delete().eq('id', id)

    if (error) {
      console.error('Error deleting record:', error)
      return { success: false, error: error.message }
    }

    // Revalidate paths
    revalidatePath(`/admin/${objectApiName.toLowerCase()}s`)

    return { success: true, error: null }
  } catch (err) {
    console.error('Unexpected error in deleteRecord:', err)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

// =====================================================
// BULK OPERATIONS
// =====================================================

/**
 * Delete multiple records
 */
export async function bulkDeleteRecords(
  objectApiName: string,
  ids: string[]
): Promise<{ success: boolean; deletedCount: number; error: string | null }> {
  try {
    const supabase = await createClient()

    const tableName = await getTableName(objectApiName)
    if (!tableName) {
      return {
        success: false,
        deletedCount: 0,
        error: `Unknown object: ${objectApiName}`,
      }
    }

    const { error } = await supabase.from(tableName).delete().in('id', ids)

    if (error) {
      console.error('Error bulk deleting records:', error)
      return { success: false, deletedCount: 0, error: error.message }
    }

    revalidatePath(`/admin/${objectApiName.toLowerCase()}s`)

    return { success: true, deletedCount: ids.length, error: null }
  } catch (err) {
    console.error('Unexpected error in bulkDeleteRecords:', err)
    return {
      success: false,
      deletedCount: 0,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Update a field on multiple records
 */
export async function bulkUpdateRecords(
  objectApiName: string,
  ids: string[],
  updates: Record<string, unknown>
): Promise<{ success: boolean; updatedCount: number; error: string | null }> {
  try {
    const supabase = await createClient()

    const tableName = await getTableName(objectApiName)
    if (!tableName) {
      return {
        success: false,
        updatedCount: 0,
        error: `Unknown object: ${objectApiName}`,
      }
    }

    // Remove fields that shouldn't be updated
    const {
      id: _,
      created_at: _created,
      organization_id: _org,
      ...safeUpdates
    } = updates

    const { error } = await supabase
      .from(tableName)
      .update(safeUpdates)
      .in('id', ids)

    if (error) {
      console.error('Error bulk updating records:', error)
      return { success: false, updatedCount: 0, error: error.message }
    }

    revalidatePath(`/admin/${objectApiName.toLowerCase()}s`)

    return { success: true, updatedCount: ids.length, error: null }
  } catch (err) {
    console.error('Unexpected error in bulkUpdateRecords:', err)
    return {
      success: false,
      updatedCount: 0,
      error: 'An unexpected error occurred',
    }
  }
}

// =====================================================
// INLINE EDITING
// =====================================================

/**
 * Update a single field on a record (for inline editing)
 */
export async function inlineUpdateRecord(
  objectApiName: string,
  id: string,
  field: string,
  value: unknown
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient()

    const tableName = await getTableName(objectApiName)
    if (!tableName) {
      return { success: false, error: `Unknown object: ${objectApiName}` }
    }

    const { error } = await supabase
      .from(tableName)
      .update({ [field]: value })
      .eq('id', id)

    if (error) {
      console.error('Error inline updating record:', error)
      return { success: false, error: error.message }
    }

    revalidatePath(`/admin/${objectApiName.toLowerCase()}s`)

    return { success: true, error: null }
  } catch (err) {
    console.error('Unexpected error in inlineUpdateRecord:', err)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Apply a filter condition to a Supabase query
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyFilter(query: any, filter: FilterCondition): any {
  const { field, operator, value } = filter

  switch (operator) {
    case 'equals':
      return query.eq(field, value)
    case 'not_equals':
      return query.neq(field, value)
    case 'contains':
      return query.ilike(field, `%${value}%`)
    case 'not_contains':
      return query.not(field, 'ilike', `%${value}%`)
    case 'starts_with':
      return query.ilike(field, `${value}%`)
    case 'ends_with':
      return query.ilike(field, `%${value}`)
    case 'greater_than':
      return query.gt(field, value)
    case 'greater_than_or_equal':
      return query.gte(field, value)
    case 'less_than':
      return query.lt(field, value)
    case 'less_than_or_equal':
      return query.lte(field, value)
    case 'is_null':
      return query.is(field, null)
    case 'is_not_null':
      return query.not(field, 'is', null)
    case 'in':
      return query.in(field, value as string[])
    case 'not_in':
      return query.not(field, 'in', `(${(value as string[]).join(',')})`)
    case 'between':
      if (Array.isArray(value) && value.length === 2) {
        return query.gte(field, value[0]).lte(field, value[1])
      }
      return query
    default:
      return query
  }
}

// =====================================================
// RELATED RECORDS
// =====================================================

/**
 * Get related records for a parent record
 * E.g., Get all Opportunities for a Contact
 */
export async function getRelatedRecords<T = CrmRecord>(
  relatedObjectApiName: string,
  parentField: string,
  parentId: string,
  options: Omit<GetRecordsOptions, 'filters'> = {}
): Promise<GetRecordsResult<T>> {
  const filters: FilterCondition[] = [
    {
      id: 'parent-filter',
      field: parentField,
      operator: 'equals' as FilterOperator,
      value: parentId,
    },
  ]

  return getRecords<T>(relatedObjectApiName, { ...options, filters })
}

/**
 * Get activities for a record (polymorphic relationship)
 */
export async function getRecordActivities(
  relatedToType: string,
  relatedToId: string,
  options: Omit<GetRecordsOptions, 'filters'> = {}
): Promise<GetRecordsResult<CrmActivity>> {
  const filters: FilterCondition[] = [
    {
      id: 'related-type-filter',
      field: 'related_to_type',
      operator: 'equals' as FilterOperator,
      value: relatedToType,
    },
    {
      id: 'related-id-filter',
      field: 'related_to_id',
      operator: 'equals' as FilterOperator,
      value: relatedToId,
    },
  ]

  return getRecords<CrmActivity>('Activity', {
    ...options,
    filters,
    sort: options.sort || { field: 'created_at', direction: 'desc' },
  })
}
