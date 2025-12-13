'use client'

/**
 * NewRecordPage - A reusable component for creating new CRM records
 *
 * This component provides a standard layout for creating new records
 * using the DynamicRecordForm component.
 */

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { DynamicRecordForm } from './dynamic-record-form'
import type {
  ObjectDefinition,
  FieldWithPicklistValues,
  PageLayout,
} from '@/lib/crm/types'
import { createRecord } from '@/app/actions/crm-records'
import { searchLookupRecords } from '@/app/actions/object-metadata'
import type { LookupSearchProps, LookupRecord } from './fields'

// =====================================================
// TYPES
// =====================================================

export interface NewRecordPageProps {
  /** Object definition metadata */
  objectDefinition: ObjectDefinition
  /** Field definitions */
  fields: FieldWithPicklistValues[]
  /** Page layout for the form */
  layout: PageLayout | null
  /** Back navigation path */
  backPath: string
  /** Default values for fields */
  defaultValues?: Record<string, unknown>
  /** Callback after successful creation */
  onSuccess?: (recordId: string) => void
}

// =====================================================
// MAIN COMPONENT
// =====================================================

export function NewRecordPage({
  objectDefinition,
  fields,
  layout,
  backPath,
  defaultValues = {},
  onSuccess,
}: NewRecordPageProps) {
  const router = useRouter()

  // Handle form submission
  // Note: DynamicRecordForm manages its own isSubmitting state internally,
  // so we don't need to track it here. The form handles showing the loading
  // state on the submit button without unmounting the form.
  const handleSubmit = useCallback(
    async (data: Record<string, unknown>) => {
      const result = await createRecord(objectDefinition.api_name, data)
      if (result.error) {
        throw new Error(result.error)
      }

      const newId = (result.data as { id: string })?.id
      if (onSuccess) {
        onSuccess(newId)
      } else {
        // Navigate to the new record
        router.push(`${backPath}/${newId}`)
      }
    },
    [objectDefinition.api_name, backPath, onSuccess, router]
  )

  // Handle cancel
  const handleCancel = useCallback(() => {
    router.push(backPath)
  }, [backPath, router])

  // Lookup search handler
  const handleLookupSearch = useCallback(
    async (props: LookupSearchProps): Promise<LookupRecord[]> => {
      const result = await searchLookupRecords(
        props.objectApiName,
        props.searchTerm,
        props.limit
      )
      return result.data || []
    },
    []
  )

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <p className="text-sm text-muted-foreground">
          New {objectDefinition.label}
        </p>
        <h1 className="font-serif text-2xl font-bold text-foreground">
          Create {objectDefinition.label}
        </h1>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>{objectDefinition.label} Information</CardTitle>
        </CardHeader>
        <CardContent>
          <DynamicRecordForm
            layout={layout}
            fields={fields}
            initialData={defaultValues}
            mode="create"
            readOnly={false}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            onLookupSearch={handleLookupSearch}
            submitLabel={`Create ${objectDefinition.label}`}
          />
        </CardContent>
      </Card>
    </div>
  )
}
