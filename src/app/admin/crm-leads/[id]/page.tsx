import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { UserPlus, CheckCircle2 } from 'lucide-react'

import { getRecordById, getRelatedRecords } from '@/app/actions/crm-records'
import { getObjectMetadata } from '@/app/actions/object-metadata'
import { RecordDetailPage } from '@/components/admin/crm/record-detail-page'
import { RelatedRecordsList } from '@/components/admin/crm/related-records-list'
import type { CrmLead, CrmActivity } from '@/lib/crm/types'

export default async function CrmLeadDetailPage({
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

  // Fetch Lead metadata and record in parallel
  const [metadataResult, recordResult] = await Promise.all([
    getObjectMetadata('Lead'),
    getRecordById<CrmLead>('Lead', id),
  ])

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

  if (recordResult.error || !recordResult.data) {
    notFound()
  }

  const { object: objectDef, fields, page_layout } = metadataResult.data
  const lead = recordResult.data

  // Fetch related activities
  const activitiesResult = await getRelatedRecords<CrmActivity>(
    'Activity',
    'who_id',
    id,
    {
      sort: { field: 'created_at', direction: 'desc' },
      pagination: { page: 1, pageSize: 20 },
    }
  )

  // Build record name
  const recordName =
    `${lead.first_name} ${lead.last_name}`.trim() || 'Unnamed Lead'

  // Quick actions for leads
  const quickActions = lead.is_converted ? (
    <Badge
      variant="outline"
      className="border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
    >
      <CheckCircle2 className="mr-1 h-3 w-3" />
      Converted
    </Badge>
  ) : (
    <Link href={`/admin/crm-leads/${id}/convert`}>
      <Button variant="default">
        <UserPlus className="mr-2 h-4 w-4" />
        Convert Lead
      </Button>
    </Link>
  )

  // Related tabs
  const relatedTabs = [
    {
      id: 'activities',
      label: `Activities (${activitiesResult.total})`,
      content: (
        <RelatedRecordsList
          title="Activities"
          objectApiName="Activity"
          records={activitiesResult.data}
          totalCount={activitiesResult.total}
          emptyMessage="No activities recorded for this lead"
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

  // Show conversion info if converted
  if (lead.is_converted) {
    relatedTabs.unshift({
      id: 'conversion',
      label: 'Conversion',
      content: (
        <div className="rounded-lg border border-border bg-green-50 p-6 dark:bg-green-900/10">
          <h3 className="font-medium text-green-800 dark:text-green-300">
            This lead has been converted
          </h3>
          <p className="mt-2 text-sm text-green-700 dark:text-green-400">
            Converted on{' '}
            {lead.converted_at
              ? new Date(lead.converted_at).toLocaleDateString()
              : 'Unknown'}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {lead.converted_contact_id && (
              <Link href={`/admin/contacts/${lead.converted_contact_id}`}>
                <Button variant="outline" size="sm">
                  View Contact
                </Button>
              </Link>
            )}
            {lead.converted_account_id && (
              <Link href={`/admin/accounts/${lead.converted_account_id}`}>
                <Button variant="outline" size="sm">
                  View Account
                </Button>
              </Link>
            )}
            {lead.converted_opportunity_id && (
              <Link
                href={`/admin/opportunities/${lead.converted_opportunity_id}`}
              >
                <Button variant="outline" size="sm">
                  View Opportunity
                </Button>
              </Link>
            )}
          </div>
        </div>
      ),
    })
  }

  return (
    <RecordDetailPage
      objectDefinition={objectDef}
      fields={fields}
      layout={page_layout}
      record={lead}
      backPath="/admin/crm-leads"
      recordName={recordName}
      relatedTabs={relatedTabs}
      quickActions={quickActions}
    />
  )
}
