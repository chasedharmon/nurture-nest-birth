'use client'

import { Checkbox } from '@/components/ui/checkbox'
import type { Permissions, PermissionAction } from '@/lib/supabase/types'
import {
  PERMISSION_OBJECTS,
  PERMISSION_ACTIONS,
  PERMISSION_OBJECT_LABELS,
  PERMISSION_ACTION_LABELS,
} from '@/lib/permissions'

interface PermissionsMatrixProps {
  permissions: Permissions
  onChange: (permissions: Permissions) => void
  disabled?: boolean
}

export function PermissionsMatrix({
  permissions,
  onChange,
  disabled = false,
}: PermissionsMatrixProps) {
  // Check if this is a full admin permission (*)
  const isFullAdmin =
    permissions['*']?.includes('*') ||
    permissions['*']?.includes('*' as PermissionAction)

  const hasPermission = (object: string, action: PermissionAction): boolean => {
    if (isFullAdmin) return true
    const objectPerms = permissions[object] || []
    return (
      objectPerms.includes(action) ||
      objectPerms.includes('*' as PermissionAction)
    )
  }

  const togglePermission = (object: string, action: PermissionAction) => {
    if (disabled) return

    const newPermissions = { ...permissions }
    const currentPerms = [...(newPermissions[object] || [])]

    if (currentPerms.includes(action)) {
      // Remove the permission
      newPermissions[object] = currentPerms.filter(p => p !== action)
      if (newPermissions[object].length === 0) {
        delete newPermissions[object]
      }
    } else {
      // Add the permission
      newPermissions[object] = [...currentPerms, action]
    }

    onChange(newPermissions)
  }

  const toggleAllForObject = (object: string, checked: boolean) => {
    if (disabled) return

    const newPermissions = { ...permissions }
    if (checked) {
      newPermissions[object] = [...PERMISSION_ACTIONS]
    } else {
      delete newPermissions[object]
    }
    onChange(newPermissions)
  }

  const toggleAllForAction = (action: PermissionAction, checked: boolean) => {
    if (disabled) return

    const newPermissions = { ...permissions }
    PERMISSION_OBJECTS.forEach(object => {
      const currentPerms = [...(newPermissions[object] || [])]
      if (checked) {
        if (!currentPerms.includes(action)) {
          newPermissions[object] = [...currentPerms, action]
        }
      } else {
        newPermissions[object] = currentPerms.filter(p => p !== action)
        if (newPermissions[object].length === 0) {
          delete newPermissions[object]
        }
      }
    })
    onChange(newPermissions)
  }

  const allForObjectChecked = (object: string): boolean => {
    return PERMISSION_ACTIONS.every(action => hasPermission(object, action))
  }

  const allForActionChecked = (action: PermissionAction): boolean => {
    return PERMISSION_OBJECTS.every(object => hasPermission(object, action))
  }

  if (isFullAdmin) {
    return (
      <div className="rounded-md border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
        <p className="text-sm text-amber-800 dark:text-amber-300">
          This role has full administrative access to all features.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
              Object
            </th>
            {PERMISSION_ACTIONS.map(action => (
              <th
                key={action}
                className="px-4 py-3 text-center font-medium text-muted-foreground"
              >
                <div className="flex flex-col items-center gap-1">
                  <span>{PERMISSION_ACTION_LABELS[action]}</span>
                  <Checkbox
                    checked={allForActionChecked(action)}
                    onCheckedChange={(checked: boolean) =>
                      toggleAllForAction(action, checked)
                    }
                    disabled={disabled}
                    className="h-4 w-4"
                  />
                </div>
              </th>
            ))}
            <th className="px-4 py-3 text-center font-medium text-muted-foreground">
              All
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {PERMISSION_OBJECTS.map(object => (
            <tr key={object} className="hover:bg-muted/50">
              <td className="px-4 py-3 font-medium text-foreground">
                {PERMISSION_OBJECT_LABELS[object] || object}
              </td>
              {PERMISSION_ACTIONS.map(action => (
                <td key={action} className="px-4 py-3 text-center">
                  <Checkbox
                    checked={hasPermission(object, action)}
                    onCheckedChange={() => togglePermission(object, action)}
                    disabled={disabled}
                    className="h-4 w-4"
                  />
                </td>
              ))}
              <td className="px-4 py-3 text-center">
                <Checkbox
                  checked={allForObjectChecked(object)}
                  onCheckedChange={(checked: boolean) =>
                    toggleAllForObject(object, checked)
                  }
                  disabled={disabled}
                  className="h-4 w-4"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Checkbox checked disabled className="h-3 w-3" />
          <span>Has permission</span>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox disabled className="h-3 w-3" />
          <span>No permission</span>
        </div>
      </div>
    </div>
  )
}

// Read-only version for display
export function PermissionsMatrixReadOnly({
  permissions,
}: {
  permissions: Permissions
}) {
  const isFullAdmin =
    permissions['*']?.includes('*') ||
    permissions['*']?.includes('*' as PermissionAction)

  const hasPermission = (object: string, action: PermissionAction): boolean => {
    if (isFullAdmin) return true
    const objectPerms = permissions[object] || []
    return (
      objectPerms.includes(action) ||
      objectPerms.includes('*' as PermissionAction)
    )
  }

  if (isFullAdmin) {
    return (
      <div className="text-sm text-muted-foreground">
        Full administrative access
      </div>
    )
  }

  // Count permissions
  let totalPermissions = 0
  PERMISSION_OBJECTS.forEach(object => {
    PERMISSION_ACTIONS.forEach(action => {
      if (hasPermission(object, action)) totalPermissions++
    })
  })

  const maxPermissions = PERMISSION_OBJECTS.length * PERMISSION_ACTIONS.length

  return (
    <div className="text-sm text-muted-foreground">
      {totalPermissions} / {maxPermissions} permissions
    </div>
  )
}
