'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type {
  ListView,
  ListViewInsert,
  FilterCondition,
  ObjectType,
  SortConfig,
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
