'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type {
  ListView,
  ListViewInsert,
  FilterCondition,
  ObjectType,
  SortConfig,
  ColumnConfig,
} from '@/lib/supabase/types'

// ============================================================================
// LIST VIEW CRUD OPERATIONS
// ============================================================================

export async function getListViews(objectType: ObjectType) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Not authenticated', data: [] }

  const { data, error } = await supabase
    .from('list_views')
    .select('*')
    .eq('object_type', objectType)
    .or(`created_by.eq.${user.id},visibility.in.(shared,org)`)
    .order('is_pinned', { ascending: false })
    .order('name')

  if (error) return { success: false, error: error.message, data: [] }
  return { success: true, data: data as ListView[] }
}

export async function getListViewById(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('list_views')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return { success: false, error: error.message, data: null }
  return { success: true, data: data as ListView }
}

export async function createListView(view: Omit<ListViewInsert, 'created_by'>) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Not authenticated', data: null }

  const { data, error } = await supabase
    .from('list_views')
    .insert({ ...view, created_by: user.id })
    .select()
    .single()

  if (error) return { success: false, error: error.message, data: null }

  revalidatePath('/admin')
  return { success: true, data: data as ListView }
}

export async function updateListView(id: string, updates: Partial<ListView>) {
  const supabase = await createClient()

  // Remove id from updates if present
  const { id: _, created_by: __, ...safeUpdates } = updates as ListView

  const { data, error } = await supabase
    .from('list_views')
    .update(safeUpdates)
    .eq('id', id)
    .select()
    .single()

  if (error) return { success: false, error: error.message, data: null }

  revalidatePath('/admin')
  return { success: true, data: data as ListView }
}

export async function deleteListView(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('list_views').delete().eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin')
  return { success: true }
}

export async function pinListView(id: string, isPinned: boolean) {
  return updateListView(id, { is_pinned: isPinned })
}

export async function setDefaultView(id: string, objectType: ObjectType) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Not authenticated' }

  // First, unset any existing default for this object type
  await supabase
    .from('list_views')
    .update({ is_default: false })
    .eq('object_type', objectType)
    .eq('created_by', user.id)

  // Then set the new default
  const { error } = await supabase
    .from('list_views')
    .update({ is_default: true })
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin')
  return { success: true }
}

// ============================================================================
// DYNAMIC QUERY EXECUTION
// ============================================================================

const tableMap: Record<ObjectType, string> = {
  leads: 'leads',
  clients: 'leads',
  invoices: 'invoices',
  meetings: 'meetings',
  team_members: 'team_members',
  payments: 'payments',
  services: 'client_services',
}

export async function executeListViewQuery(
  objectType: ObjectType,
  filters: FilterCondition[],
  sortConfig?: SortConfig,
  limit: number = 50,
  offset: number = 0
) {
  const supabase = await createClient()
  const tableName = tableMap[objectType]

  let query = supabase.from(tableName).select('*', { count: 'exact' })

  // For clients, automatically filter to status='client'
  if (objectType === 'clients') {
    query = query.eq('status', 'client')
  }

  // Apply each filter
  for (const filter of filters) {
    query = applyFilter(query, filter)
  }

  // Apply sorting
  if (sortConfig?.field) {
    query = query.order(sortConfig.field, {
      ascending: sortConfig.direction === 'asc',
    })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  // Apply pagination
  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) return { success: false, error: error.message, data: [], count: 0 }
  return { success: true, data, count: count || 0 }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyFilter(query: any, filter: FilterCondition) {
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
    case 'less_than':
      return query.lt(field, value)
    case 'greater_or_equal':
      return query.gte(field, value)
    case 'less_or_equal':
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
    case 'this_week': {
      const now = new Date()
      const startOfWeek = new Date(now)
      startOfWeek.setDate(now.getDate() - now.getDay())
      startOfWeek.setHours(0, 0, 0, 0)
      return query.gte(field, startOfWeek.toISOString())
    }
    case 'this_month': {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      return query.gte(field, startOfMonth.toISOString())
    }
    case 'this_quarter': {
      const now = new Date()
      const quarter = Math.floor(now.getMonth() / 3)
      const startOfQuarter = new Date(now.getFullYear(), quarter * 3, 1)
      return query.gte(field, startOfQuarter.toISOString())
    }
    case 'last_n_days': {
      const days =
        typeof value === 'number' ? value : parseInt(value as string, 10)
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - days)
      return query.gte(field, pastDate.toISOString())
    }
    default:
      return query
  }
}

