import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, ArrowRight, UserPlus } from 'lucide-react'

import { getRecords } from '@/app/actions/crm-records'
import { getObjectMetadata } from '@/app/actions/object-metadata'
import { DynamicListView } from '@/components/admin/crm/dynamic-list-view'
import { PageHeader } from '@/components/admin/navigation'
import type { CrmLead, FilterCondition } from '@/lib/crm/types'

export default async function CrmLeadsListPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string
    page?: string
    sort?: string
    dir?: string
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

  // Get Lead object metadata
  const metadataResult = await getObjectMetadata('Lead')
  if (metadataResult.error || !metadataResult.data) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-foreground">
              Error loading Lead metadata
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

  // Status filter
  if (params.status && params.status !== 'all') {
    filters.push({
      id: 'status-filter',
      field: 'lead_status',
      operator: 'equals',
      value: params.status,
    })
  }

  // Build sort config
  const sort = {
    field: params.sort || 'created_at',
    direction: (params.dir as 'asc' | 'desc') || 'desc',
  }

  // Pagination
  const page = parseInt(params.page || '1')
  const pageSize = 50

  // Searchable fields for Lead
  const searchFields = ['first_name', 'last_name', 'email', 'phone']

  // Fetch records
  const result = await getRecords<CrmLead>('Lead', {
    filters,
    sort,
    pagination: { page, pageSize },
    search,
    searchFields,
  })

  // Fields to display in the list
  const displayFields = [
    'first_name',
    'last_name',
    'email',
    'phone',
    'lead_status',
    'lead_source',
    'expected_due_date',
    'created_at',
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={objectDef.plural_label}
        subtitle={`${result.total} ${result.total === 1 ? objectDef.label.toLowerCase() : objectDef.plural_label.toLowerCase()} total`}
        icon={<UserPlus className="h-5 w-5 text-primary" />}
        badge={
          <Badge
            variant="secondary"
            className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
          >
            New CRM
          </Badge>
        }
        actions={
          <>
            <Link href="/admin/crm-leads/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New {objectDef.label}
              </Button>
            </Link>
            <Link href="/admin/leads">
              <Button variant="outline">
                Legacy Leads
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </>
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
        basePath="/admin/crm-leads"
        enableBulkActions={true}
      />
    </div>
  )
}
