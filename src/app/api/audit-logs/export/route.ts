import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse query params
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search')
    const action = searchParams.get('action')
    const entityType = searchParams.get('entityType')
    const userId = searchParams.get('userId')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    // Build query with a reasonable limit
    let query = supabase
      .from('audit_logs')
      .select(
        `
        id,
        action,
        entity_type,
        entity_id,
        old_values,
        new_values,
        ip_address,
        user_agent,
        created_at,
        user:users!audit_logs_user_id_fkey(id, email, full_name)
      `
      )
      .order('created_at', { ascending: false })
      .limit(10000) // Cap at 10k for export

    // Apply filters
    if (search) {
      query = query.or(`action.ilike.%${search}%,entity_type.ilike.%${search}%`)
    }

    if (action) {
      query = query.eq('action', action)
    }

    if (entityType) {
      query = query.eq('entity_type', entityType)
    }

    if (userId) {
      query = query.eq('user_id', userId)
    }

    if (dateFrom) {
      query = query.gte('created_at', dateFrom)
    }

    if (dateTo) {
      const endDate = new Date(dateTo)
      endDate.setDate(endDate.getDate() + 1)
      query = query.lt('created_at', endDate.toISOString())
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching audit logs for export:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Transform for export
    const logs = (data ?? []).map(log => {
      // Get changes summary
      let changesSummary = ''
      if (log.action === 'create' && log.new_values) {
        changesSummary = `Created new ${log.entity_type}`
      } else if (log.action === 'delete') {
        changesSummary = `Deleted ${log.entity_type}`
      } else if (log.action === 'update' && log.old_values && log.new_values) {
        const oldVals = log.old_values as Record<string, unknown>
        const newVals = log.new_values as Record<string, unknown>
        const changedFields = Object.keys(newVals).filter(
          key => oldVals[key] !== newVals[key]
        )
        if (changedFields.length === 1) {
          changesSummary = `Updated ${changedFields[0]}`
        } else {
          changesSummary = `Updated ${changedFields.length} fields: ${changedFields.join(', ')}`
        }
      } else {
        changesSummary = log.action
      }

      // Handle the joined user data - it could be an object or null
      const userData = (Array.isArray(log.user) ? log.user[0] : log.user) as {
        email: string
        full_name: string | null
      } | null

      return {
        timestamp: log.created_at,
        user_name: userData?.full_name || 'Unknown',
        user_email: userData?.email || 'N/A',
        action: log.action,
        entity_type: log.entity_type,
        entity_id: log.entity_id,
        changes_summary: changesSummary,
        ip_address: log.ip_address,
        user_agent: log.user_agent,
      }
    })

    return NextResponse.json({ logs })
  } catch (error) {
    console.error('Error in audit logs export:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
