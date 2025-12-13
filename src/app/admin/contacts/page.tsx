import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Plus, Users } from 'lucide-react'

import { getRecords } from '@/app/actions/crm-records'
import { getObjectMetadata } from '@/app/actions/object-metadata'
import { DynamicListView } from '@/components/admin/crm/dynamic-list-view'
import { PageHeader } from '@/components/admin/navigation'
import type { CrmContact, FilterCondition } from '@/lib/crm/types'

export default async function ContactsListPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string
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

  // Get Contact object metadata
  const metadataResult = await getObjectMetadata('Contact')
  if (metadataResult.error || !metadataResult.data) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-foreground">
              Error loading Contact metadata
            </h2>
            <p className="mt-2 text-muted-foreground">{metadataResult.error}</p>
          </div>
        </div>
      </div>
    )
  }

  const { object: objectDef, fields } = metadataResult.data

  // Build filters from search
  const filters: FilterCondition[] = []
  const search = params.q?.trim()

  // Build sort config
  const sort = {
    field: params.sort || 'created_at',
    direction: (params.dir as 'asc' | 'desc') || 'desc',
  }

  // Pagination
  const page = parseInt(params.page || '1')
  const pageSize = 50

  // Searchable fields for Contact
  const searchFields = ['first_name', 'last_name', 'email', 'phone']

  // Fetch records
  const result = await getRecords<CrmContact>('Contact', {
    filters,
    sort,
    pagination: { page, pageSize },
    search,
    searchFields,
  })

  // Fields to display in the list (key fields for quick scanning)
  const displayFields = [
    'first_name',
    'last_name',
    'email',
    'phone',
    'expected_due_date',
    'lead_source',
    'created_at',
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={objectDef.plural_label}
        subtitle={`${result.total} ${result.total === 1 ? objectDef.label.toLowerCase() : objectDef.plural_label.toLowerCase()} total`}
        icon={<Users className="h-5 w-5 text-primary" />}
        actions={
          <Link href="/admin/contacts/new">
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
        basePath="/admin/contacts"
        enableBulkActions={true}
      />
    </div>
  )
}
