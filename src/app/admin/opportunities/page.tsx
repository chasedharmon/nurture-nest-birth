import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

import { getRecords } from '@/app/actions/crm-records'
import { getObjectMetadata } from '@/app/actions/object-metadata'
import { DynamicListView } from '@/components/admin/crm/dynamic-list-view'
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

  // Build filters from search params
  const filters: FilterCondition[] = []
  const search = params.q?.trim()

  // Stage filter
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-serif text-2xl font-bold text-foreground">
                {objectDef.plural_label}
              </h1>
              <p className="text-sm text-muted-foreground">
                {result.total}{' '}
                {result.total === 1
                  ? objectDef.label.toLowerCase()
                  : objectDef.plural_label.toLowerCase()}{' '}
                total
                {totalPipeline > 0 && (
                  <span className="ml-2">
                    &middot; Pipeline:{' '}
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                      maximumFractionDigits: 0,
                    }).format(totalPipeline)}
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/admin/opportunities/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New {objectDef.label}
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
        />
      </main>
    </div>
  )
}
