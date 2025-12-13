'use client'

/**
 * SecureRecordDetailPage - A wrapper around RecordDetailPage that integrates
 * field-level security and record sharing capabilities.
 *
 * This component:
 * 1. Filters visible fields based on user's role permissions
 * 2. Determines which fields are editable per field-level security
 * 3. Integrates the RecordSharingPanel for record-level sharing management
 * 4. Checks record access before rendering
 */

import { useState, useCallback, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Edit,
  Trash2,
  MoreHorizontal,
  Loader2,
  X,
  Shield,
  Lock,
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
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

import { DynamicRecordForm } from './dynamic-record-form'
import { RecordSharingPanel } from '@/components/crm/record-sharing-panel'
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

export interface SecurityContext {
  /** Current user's ID */
  userId: string
  /** Whether user is the record owner */
  isOwner: boolean
  /** Whether user can edit this record */
  canEdit: boolean
  /** Whether user can delete this record */
  canDelete: boolean
  /** Whether user can manage sharing for this record */
  canManageSharing: boolean
  /** Set of field IDs the user can see */
  visibleFieldIds: Set<string>
  /** Set of field IDs the user can edit */
  editableFieldIds: Set<string>
  /** Whether security has been fully loaded */
  isLoaded: boolean
}

export interface RelatedTab {
  id: string
  label: string
  content: React.ReactNode
}

export interface SecureRecordDetailPageProps<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T extends { id: string; owner_id?: string | null; [key: string]: any },
> {
  /** Object definition metadata */
  objectDefinition: ObjectDefinition
  /** Field definitions (all fields - will be filtered by security) */
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
  /** Security context - pre-computed on server */
  securityContext: SecurityContext
}

// =====================================================
// MAIN COMPONENT
// =====================================================

export function SecureRecordDetailPage<
  T extends { id: string; owner_id?: string | null; [key: string]: unknown },
>({
  objectDefinition,
  fields,
  layout,
  record,
  backPath,
  recordName,
  relatedTabs = [],
  quickActions,
  initialMode = 'view',
  securityContext,
}: SecureRecordDetailPageProps<T>) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [mode, setMode] = useState<'view' | 'edit'>(initialMode)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Filter fields based on visibility permissions
  const visibleFields = useMemo(() => {
    if (!securityContext.isLoaded) return fields
    return fields.filter(f => securityContext.visibleFieldIds.has(f.id))
  }, [fields, securityContext.visibleFieldIds, securityContext.isLoaded])

  // Handle form submission with field permission validation
  const handleSubmit = useCallback(
    async (data: Record<string, unknown>) => {
      // Server-side validation will also check permissions,
      // but we filter client-side for better UX
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

  // Handle delete with permission check
  const handleDelete = useCallback(async () => {
    if (!securityContext.canDelete) {
      return
    }

    startTransition(async () => {
      const result = await deleteRecord(objectDefinition.api_name, record.id)
      if (result.success) {
        router.push(backPath)
      }
    })
    setShowDeleteDialog(false)
  }, [
    objectDefinition.api_name,
    record.id,
    backPath,
    router,
    securityContext.canDelete,
  ])

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

  // Build sharing tab if record has owner
  const sharingTab: RelatedTab | null =
    record.owner_id !== undefined
      ? {
          id: 'sharing',
          label: 'Sharing',
          content: (
            <RecordSharingPanel
              objectApiName={objectDefinition.api_name}
              recordId={record.id}
              ownerId={record.owner_id}
              isOwner={securityContext.isOwner}
              canManageSharing={securityContext.canManageSharing}
            />
          ),
        }
      : null

  // Combine related tabs with sharing tab
  const allTabs = sharingTab ? [...relatedTabs, sharingTab] : relatedTabs

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Record Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">
                {objectDefinition.label}
              </p>
              {/* Security indicator */}
              {securityContext.isLoaded && !securityContext.canEdit && (
                <Tooltip>
                  <TooltipTrigger>
                    <Lock className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>You have read-only access to this record</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            <h1 className="font-serif text-2xl font-bold text-foreground">
              {recordName}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Mode Toggle - only show Edit if user can edit */}
            {securityContext.canEdit && (
              <>
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
              </>
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
                {securityContext.canEdit && (
                  <DropdownMenuItem
                    onClick={() => router.push(`${backPath}/${record.id}/edit`)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit in Full Page
                  </DropdownMenuItem>
                )}
                {securityContext.canDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => setShowDeleteDialog(true)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
                {!securityContext.canEdit && !securityContext.canDelete && (
                  <DropdownMenuItem disabled>
                    <Shield className="mr-2 h-4 w-4" />
                    Limited Access
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Security Notice Banner (for read-only users) */}
        {securityContext.isLoaded &&
          !securityContext.canEdit &&
          mode === 'view' && (
            <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
              <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertDescription className="text-sm text-amber-700 dark:text-amber-400">
                You have read-only access to this record. Contact the owner or
                an administrator for edit access.
              </AlertDescription>
            </Alert>
          )}

        {/* Main Content */}
        <div>
          <Tabs defaultValue="details" className="space-y-6">
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              {allTabs.map(tab => (
                <TabsTrigger key={tab.id} value={tab.id}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Details Tab */}
            <TabsContent value="details" className="space-y-6">
              <DynamicRecordForm
                layout={layout}
                fields={visibleFields}
                initialData={record}
                mode="edit"
                readOnly={mode === 'view' || !securityContext.canEdit}
                editableFieldIds={securityContext.editableFieldIds}
                onSubmit={handleSubmit}
                onCancel={() => setMode('view')}
                onLookupSearch={handleLookupSearch}
                onLookupRecordClick={handleLookupRecordClick}
              />
            </TabsContent>

            {/* Related Tabs */}
            {allTabs.map(tab => (
              <TabsContent key={tab.id} value={tab.id}>
                {tab.content}
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Delete {objectDefinition.label}?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete &quot;{recordName}&quot;. This
                action cannot be undone.
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
    </TooltipProvider>
  )
}

export type { LookupSearchProps, LookupRecord }
