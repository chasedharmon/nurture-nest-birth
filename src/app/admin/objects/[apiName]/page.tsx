/**
 * Dynamic Custom Object List Page
 *
 * This page handles any custom object that doesn't have a dedicated page.
 * It uses the object metadata to dynamically render the list view.
 */

import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Plus, File } from 'lucide-react'

import { getRecords } from '@/app/actions/crm-records'
import { getObjectMetadata } from '@/app/actions/object-metadata'
import { DynamicListView } from '@/components/admin/crm/dynamic-list-view'
import { PageHeader } from '@/components/admin/navigation'
import type { FilterCondition } from '@/lib/crm/types'

interface CustomObjectPageProps {
  params: Promise<{ apiName: string }>
  searchParams: Promise<{
    q?: string
    page?: string
    sort?: string
    dir?: string
  }>
}

export default async function CustomObjectListPage({
  params,
  searchParams,
}: CustomObjectPageProps) {
  const { apiName } = await params
  const queryParams = await searchParams
  const supabase = await createClient()

  // Check auth
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get object metadata
  const metadataResult = await getObjectMetadata(apiName)
  if (metadataResult.error || !metadataResult.data) {
    notFound()
  }

  const { object: objectDef, fields } = metadataResult.data

  // Build filters from search
  const filters: FilterCondition[] = []
  const search = queryParams.q?.trim()

  // Build sort config
  const sort = {
    field: queryParams.sort || 'created_at',
    direction: (queryParams.dir as 'asc' | 'desc') || 'desc',
  }

  // Pagination
  const page = parseInt(queryParams.page || '1')
  const pageSize = 50

  // Determine searchable fields (name field or first text field)
  const searchFields = fields
    .filter(f => f.data_type === 'text' || f.api_name === 'name')
    .slice(0, 4)
    .map(f => f.api_name)

  // Fetch records
  const result = await getRecords(apiName, {
    filters,
    sort,
    pagination: { page, pageSize },
    search,
    searchFields,
  })

  // Determine display fields (first 6 visible user-facing fields)
  const displayFields = fields
    .filter(
      f =>
        f.is_visible &&
        ![
          'id',
          'created_at',
          'updated_at',
          'owner_id',
          'organization_id',
        ].includes(f.api_name)
    )
    .slice(0, 6)
    .map(f => f.api_name)

  // Add created_at if there's room
  if (displayFields.length < 6) {
    displayFields.push('created_at')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={objectDef.plural_label}
        subtitle={`${result.total} ${result.total === 1 ? objectDef.label.toLowerCase() : objectDef.plural_label.toLowerCase()} total`}
        icon={<File className="h-5 w-5 text-primary" />}
        actions={
          <Link href={`/admin/objects/${apiName}/new`}>
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
        basePath={`/admin/objects/${apiName}`}
        enableBulkActions={true}
      />
    </div>
  )
}
