import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

import { getRecordById, getRelatedRecords } from '@/app/actions/crm-records'
import { getObjectMetadata } from '@/app/actions/object-metadata'
import { SecureRecordDetailPage } from '@/components/admin/crm/secure-record-detail-page'
import { RelatedRecordsList } from '@/components/admin/crm/related-records-list'
import {
  getRecordSecurityContext,
  serializeSecurityContext,
  deserializeSecurityContext,
} from '@/lib/crm/record-security-context'
import type { CrmContact, CrmOpportunity, CrmActivity } from '@/lib/crm/types'

export default async function ContactDetailPage({
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

  // Fetch Contact metadata and record in parallel
  const [metadataResult, recordResult] = await Promise.all([
    getObjectMetadata('Contact'),
    getRecordById<CrmContact>('Contact', id),
  ])

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

  if (recordResult.error || !recordResult.data) {
    notFound()
  }

  const { object: objectDef, fields, page_layout } = metadataResult.data
  const contact = recordResult.data

  // Fetch related records and security context in parallel
  const [opportunitiesResult, activitiesResult, securityContextResult] =
    await Promise.all([
      getRelatedRecords<CrmOpportunity>(
        'Opportunity',
        'primary_contact_id',
        id,
        {
          sort: { field: 'created_at', direction: 'desc' },
          pagination: { page: 1, pageSize: 10 },
        }
      ),
      getRelatedRecords<CrmActivity>('Activity', 'who_id', id, {
        sort: { field: 'created_at', direction: 'desc' },
        pagination: { page: 1, pageSize: 20 },
      }),
      getRecordSecurityContext({
        objectApiName: 'Contact',
        recordId: id,
        ownerId: contact.owner_id ?? null,
      }),
    ])

  // Serialize and deserialize security context for client component
  const serializedContext = serializeSecurityContext(securityContextResult)
  const securityContext = deserializeSecurityContext(serializedContext)

  // Build record name
  const recordName =
    `${contact.first_name} ${contact.last_name}`.trim() || 'Unnamed Contact'

  // Related tabs
  const relatedTabs = [
    {
      id: 'opportunities',
      label: `Opportunities (${opportunitiesResult.total})`,
      content: (
        <RelatedRecordsList
          title="Opportunities"
          objectApiName="Opportunity"
          records={opportunitiesResult.data}
          totalCount={opportunitiesResult.total}
          emptyMessage="No opportunities linked to this contact"
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
          emptyMessage="No activities recorded for this contact"
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
    <SecureRecordDetailPage
      objectDefinition={objectDef}
      fields={fields}
      layout={page_layout}
      record={contact}
      backPath="/admin/contacts"
      recordName={recordName}
      relatedTabs={relatedTabs}
      securityContext={securityContext}
    />
  )
}
