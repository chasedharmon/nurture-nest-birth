'use client'

/**
 * NewRecordPage - A reusable component for creating new CRM records
 *
 * This component provides a standard layout for creating new records
 * using the DynamicRecordForm component.
 */

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Handle form submission
  const handleSubmit = useCallback(
    async (data: Record<string, unknown>) => {
      setIsSubmitting(true)
      try {
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
      } finally {
        setIsSubmitting(false)
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href={backPath}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <p className="text-sm text-muted-foreground">
                New {objectDefinition.label}
              </p>
              <h1 className="font-serif text-2xl font-bold text-foreground">
                Create {objectDefinition.label}
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
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
              isLoading={isSubmitting}
              onLookupSearch={handleLookupSearch}
              submitLabel={`Create ${objectDefinition.label}`}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
