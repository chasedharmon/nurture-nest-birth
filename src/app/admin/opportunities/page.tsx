import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Plus, Target } from 'lucide-react'

import { getRecords } from '@/app/actions/crm-records'
import { getObjectMetadata } from '@/app/actions/object-metadata'
import {
  getCrmListViews,
  getCrmListViewById,
} from '@/app/actions/crm-list-views'
import { DynamicListView } from '@/components/admin/crm/dynamic-list-view'
import { PageHeader } from '@/components/admin/navigation'
import type { CrmOpportunity, FilterCondition } from '@/lib/crm/types'

export default async function OpportunitiesListPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string
    page?: string
    sort?: string
    dir?: string
    stage?: string
    view?: string
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

  // Get Opportunity object metadata
  const metadataResult = await getObjectMetadata('Opportunity')
  if (metadataResult.error || !metadataResult.data) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-foreground">
              Error loading Opportunity metadata
            </h2>
            <p className="mt-2 text-muted-foreground">{metadataResult.error}</p>
          </div>
        </div>
      </div>
    )
  }

  const { object: objectDef, fields } = metadataResult.data

  // Get saved views for this object
  const viewsResult = await getCrmListViews('Opportunity')
  const savedViews = viewsResult.data

  // Get current view if specified
  let currentViewFilters: FilterCondition[] = []
  if (params.view) {
    const viewResult = await getCrmListViewById(params.view)
    if (viewResult.success && viewResult.data) {
      currentViewFilters = viewResult.data.filters || []
    }
  }

  // Build filters from search params and view
  const filters: FilterCondition[] = [...currentViewFilters]
  const search = params.q?.trim()

  // Stage filter (from URL params)
  if (params.stage && params.stage !== 'all') {
    filters.push({
      id: 'stage-filter',
      field: 'stage',
      operator: 'equals',
      value: params.stage,
    })
  }

  // Build sort config
  const sort = {
    field: params.sort || 'close_date',
    direction: (params.dir as 'asc' | 'desc') || 'asc',
  }

  // Pagination
  const page = parseInt(params.page || '1')
  const pageSize = 50

  // Searchable fields for Opportunity
  const searchFields = ['name', 'description']

  // Fetch records
  const result = await getRecords<CrmOpportunity>('Opportunity', {
    filters,
    sort,
    pagination: { page, pageSize },
    search,
    searchFields,
  })

  // Fields to display in the list
  const displayFields = [
    'name',
    'stage',
    'amount',
    'close_date',
    'stage_probability',
    'service_type',
    'created_at',
  ]

  // Calculate pipeline metrics
  const openOpportunities = result.data.filter(o => !o.is_closed)
  const totalPipeline = openOpportunities.reduce(
    (sum, o) => sum + (o.amount || 0),
    0
  )

  // Build subtitle with pipeline info
  const pipelineText =
    totalPipeline > 0
      ? ` · Pipeline: ${new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: 0,
        }).format(totalPipeline)}`
      : ''
  const subtitle = `${result.total} ${result.total === 1 ? objectDef.label.toLowerCase() : objectDef.plural_label.toLowerCase()} total${pipelineText}`

  return (
    <div className="space-y-6">
      <PageHeader
        title={objectDef.plural_label}
        subtitle={subtitle}
        icon={<Target className="h-5 w-5 text-primary" />}
        actions={
          <Link href="/admin/opportunities/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New {objectDef.label}
            </Button>
          </Link>
        }
      />

      <DynamicListView
        objectDefinition={objectDef}
        fields={fields}
        data={result.data}
        totalCount={result.total}
        page={page}
        pageSize={pageSize}
        searchFields={searchFields}
        displayFields={displayFields}
        basePath="/admin/opportunities"
        enableBulkActions={true}
        // Enable advanced toolbar with all features
        enableAdvancedToolbar={true}
        currentUserId={user.id}
        savedViews={savedViews}
        currentViewId={params.view || null}
        filters={filters}
      />
    </div>
  )
}
