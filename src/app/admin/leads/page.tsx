import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { ListViewContainer } from '@/components/admin/list-views'
import {
  getListViews,
  getListViewById,
  executeListViewQuery,
  getDefaultColumns,
  getFilterOptions,
} from '@/app/actions/list-views'
import type { Lead, FilterCondition, SortConfig } from '@/lib/supabase/types'
import { Plus } from 'lucide-react'

export default async function AllLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{
    view?: string
    q?: string
    status?: string
    source?: string
    lifecycle_stage?: string
    page?: string
    sort?: string
    dir?: string
  }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  // Check auth
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch list views
  const viewsResult = await getListViews('leads')
  const views = viewsResult.success ? viewsResult.data : []

  // Get current view if specified
  let currentView = null
  if (params.view) {
    const viewResult = await getListViewById(params.view)
    if (viewResult.success && viewResult.data) {
      currentView = viewResult.data
    }
  }

  // Build filters from URL params and current view
  const filters: FilterCondition[] = currentView?.filters || []

  // Add URL-based filters
  if (params.q) {
    filters.push({
      id: 'search-name',
      field: 'name',
      operator: 'contains',
      value: params.q,
    })
  }
  if (params.status && params.status !== 'all') {
    filters.push({
      id: 'filter-status',
      field: 'status',
      operator: 'equals',
      value: params.status,
    })
  }
  if (params.source && params.source !== 'all') {
    filters.push({
      id: 'filter-source',
      field: 'source',
      operator: 'equals',
      value: params.source,
    })
  }
  if (params.lifecycle_stage && params.lifecycle_stage !== 'all') {
    filters.push({
      id: 'filter-lifecycle',
      field: 'lifecycle_stage',
      operator: 'equals',
      value: params.lifecycle_stage,
    })
  }

  // Build sort config
  const sortConfig: SortConfig = {
    field: params.sort || currentView?.sort_config?.field || 'created_at',
    direction:
      (params.dir as 'asc' | 'desc') ||
      currentView?.sort_config?.direction ||
      'desc',
  }

  // Pagination
  const page = parseInt(params.page || '1')
  const pageSize = 50
  const offset = (page - 1) * pageSize

  // Execute query
  const result = await executeListViewQuery(
    'leads',
    filters,
    sortConfig,
    pageSize,
    offset
  )
  const leads = result.success ? (result.data as Lead[]) : []
  const totalCount = result.count || 0

  // Get default columns and filter options
  const defaultColumns = getDefaultColumns('leads')
  const filterOptions = getFilterOptions('leads')

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-serif text-2xl font-bold text-foreground">
                Leads
              </h1>
              <p className="text-sm text-muted-foreground">
                {totalCount} {totalCount === 1 ? 'lead' : 'leads'} total
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/admin/leads/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Lead
                </Button>
              </Link>
              <Link href="/admin">
                <Button variant="outline">Dashboard</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <ListViewContainer
          objectType="leads"
          data={leads}
          totalCount={totalCount}
          views={views}
          currentView={currentView}
          defaultColumns={defaultColumns}
          filterOptions={filterOptions}
          page={page}
          pageSize={pageSize}
        />
      </main>
    </div>
  )
}
