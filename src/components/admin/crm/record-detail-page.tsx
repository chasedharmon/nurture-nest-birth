'use client'

/**
 * RecordDetailPage - A reusable component for CRM record detail pages
 *
 * This component provides the standard layout for viewing and editing
 * CRM records. It includes:
 * - Header with record name and actions
 * - View/Edit mode toggle
 * - DynamicRecordForm integration
 * - Related records tabs
 * - Activity timeline
 */

import { useState, useCallback, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Edit,
  Trash2,
  MoreHorizontal,
  Loader2,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

import { DynamicRecordForm } from './dynamic-record-form'
import type {
  ObjectDefinition,
  FieldWithPicklistValues,
  PageLayout,
} from '@/lib/crm/types'
import { updateRecord, deleteRecord } from '@/app/actions/crm-records'
import { searchLookupRecords } from '@/app/actions/object-metadata'
import type { LookupSearchProps, LookupRecord } from './fields'

// =====================================================
// TYPES
// =====================================================

export interface RelatedTab {
  id: string
  label: string
  content: React.ReactNode
}

export interface RecordDetailPageProps<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T extends { id: string; [key: string]: any },
> {
  /** Object definition metadata */
  objectDefinition: ObjectDefinition
  /** Field definitions */
  fields: FieldWithPicklistValues[]
  /** Page layout for the form */
  layout: PageLayout | null
  /** The record data */
  record: T
  /** Back navigation path */
  backPath: string
  /** Display name for the record (shown in header) */
  recordName: string
  /** Additional tabs for related records */
  relatedTabs?: RelatedTab[]
  /** Quick actions for the header */
  quickActions?: React.ReactNode
  /** Initial mode */
  initialMode?: 'view' | 'edit'
}

// =====================================================
// MAIN COMPONENT
// =====================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function RecordDetailPage<T extends { id: string; [key: string]: any }>({
  objectDefinition,
  fields,
  layout,
  record,
  backPath,
  recordName,
  relatedTabs = [],
  quickActions,
  initialMode = 'view',
}: RecordDetailPageProps<T>) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [mode, setMode] = useState<'view' | 'edit'>(initialMode)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Handle form submission
  const handleSubmit = useCallback(
    async (data: Record<string, unknown>) => {
      const result = await updateRecord(
        objectDefinition.api_name,
        record.id,
        data
      )
      if (result.error) {
        throw new Error(result.error)
      }
      setMode('view')
      router.refresh()
    },
    [objectDefinition.api_name, record.id, router]
  )

  // Handle delete
  const handleDelete = useCallback(async () => {
    startTransition(async () => {
      const result = await deleteRecord(objectDefinition.api_name, record.id)
      if (result.success) {
        router.push(backPath)
      }
    })
    setShowDeleteDialog(false)
  }, [objectDefinition.api_name, record.id, backPath, router])

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

  // Lookup record click handler (navigate to related record)
  const handleLookupRecordClick = useCallback(
    (recordId: string, objectApiName: string) => {
      const path = `/admin/${objectApiName.toLowerCase()}s/${recordId}`
      router.push(path)
    },
    [router]
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={backPath}>
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <p className="text-sm text-muted-foreground">
                  {objectDefinition.label}
                </p>
                <h1 className="font-serif text-2xl font-bold text-foreground">
                  {recordName}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Mode Toggle */}
              {mode === 'view' ? (
                <Button onClick={() => setMode('edit')}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              ) : (
                <Button variant="outline" onClick={() => setMode('view')}>
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              )}

              {/* Quick Actions */}
              {quickActions}

              {/* More Actions Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => router.push(`${backPath}/${record.id}/edit`)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit in Full Page
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Tabs defaultValue="details" className="space-y-6">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            {relatedTabs.map(tab => (
              <TabsTrigger key={tab.id} value={tab.id}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-6">
            <DynamicRecordForm
              layout={layout}
              fields={fields}
              initialData={record}
              mode="edit"
              readOnly={mode === 'view'}
              onSubmit={handleSubmit}
              onCancel={() => setMode('view')}
              onLookupSearch={handleLookupSearch}
              onLookupRecordClick={handleLookupRecordClick}
            />
          </TabsContent>

          {/* Related Tabs */}
          {relatedTabs.map(tab => (
            <TabsContent key={tab.id} value={tab.id}>
              {tab.content}
            </TabsContent>
          ))}
        </Tabs>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {objectDefinition.label}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{recordName}&quot;. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export type { LookupSearchProps, LookupRecord }
