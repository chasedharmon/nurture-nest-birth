'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Loader2,
  Copy,
  RotateCcw,
  Save,
  AlertCircle,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FieldPermissionsMatrix } from '@/components/admin/setup/field-permissions-matrix'
import {
  getFieldPermissionMatrix,
  bulkSetFieldPermissions,
  resetFieldPermissions,
  copyFieldPermissions,
} from '@/app/actions/field-security'
import type { Role } from '@/lib/supabase/types'
import type { ObjectDefinition } from '@/lib/crm/types'

interface FieldPermissionsSelectorProps {
  roles: Role[]
  objects: Array<ObjectDefinition & { fieldCount: number }>
  initialRoleId?: string
}

interface FieldPermissionState {
  fieldId: string
  isVisible: boolean
  isEditable: boolean
}

export function FieldPermissionsSelector({
  roles,
  objects,
  initialRoleId = '',
}: FieldPermissionsSelectorProps) {
  const [selectedRoleId, setSelectedRoleId] = useState<string>(initialRoleId)
  const [selectedObjectApiName, setSelectedObjectApiName] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Permission matrix state
  const [permissions, setPermissions] = useState<FieldPermissionState[]>([])
  const [originalPermissions, setOriginalPermissions] = useState<
    FieldPermissionState[]
  >([])
  const [matrixData, setMatrixData] = useState<{
    objectApiName: string
    roleId: string
    fields: Array<{
      fieldId: string
      apiName: string
      label: string
      isVisible: boolean
      isEditable: boolean
      isStandard: boolean
      isSensitive: boolean
    }>
  } | null>(null)

  // Dialogs
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [showCopyDialog, setShowCopyDialog] = useState(false)
  const [copyTargetRoleId, setCopyTargetRoleId] = useState<string>('')

  // Check if there are unsaved changes
  const hasChanges =
    JSON.stringify(permissions) !== JSON.stringify(originalPermissions)

  // Load permission matrix when role and object are selected
  const loadPermissions = useCallback(async () => {
    if (!selectedRoleId || !selectedObjectApiName) {
      setMatrixData(null)
      setPermissions([])
      setOriginalPermissions([])
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await getFieldPermissionMatrix(
        selectedObjectApiName,
        selectedRoleId
      )

      if (result.error) {
        setError(result.error)
        return
      }

      if (result.data) {
        setMatrixData(result.data)
        const initialPermissions = result.data.fields.map(f => ({
          fieldId: f.fieldId,
          isVisible: f.isVisible,
          isEditable: f.isEditable,
        }))
        setPermissions(initialPermissions)
        setOriginalPermissions(initialPermissions)
      }
    } catch {
      setError('Failed to load field permissions')
    } finally {
      setIsLoading(false)
    }
  }, [selectedRoleId, selectedObjectApiName])

  useEffect(() => {
    loadPermissions()
  }, [loadPermissions])

  // Clear success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [successMessage])

  // Handle permission change
  const handlePermissionChange = (
    fieldId: string,
    type: 'visible' | 'editable',
    value: boolean
  ) => {
    setPermissions(prev =>
      prev.map(p => {
        if (p.fieldId !== fieldId) return p

        // If making not visible, also make not editable
        if (type === 'visible' && !value) {
          return { ...p, isVisible: false, isEditable: false }
        }

        // If making editable, also make visible
        if (type === 'editable' && value) {
          return { ...p, isVisible: true, isEditable: true }
        }

        return {
          ...p,
          [type === 'visible' ? 'isVisible' : 'isEditable']: value,
        }
      })
    )
  }

  // Get object definition ID for the selected object
  const getObjectDefinitionId = () => {
    const obj = objects.find(o => o.api_name === selectedObjectApiName)
    return obj?.id || ''
  }

  // Save permissions
  const handleSave = async () => {
    if (!selectedRoleId || !selectedObjectApiName) return

    setIsSaving(true)
    setError(null)

    try {
      const result = await bulkSetFieldPermissions(
        selectedRoleId,
        getObjectDefinitionId(),
        permissions.map(p => ({
          fieldDefinitionId: p.fieldId,
          isVisible: p.isVisible,
          isEditable: p.isEditable,
        }))
      )

      if (result.error) {
        setError(result.error)
        return
      }

      setOriginalPermissions(permissions)
      setSuccessMessage('Field permissions saved successfully')
    } catch {
      setError('Failed to save field permissions')
    } finally {
      setIsSaving(false)
    }
  }

  // Reset permissions (remove all restrictions)
  const handleReset = async () => {
    if (!selectedRoleId || !selectedObjectApiName) return

    setIsSaving(true)
    setError(null)

    try {
      const result = await resetFieldPermissions(
        selectedRoleId,
        getObjectDefinitionId()
      )

      if (result.error) {
        setError(result.error)
        return
      }

      // Reload permissions
      await loadPermissions()
      setSuccessMessage('Field permissions reset to defaults')
    } catch {
      setError('Failed to reset field permissions')
    } finally {
      setIsSaving(false)
      setShowResetDialog(false)
    }
  }

  // Copy permissions from another role
  const handleCopy = async () => {
    if (!copyTargetRoleId || !selectedRoleId || !selectedObjectApiName) return

    setIsSaving(true)
    setError(null)

    try {
      const result = await copyFieldPermissions(
        copyTargetRoleId,
        selectedRoleId,
        getObjectDefinitionId()
      )

      if (result.error) {
        setError(result.error)
        return
      }

      // Reload permissions
      await loadPermissions()
      setSuccessMessage(`Copied ${result.copiedCount} field permissions`)
    } catch {
      setError('Failed to copy field permissions')
    } finally {
      setIsSaving(false)
      setShowCopyDialog(false)
      setCopyTargetRoleId('')
    }
  }

  // Set all fields to a specific permission
  const handleSetAll = (type: 'visible' | 'editable', value: boolean) => {
    setPermissions(prev =>
      prev.map(p => {
        if (type === 'visible') {
          return {
            ...p,
            isVisible: value,
            isEditable: value ? p.isEditable : false,
          }
        }
        return { ...p, isEditable: value, isVisible: value || p.isVisible }
      })
    )
  }

  const selectedRole = roles.find(r => r.id === selectedRoleId)
  const selectedObject = objects.find(o => o.api_name === selectedObjectApiName)

  return (
    <div className="space-y-6">
      {/* Selectors */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="role-select">Select Role</Label>
          <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
            <SelectTrigger id="role-select">
              <SelectValue placeholder="Choose a role..." />
            </SelectTrigger>
            <SelectContent>
              {roles.map(role => (
                <SelectItem key={role.id} value={role.id}>
                  <span className="capitalize">
                    {role.name.replace(/_/g, ' ')}
                  </span>
                  {role.is_system && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      (System)
                    </span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="object-select">Select Object</Label>
          <Select
            value={selectedObjectApiName}
            onValueChange={setSelectedObjectApiName}
            disabled={!selectedRoleId}
          >
            <SelectTrigger id="object-select">
              <SelectValue placeholder="Choose an object..." />
            </SelectTrigger>
            <SelectContent>
              {objects.map(obj => (
                <SelectItem key={obj.id} value={obj.api_name}>
                  {obj.label}
                  <span className="ml-2 text-xs text-muted-foreground">
                    ({obj.fieldCount} fields)
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
          <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-700 dark:text-green-400">
            {successMessage}
          </AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Permission Matrix */}
      {!isLoading && selectedRoleId && selectedObjectApiName && matrixData && (
        <div className="space-y-4">
          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border bg-muted/30 p-4">
            <div className="text-sm text-muted-foreground">
              Configuring{' '}
              <span className="font-medium text-foreground">
                {selectedObject?.label}
              </span>{' '}
              fields for role{' '}
              <span className="font-medium text-foreground capitalize">
                {selectedRole?.name.replace(/_/g, ' ')}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCopyDialog(true)}
                disabled={isSaving}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy From
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowResetDialog(true)}
                disabled={isSaving}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>

              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving || !hasChanges}
              >
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Changes
              </Button>
            </div>
          </div>

          {/* Matrix Component */}
          <FieldPermissionsMatrix
            fields={matrixData.fields}
            permissions={permissions}
            onPermissionChange={handlePermissionChange}
            onSetAllVisible={value => handleSetAll('visible', value)}
            onSetAllEditable={value => handleSetAll('editable', value)}
            disabled={isSaving}
          />

          {/* Unsaved Changes Warning */}
          {hasChanges && (
            <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertDescription className="text-amber-700 dark:text-amber-400">
                You have unsaved changes. Click &quot;Save Changes&quot; to
                apply them.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && (!selectedRoleId || !selectedObjectApiName) && (
        <div className="rounded-lg border-2 border-dashed py-12 text-center">
          <p className="text-muted-foreground">
            Select a role and object to configure field permissions
          </p>
        </div>
      )}

      {/* Reset Confirmation Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Field Permissions?</DialogTitle>
            <DialogDescription>
              This will remove all custom field permissions for{' '}
              <span className="font-medium capitalize">
                {selectedRole?.name.replace(/_/g, ' ')}
              </span>{' '}
              on <span className="font-medium">{selectedObject?.label}</span>.
              All fields will become visible and editable (default behavior).
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowResetDialog(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleReset} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw className="mr-2 h-4 w-4" />
              )}
              Reset Permissions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Copy From Dialog */}
      <Dialog open={showCopyDialog} onOpenChange={setShowCopyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Copy Permissions From Another Role</DialogTitle>
            <DialogDescription>
              Select a role to copy field permissions from. This will overwrite
              current permissions for{' '}
              <span className="font-medium capitalize">
                {selectedRole?.name.replace(/_/g, ' ')}
              </span>{' '}
              on <span className="font-medium">{selectedObject?.label}</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-4">
            <Label htmlFor="copy-source-role">Source Role</Label>
            <Select
              value={copyTargetRoleId}
              onValueChange={setCopyTargetRoleId}
            >
              <SelectTrigger id="copy-source-role">
                <SelectValue placeholder="Choose a role to copy from..." />
              </SelectTrigger>
              <SelectContent>
                {roles
                  .filter(r => r.id !== selectedRoleId)
                  .map(role => (
                    <SelectItem key={role.id} value={role.id}>
                      <span className="capitalize">
                        {role.name.replace(/_/g, ' ')}
                      </span>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCopyDialog(false)
                setCopyTargetRoleId('')
              }}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCopy}
              disabled={isSaving || !copyTargetRoleId}
            >
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Copy className="mr-2 h-4 w-4" />
              )}
              Copy Permissions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
