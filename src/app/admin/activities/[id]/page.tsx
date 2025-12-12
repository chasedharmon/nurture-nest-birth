import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import {
  Calendar,
  Clock,
  Phone,
  CheckCircle2,
  User,
  Building2,
} from 'lucide-react'

import { getRecordById } from '@/app/actions/crm-records'
import { getObjectMetadata } from '@/app/actions/object-metadata'
import { SecureRecordDetailPage } from '@/components/admin/crm/secure-record-detail-page'
import {
  getRecordSecurityContext,
  serializeSecurityContext,
  deserializeSecurityContext,
} from '@/lib/crm/record-security-context'
import type { CrmActivity } from '@/lib/crm/types'

export default async function ActivityDetailPage({
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

  // Fetch Activity metadata and record in parallel
  const [metadataResult, recordResult] = await Promise.all([
    getObjectMetadata('Activity'),
    getRecordById<CrmActivity>('Activity', id),
  ])

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

  if (recordResult.error || !recordResult.data) {
    notFound()
  }

  const { object: objectDef, fields, page_layout } = metadataResult.data
  const activity = recordResult.data

  // Fetch security context
  const securityContextResult = await getRecordSecurityContext({
    objectApiName: 'Activity',
    recordId: id,
    ownerId: activity.owner_id ?? null,
  })

  // Serialize and deserialize security context for client component
  const serializedContext = serializeSecurityContext(securityContextResult)
  const securityContext = deserializeSecurityContext(serializedContext)

  // Get activity type icon
  const getActivityIcon = () => {
    switch (activity.activity_type) {
      case 'call':
        return <Phone className="h-4 w-4" />
      case 'event':
        return <Calendar className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  // Status badge color
  const getStatusVariant = () => {
    switch (activity.status) {
      case 'completed':
        return 'default'
      case 'cancelled':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  // Quick actions based on status
  const quickActions = (
    <div className="flex items-center gap-2">
      <Badge variant={getStatusVariant()} className="flex items-center gap-1">
        {activity.status === 'completed' && (
          <CheckCircle2 className="h-3 w-3" />
        )}
        {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
      </Badge>
      <Badge variant="outline" className="flex items-center gap-1">
        {getActivityIcon()}
        {activity.activity_type.charAt(0).toUpperCase() +
          activity.activity_type.slice(1)}
      </Badge>
    </div>
  )

  // Build record name
  const recordName = activity.subject || 'Unnamed Activity'

  // Related tabs - show linked records
  const relatedTabs = []

  // Show related to (Contact/Lead/Account/Opportunity)
  if (activity.related_to_id && activity.related_to_type) {
    const relatedType = activity.related_to_type
    const relatedId = activity.related_to_id
    const basePath = getBasePath(relatedType)

    relatedTabs.push({
      id: 'related-to',
      label: `Related ${relatedType}`,
      content: (
        <div className="rounded-lg border border-border bg-muted/50 p-6">
          <div className="flex items-center gap-3">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Related To</p>
              <Link
                href={`${basePath}/${relatedId}`}
                className="text-primary hover:underline"
              >
                View {relatedType} Record
              </Link>
            </div>
          </div>
        </div>
      ),
    })
  }

  // Show who (Contact/Lead)
  if (activity.who_id && activity.who_type) {
    const whoType = activity.who_type
    const whoId = activity.who_id
    const basePath = getBasePath(whoType)

    relatedTabs.push({
      id: 'who',
      label: `${whoType}`,
      content: (
        <div className="rounded-lg border border-border bg-muted/50 p-6">
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Who</p>
              <Link
                href={`${basePath}/${whoId}`}
                className="text-primary hover:underline"
              >
                View {whoType} Record
              </Link>
            </div>
          </div>
        </div>
      ),
    })
  }

  return (
    <SecureRecordDetailPage
      objectDefinition={objectDef}
      fields={fields}
      layout={page_layout}
      record={activity}
      backPath="/admin"
      recordName={recordName}
      relatedTabs={relatedTabs.length > 0 ? relatedTabs : undefined}
      quickActions={quickActions}
      securityContext={securityContext}
    />
  )
}

// Helper to get base path for related record type
function getBasePath(recordType: string): string {
  switch (recordType) {
    case 'Contact':
      return '/admin/contacts'
    case 'Lead':
      return '/admin/crm-leads'
    case 'Account':
      return '/admin/accounts'
    case 'Opportunity':
      return '/admin/opportunities'
    default:
      return '/admin'
  }
}
