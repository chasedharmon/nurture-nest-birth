/**
 * External API v1 - Leads endpoint
 *
 * Authenticated via API keys with rate limiting.
 * Supports list, create, and manage leads.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import {
  withApiKeyAuth,
  hasPermission,
  createForbiddenResponse,
  type ApiKeyInfo,
} from '@/lib/api-auth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/v1/leads - List leads
 */
export async function GET(request: NextRequest) {
  return withApiKeyAuth(
    request,
    async (apiKey: ApiKeyInfo) => {
      // Check read permission
      if (!hasPermission(apiKey, 'leads', 'read')) {
        return createForbiddenResponse('leads', 'read')
      }

      const supabase = createAdminClient()
      const searchParams = request.nextUrl.searchParams

      // Parse query parameters
      const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
      const offset = parseInt(searchParams.get('offset') || '0')
      const status = searchParams.get('status')
      const search = searchParams.get('search')

      // Build query
      let query = supabase
        .from('leads')
        .select('*', { count: 'exact' })
        .eq('organization_id', apiKey.organizationId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (status) {
        query = query.eq('status', status)
      }

      if (search) {
        query = query.or(
          `name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`
        )
      }

      const { data, count, error } = await query

      if (error) {
        return NextResponse.json(
          { error: 'Failed to fetch leads', details: error.message },
          { status: 500 }
        )
      }

      return NextResponse.json({
        data,
        pagination: {
          total: count || 0,
          limit,
          offset,
          hasMore: (count || 0) > offset + limit,
        },
      })
    },
    { requiredPermission: { resource: 'leads', action: 'read' } }
  )
}

/**
 * POST /api/v1/leads - Create a new lead
 */
export async function POST(request: NextRequest) {
  return withApiKeyAuth(
    request,
    async (apiKey: ApiKeyInfo) => {
      // Check create permission
      if (!hasPermission(apiKey, 'leads', 'create')) {
        return createForbiddenResponse('leads', 'create')
      }

      const supabase = createAdminClient()
      let body: Record<string, unknown>

      try {
        body = await request.json()
      } catch {
        return NextResponse.json(
          { error: 'Invalid JSON body' },
          { status: 400 }
        )
      }

      // Validate required fields
      if (!body.name || typeof body.name !== 'string') {
        return NextResponse.json({ error: 'Name is required' }, { status: 400 })
      }

      // Create lead
      const { data, error } = await supabase
        .from('leads')
        .insert({
          organization_id: apiKey.organizationId,
          name: body.name,
          email: body.email || null,
          phone: body.phone || null,
          status: body.status || 'new',
          source: body.source || 'api',
          due_date: body.due_date || null,
          notes: body.notes || null,
          metadata: body.metadata || {},
        })
        .select()
        .single()

      if (error) {
        return NextResponse.json(
          { error: 'Failed to create lead', details: error.message },
          { status: 500 }
        )
      }

      return NextResponse.json({ data }, { status: 201 })
    },
    { requiredPermission: { resource: 'leads', action: 'create' } }
  )
}