// ============================================================================
// BULK OPERATIONS
// ============================================================================

export async function bulkUpdateStatus(
  objectType: ObjectType,
  ids: string[],
  status: string
) {
  const supabase = await createClient()
  const tableName = tableMap[objectType]

  const { error } = await supabase
    .from(tableName)
    .update({ status })
    .in('id', ids)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin')
  return { success: true }
}

export async function bulkDelete(objectType: ObjectType, ids: string[]) {
  const supabase = await createClient()
  const tableName = tableMap[objectType]

  const { error } = await supabase.from(tableName).delete().in('id', ids)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin')
  return { success: true }
}

// ============================================================================
// INLINE EDITING
// ============================================================================

export async function inlineUpdate(
  objectType: ObjectType,
  id: string,
  field: string,
  value: unknown
) {
  const supabase = await createClient()
  const tableName = tableMap[objectType]

  const { error } = await supabase
    .from(tableName)
    .update({ [field]: value })
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin')
  return { success: true }
}

// ============================================================================
// DEFAULT COLUMN CONFIGURATIONS
// ============================================================================

export function getDefaultColumns(objectType: ObjectType): ColumnConfig[] {
  switch (objectType) {
    case 'leads':
    case 'clients':
      return [
        {
          field: 'name',
          label: 'Name',
          visible: true,
          sortable: true,
          filterable: true,
        },
        {
          field: 'email',
          label: 'Email',
          visible: true,
          sortable: true,
          filterable: true,
        },
        {
          field: 'phone',
          label: 'Phone',
          visible: true,
          sortable: false,
          filterable: false,
        },
        {
          field: 'status',
          label: 'Status',
          visible: true,
          sortable: true,
          filterable: true,
          format: 'badge',
        },
        {
          field: 'source',
          label: 'Source',
          visible: true,
          sortable: true,
          filterable: true,
          format: 'badge',
        },
        {
          field: 'expected_due_date',
          label: 'Due Date',
          visible: true,
          sortable: true,
          filterable: true,
          format: 'date',
        },
        {
          field: 'created_at',
          label: 'Created',
          visible: true,
          sortable: true,
          filterable: true,
          format: 'date',
        },
        {
          field: 'lifecycle_stage',
          label: 'Stage',
          visible: false,
          sortable: true,
          filterable: true,
          format: 'badge',
        },
        {
          field: 'client_type',
          label: 'Client Type',
          visible: false,
          sortable: true,
          filterable: true,
          format: 'badge',
        },
        {
          field: 'partner_name',
          label: 'Partner',
          visible: false,
          sortable: false,
          filterable: false,
        },
      ]
    case 'invoices':
      return [
        {
          field: 'invoice_number',
          label: 'Invoice #',
          visible: true,
          sortable: true,
          filterable: true,
        },
        {
          field: 'client_id',
          label: 'Client',
          visible: true,
          sortable: false,
          filterable: false,
        },
        {
          field: 'status',
          label: 'Status',
          visible: true,
          sortable: true,
          filterable: true,
          format: 'badge',
        },
        {
          field: 'total',
          label: 'Total',
          visible: true,
          sortable: true,
          filterable: true,
          format: 'currency',
        },
        {
          field: 'balance_due',
          label: 'Balance',
          visible: true,
          sortable: true,
          filterable: true,
          format: 'currency',
        },
        {
          field: 'issue_date',
          label: 'Issue Date',
          visible: true,
          sortable: true,
          filterable: true,
          format: 'date',
        },
        {
          field: 'due_date',
          label: 'Due Date',
          visible: true,
          sortable: true,
          filterable: true,
          format: 'date',
        },
      ]
    case 'meetings':
      return [
        {
          field: 'title',
          label: 'Title',
          visible: true,
          sortable: true,
          filterable: true,
        },
        {
          field: 'meeting_type',
          label: 'Type',
          visible: true,
          sortable: true,
          filterable: true,
          format: 'badge',
        },
        {
          field: 'scheduled_at',
          label: 'Scheduled',
          visible: true,
          sortable: true,
          filterable: true,
          format: 'datetime',
        },
        {
          field: 'status',
          label: 'Status',
          visible: true,
          sortable: true,
          filterable: true,
          format: 'badge',
        },
        {
          field: 'location',
          label: 'Location',
          visible: true,
          sortable: false,
          filterable: false,
        },
        {
          field: 'duration_minutes',
          label: 'Duration',
          visible: true,
          sortable: true,
          filterable: false,
        },
      ]
    case 'team_members':
      return [
        {
          field: 'display_name',
          label: 'Name',
          visible: true,
          sortable: true,
          filterable: true,
        },
        {
          field: 'email',
          label: 'Email',
          visible: true,
          sortable: true,
          filterable: true,
        },
        {
          field: 'role',
          label: 'Role',
          visible: true,
          sortable: true,
          filterable: true,
          format: 'badge',
        },
        {
          field: 'is_active',
          label: 'Active',
          visible: true,
          sortable: true,
          filterable: true,
          format: 'boolean',
        },
        {
          field: 'is_accepting_clients',
          label: 'Accepting',
          visible: true,
          sortable: true,
          filterable: true,
          format: 'boolean',
        },
      ]
    case 'payments':
      return [
        {
          field: 'amount',
          label: 'Amount',
          visible: true,
          sortable: true,
          filterable: true,
          format: 'currency',
        },
        {
          field: 'payment_method',
          label: 'Method',
          visible: true,
          sortable: true,
          filterable: true,
          format: 'badge',
        },
        {
          field: 'status',
          label: 'Status',
          visible: true,
          sortable: true,
          filterable: true,
          format: 'badge',
        },
        {
          field: 'payment_date',
          label: 'Date',
          visible: true,
          sortable: true,
          filterable: true,
          format: 'date',
        },
      ]
    case 'services':
      return [
        {
          field: 'package_name',
          label: 'Package',
          visible: true,
          sortable: true,
          filterable: true,
        },
        {
          field: 'service_type',
          label: 'Type',
          visible: true,
          sortable: true,
          filterable: true,
          format: 'badge',
        },
        {
          field: 'status',
          label: 'Status',
          visible: true,
          sortable: true,
          filterable: true,
          format: 'badge',
        },
        {
          field: 'total_amount',
          label: 'Amount',
          visible: true,
          sortable: true,
          filterable: true,
          format: 'currency',
        },
        {
          field: 'start_date',
          label: 'Start',
          visible: true,
          sortable: true,
          filterable: true,
          format: 'date',
        },
        {
          field: 'contract_signed',
          label: 'Contract',
          visible: true,
          sortable: true,
          filterable: true,
          format: 'boolean',
        },
      ]
    default:
      return []
  }
}

