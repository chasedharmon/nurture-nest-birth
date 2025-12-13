import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Plus, Activity } from 'lucide-react'

import { getRecords } from '@/app/actions/crm-records'
import { getObjectMetadata } from '@/app/actions/object-metadata'
import { DynamicListView } from '@/components/admin/crm/dynamic-list-view'
import { PageHeader } from '@/components/admin/navigation'
import type { CrmActivity, FilterCondition } from '@/lib/crm/types'

export default async function ActivitiesListPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string
    page?: string
    sort?: string
    dir?: string
    type?: string
    status?: string
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

  // Get Activity object metadata
  const metadataResult = await getObjectMetadata('Activity')
  if (metadataResult.error || !metadataResult.data) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-foreground">
              Error loading Activity metadata
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

  // Activity type filter
  if (params.type && params.type !== 'all') {
    filters.push({
      id: 'type-filter',
      field: 'activity_type',
      operator: 'equals',
      value: params.type,
    })
  }

  // Status filter
  if (params.status && params.status !== 'all') {
    filters.push({
      id: 'status-filter',
      field: 'status',
      operator: 'equals',
      value: params.status,
    })
  }

  // Build sort config
  const sort = {
    field: params.sort || 'due_date',
    direction: (params.dir as 'asc' | 'desc') || 'asc',
  }

  // Pagination
  const page = parseInt(params.page || '1')
  const pageSize = 50

  // Searchable fields for Activity
  const searchFields = ['subject', 'description']

  // Fetch records
  const result = await getRecords<CrmActivity>('Activity', {
    filters,
    sort,
    pagination: { page, pageSize },
    search,
    searchFields,
  })

  // Fields to display in the list
  const displayFields = [
    'subject',
    'activity_type',
    'status',
    'priority',
    'due_date',
    'assigned_to',
    'created_at',
  ]

  // Calculate metrics
  const openActivities = result.data.filter(a => a.status === 'open')
  const overdueActivities = result.data.filter(a => {
    if (a.status !== 'open' || !a.due_date) return false
    return new Date(a.due_date) < new Date()
  })

  // Build subtitle with activity info
  const overdueText =
    overdueActivities.length > 0 ? ` · ${overdueActivities.length} overdue` : ''
  const openText =
    openActivities.length > 0 ? ` · ${openActivities.length} open` : ''
  const subtitle = `${result.total} ${result.total === 1 ? objectDef.label.toLowerCase() : objectDef.plural_label.toLowerCase()} total${openText}${overdueText}`

  return (
    <div className="space-y-6">
      <PageHeader
        title={objectDef.plural_label}
        subtitle={subtitle}
        icon={<Activity className="h-5 w-5 text-primary" />}
        actions={
          <Link href="/admin/activities/new">
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
        basePath="/admin/activities"
        enableBulkActions={true}
      />
    </div>
  )
}
