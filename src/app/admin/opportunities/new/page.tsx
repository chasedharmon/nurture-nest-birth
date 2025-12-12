import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

import { getObjectMetadata } from '@/app/actions/object-metadata'
import { NewRecordPage } from '@/components/admin/crm/new-record-page'

export default async function NewOpportunityPage({
  searchParams,
}: {
  searchParams: Promise<{
    contact_id?: string
    account_id?: string
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

  const { object: objectDef, fields, page_layout } = metadataResult.data

  // Default values for new opportunities
  // Can be pre-populated from URL params (e.g., when creating from a contact)
  const defaultValues: Record<string, unknown> = {
    stage: 'qualification',
    stage_probability: 10,
    is_closed: false,
    is_won: false,
  }

  // Pre-populate contact/account from URL params
  if (params.contact_id) {
    defaultValues.primary_contact_id = params.contact_id
  }
  if (params.account_id) {
    defaultValues.account_id = params.account_id
  }

  return (
    <NewRecordPage
      objectDefinition={objectDef}
      fields={fields}
      layout={page_layout}
      backPath="/admin/opportunities"
      defaultValues={defaultValues}
    />
  )
}