// ============================================================================
// FILTER OPTIONS FOR QUICK FILTERS
// ============================================================================

export function getFilterOptions(
  objectType: ObjectType
): Record<string, { value: string; label: string }[]> {
  switch (objectType) {
    case 'leads':
    case 'clients':
      return {
        status: [
          { value: 'new', label: 'New' },
          { value: 'contacted', label: 'Contacted' },
          { value: 'scheduled', label: 'Scheduled' },
          { value: 'client', label: 'Client' },
          { value: 'lost', label: 'Lost' },
        ],
        source: [
          { value: 'contact_form', label: 'Contact Form' },
          { value: 'newsletter', label: 'Newsletter' },
          { value: 'manual', label: 'Manual' },
        ],
        lifecycle_stage: [
          { value: 'lead', label: 'Lead' },
          { value: 'consultation_scheduled', label: 'Consultation Scheduled' },
          { value: 'active_client', label: 'Active Client' },
          { value: 'past_client', label: 'Past Client' },
          { value: 'inactive', label: 'Inactive' },
        ],
      }
    case 'invoices':
      return {
        status: [
          { value: 'draft', label: 'Draft' },
          { value: 'sent', label: 'Sent' },
          { value: 'paid', label: 'Paid' },
          { value: 'partial', label: 'Partial' },
          { value: 'overdue', label: 'Overdue' },
          { value: 'cancelled', label: 'Cancelled' },
        ],
      }
    case 'meetings':
      return {
        status: [
          { value: 'scheduled', label: 'Scheduled' },
          { value: 'completed', label: 'Completed' },
          { value: 'cancelled', label: 'Cancelled' },
          { value: 'no_show', label: 'No Show' },
        ],
        meeting_type: [
          { value: 'consultation', label: 'Consultation' },
          { value: 'prenatal', label: 'Prenatal' },
          { value: 'birth', label: 'Birth' },
          { value: 'postpartum', label: 'Postpartum' },
          { value: 'follow_up', label: 'Follow Up' },
        ],
      }
    default:
      return {}
  }
}
