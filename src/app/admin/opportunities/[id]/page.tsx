import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'

import { getRecordById, getRelatedRecords } from '@/app/actions/crm-records'
import { getObjectMetadata } from '@/app/actions/object-metadata'
import { SecureRecordDetailPage } from '@/components/admin/crm/secure-record-detail-page'
import { RelatedRecordsList } from '@/components/admin/crm/related-records-list'
import {
  getRecordSecurityContext,
  serializeSecurityContext,
  deserializeSecurityContext,
} from '@/lib/crm/record-security-context'
import type { CrmOpportunity, CrmActivity } from '@/lib/crm/types'

// Stage color mapping
const stageColors: Record<string, string> = {
  qualification:
    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  needs_analysis:
    'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  proposal:
    'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  negotiation:
    'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  closed_won:
    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  closed_lost: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
}

export default async function OpportunityDetailPage({
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

  // Fetch Opportunity metadata and record in parallel
  const [metadataResult, recordResult] = await Promise.all([
    getObjectMetadata('Opportunity'),
    getRecordById<CrmOpportunity>('Opportunity', id),
  ])

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

  if (recordResult.error || !recordResult.data) {
    notFound()
  }

  const { object: objectDef, fields, page_layout } = metadataResult.data
  const opportunity = recordResult.data

  // Fetch related activities and security context in parallel
  const [activitiesResult, securityContextResult] = await Promise.all([
    getRelatedRecords<CrmActivity>('Activity', 'related_to_id', id, {
      sort: { field: 'created_at', direction: 'desc' },
      pagination: { page: 1, pageSize: 20 },
    }),
    getRecordSecurityContext({
      objectApiName: 'Opportunity',
      recordId: id,
      ownerId: opportunity.owner_id ?? null,
    }),
  ])

  // Serialize and deserialize security context for client component
  const serializedContext = serializeSecurityContext(securityContextResult)
  const securityContext = deserializeSecurityContext(serializedContext)

  // Build record name with stage badge
  const recordName = opportunity.name || 'Unnamed Opportunity'

  // Quick actions based on stage
  const quickActions = (
    <Badge
      className={stageColors[opportunity.stage] || 'bg-gray-100 text-gray-800'}
    >
      {opportunity.stage
        .replace('_', ' ')
        .replace(/\b\w/g, l => l.toUpperCase())}
    </Badge>
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
          emptyMessage="No activities recorded for this opportunity"
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

  // Add related contact/account tabs if linked
  if (opportunity.primary_contact_id) {
    relatedTabs.unshift({
      id: 'contact',
      label: 'Primary Contact',
      content: (
        <div className="rounded-lg border border-border p-6">
          <p className="text-muted-foreground">
            This opportunity is linked to a contact.
          </p>
          <Link
            href={`/admin/contacts/${opportunity.primary_contact_id}`}
            className="mt-4 inline-block text-primary hover:underline"
          >
            View Contact →
          </Link>
        </div>
      ),
    })
  }

  if (opportunity.account_id) {
    relatedTabs.unshift({
      id: 'account',
      label: 'Account',
      content: (
        <div className="rounded-lg border border-border p-6">
          <p className="text-muted-foreground">
            This opportunity is linked to an account.
          </p>
          <Link
            href={`/admin/accounts/${opportunity.account_id}`}
            className="mt-4 inline-block text-primary hover:underline"
          >
            View Account →
          </Link>
        </div>
      ),
    })
  }

  return (
    <SecureRecordDetailPage
      objectDefinition={objectDef}
      fields={fields}
      layout={page_layout}
      record={opportunity}
      backPath="/admin/opportunities"
      recordName={recordName}
      relatedTabs={relatedTabs}
      quickActions={quickActions}
      securityContext={securityContext}
    />
  )
}
