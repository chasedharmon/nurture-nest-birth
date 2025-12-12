import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

import { getRecordById, getRelatedRecords } from '@/app/actions/crm-records'
import { getObjectMetadata } from '@/app/actions/object-metadata'
import { RecordDetailPage } from '@/components/admin/crm/record-detail-page'
import { RelatedRecordsList } from '@/components/admin/crm/related-records-list'
import type {
  CrmAccount,
  CrmContact,
  CrmOpportunity,
  CrmActivity,
} from '@/lib/crm/types'

export default async function AccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // Check auth
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch Account metadata and record in parallel
  const [metadataResult, recordResult] = await Promise.all([
    getObjectMetadata('Account'),
    getRecordById<CrmAccount>('Account', id),
  ])

  if (metadataResult.error || !metadataResult.data) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-foreground">
              Error loading Account metadata
            </h2>
            <p className="mt-2 text-muted-foreground">{metadataResult.error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (recordResult.error || !recordResult.data) {
    notFound()
  }

  const { object: objectDef, fields, page_layout } = metadataResult.data
  const account = recordResult.data

  // Fetch related records
  const [contactsResult, opportunitiesResult, activitiesResult] =
    await Promise.all([
      getRelatedRecords<CrmContact>('Contact', 'account_id', id, {
        sort: { field: 'created_at', direction: 'desc' },
        pagination: { page: 1, pageSize: 10 },
      }),
      getRelatedRecords<CrmOpportunity>('Opportunity', 'account_id', id, {
        sort: { field: 'created_at', direction: 'desc' },
        pagination: { page: 1, pageSize: 10 },
      }),
      getRelatedRecords<CrmActivity>('Activity', 'related_to_id', id, {
        sort: { field: 'created_at', direction: 'desc' },
        pagination: { page: 1, pageSize: 20 },
      }),
    ])

  // Build record name
  const recordName = account.name || 'Unnamed Account'

  // Related tabs
  const relatedTabs = [
    {
      id: 'contacts',
      label: `Contacts (${contactsResult.total})`,
      content: (
        <RelatedRecordsList
          title="Contacts"
          objectApiName="Contact"
          records={contactsResult.data}
          totalCount={contactsResult.total}
          emptyMessage="No contacts linked to this account"
          basePath="/admin/contacts"
          displayColumns={[
            { field: 'first_name', label: 'First Name' },
            { field: 'last_name', label: 'Last Name' },
            { field: 'email', label: 'Email' },
            { field: 'phone', label: 'Phone' },
          ]}
        />
      ),
    },
    {
      id: 'opportunities',
      label: `Opportunities (${opportunitiesResult.total})`,
      content: (
        <RelatedRecordsList
          title="Opportunities"
          objectApiName="Opportunity"
          records={opportunitiesResult.data}
          totalCount={opportunitiesResult.total}
          emptyMessage="No opportunities linked to this account"
          basePath="/admin/opportunities"
          displayColumns={[
            { field: 'name', label: 'Name' },
            { field: 'stage', label: 'Stage' },
            { field: 'amount', label: 'Amount', format: 'currency' },
            { field: 'close_date', label: 'Close Date', format: 'date' },
          ]}
        />
      ),
    },
    {
      id: 'activities',
      label: `Activities (${activitiesResult.total})`,
      content: (
        <RelatedRecordsList
          title="Activities"
          objectApiName="Activity"
          records={activitiesResult.data}
          totalCount={activitiesResult.total}
          emptyMessage="No activities recorded for this account"
          basePath="/admin/activities"
          displayColumns={[
            { field: 'subject', label: 'Subject' },
            { field: 'activity_type', label: 'Type' },
            { field: 'status', label: 'Status' },
            { field: 'due_date', label: 'Due Date', format: 'date' },
          ]}
        />
      ),
    },
  ]

  return (
    <RecordDetailPage
      objectDefinition={objectDef}
      fields={fields}
      layout={page_layout}
      record={account}
      backPath="/admin/accounts"
      recordName={recordName}
      relatedTabs={relatedTabs}
    />
  )
}
