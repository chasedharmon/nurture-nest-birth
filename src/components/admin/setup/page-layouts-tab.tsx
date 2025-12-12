'use client'

import { useCallback } from 'react'
import { PageLayoutEditor } from './page-layout-editor'
import { upsertDefaultPageLayout } from '@/app/actions/page-layouts'
import type {
  PageLayout,
  PageLayoutConfig,
  FieldDefinition,
  ObjectDefinition,
} from '@/lib/crm/types'

interface PageLayoutsTabProps {
  layout: PageLayout | null
  fields: FieldDefinition[]
  objectDefinition: ObjectDefinition
}

export function PageLayoutsTab({
  layout,
  fields,
  objectDefinition,
}: PageLayoutsTabProps) {
  const handleSave = useCallback(
    async (config: PageLayoutConfig) => {
      const organizationId = objectDefinition.organization_id
      if (!organizationId) {
        throw new Error('Organization ID is required')
      }

      const result = await upsertDefaultPageLayout(
        objectDefinition.id,
        organizationId,
        config
      )

      if (result.error) {
        throw new Error(result.error)
      }
    },
    [objectDefinition.id, objectDefinition.organization_id]
  )

  return (
    <PageLayoutEditor layout={layout} fields={fields} onSave={handleSave} />
  )
}
