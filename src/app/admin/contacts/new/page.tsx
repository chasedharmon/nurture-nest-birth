import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

import { getObjectMetadata } from '@/app/actions/object-metadata'
import { NewRecordPage } from '@/components/admin/crm/new-record-page'

export default async function NewContactPage() {
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
      <div className="space-y-6">
        <div className="text-center py-12">
          <h2 className="text-lg font-semibold text-foreground">
            Error loading Contact metadata
          </h2>
          <p className="mt-2 text-muted-foreground">{metadataResult.error}</p>
        </div>
      </div>
    )
  }

  const { object: objectDef, fields, page_layout } = metadataResult.data

  return (
    <NewRecordPage
      objectDefinition={objectDef}
      fields={fields}
      layout={page_layout}
      backPath="/admin/contacts"
    />
  )
}
