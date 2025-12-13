/**
 * Dynamic Custom Object Detail Page
 *
 * This page handles viewing/editing any custom object record.
 * It uses the object metadata to dynamically render the detail view.
 */

import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

import { getRecordById } from '@/app/actions/crm-records'
import { getObjectMetadata } from '@/app/actions/object-metadata'
import { SecureRecordDetailPage } from '@/components/admin/crm/secure-record-detail-page'
import {
  getRecordSecurityContext,
  serializeSecurityContext,
  deserializeSecurityContext,
} from '@/lib/crm/record-security-context'

interface CustomObjectDetailPageProps {
  params: Promise<{ apiName: string; id: string }>
}

export default async function CustomObjectDetailPage({
  params,
}: CustomObjectDetailPageProps) {
  const { apiName, id } = await params
  const supabase = await createClient()

  // Check auth
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch metadata and record in parallel
  const [metadataResult, recordResult] = await Promise.all([
    getObjectMetadata(apiName),
    getRecordById(apiName, id),
  ])

  if (metadataResult.error || !metadataResult.data) {
    notFound()
  }

  if (recordResult.error || !recordResult.data) {
    notFound()
  }

  const { object: objectDef, fields, page_layout } = metadataResult.data
  const record = recordResult.data

  // Get security context
  const securityContextResult = await getRecordSecurityContext({
    objectApiName: apiName,
    recordId: id,
    ownerId: (record as { owner_id?: string | null }).owner_id ?? null,
  })

  // Serialize and deserialize security context for client component
  const serializedContext = serializeSecurityContext(securityContextResult)
  const securityContext = deserializeSecurityContext(serializedContext)

  // Build record name from name field or first text field
  const nameField = fields.find(f => f.api_name === 'name')
  const recordName = nameField
    ? String((record as Record<string, unknown>)[nameField.api_name] || '')
    : `${objectDef.label} Record`

  return (
    <SecureRecordDetailPage
      objectDefinition={objectDef}
      fields={fields}
      layout={page_layout}
      record={record as { id: string; owner_id?: string | null }}
      backPath={`/admin/objects/${apiName}`}
      recordName={recordName || `Unnamed ${objectDef.label}`}
      securityContext={securityContext}
    />
  )
}
