import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

import { getObjectMetadata } from '@/app/actions/object-metadata'
import { NewRecordPage } from '@/components/admin/crm/new-record-page'

interface PageParams {
  apiName: string
}

export default async function CustomObjectNewPage({
  params,
}: {
  params: Promise<PageParams>
}) {
  const { apiName } = await params
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

  const { object: objectDef, fields, page_layout } = metadataResult.data

  return (
    <NewRecordPage
      objectDefinition={objectDef}
      fields={fields}
      layout={page_layout}
      backPath={`/admin/objects/${apiName}`}
    />
  )
}
