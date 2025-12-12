'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Eye, Edit3, Shield, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FieldInfo {
  fieldId: string
  apiName: string
  label: string
  isVisible: boolean
  isEditable: boolean
  isStandard: boolean
  isSensitive: boolean
}

interface FieldPermissionState {
  fieldId: string
  isVisible: boolean
  isEditable: boolean
}

interface FieldPermissionsMatrixProps {
  fields: FieldInfo[]
  permissions: FieldPermissionState[]
  onPermissionChange: (
    fieldId: string,
    type: 'visible' | 'editable',
    value: boolean
  ) => void
  onSetAllVisible?: (value: boolean) => void
  onSetAllEditable?: (value: boolean) => void
  disabled?: boolean
}

export function FieldPermissionsMatrix({
  fields,
  permissions,
  onPermissionChange,
  onSetAllVisible,
  onSetAllEditable,
  disabled = false,
}: FieldPermissionsMatrixProps) {
  // Create a lookup map for quick access
  const permissionMap = new Map(permissions.map(p => [p.fieldId, p]))

  // Calculate "all" states
  const allVisible = permissions.every(p => p.isVisible)
  const someVisible = permissions.some(p => p.isVisible)
  const allEditable = permissions.every(p => p.isEditable)
  const someEditable = permissions.some(p => p.isEditable)

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
              Field
            </th>
            <th className="px-4 py-3 text-center font-medium text-muted-foreground">
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span>Visible</span>
                </div>
                {onSetAllVisible && (
                  <Checkbox
                    checked={allVisible}
                    ref={el => {
                      if (el) {
                        const checkbox = el as unknown as HTMLInputElement
                        checkbox.indeterminate = someVisible && !allVisible
                      }
                    }}
                    onCheckedChange={(checked: boolean) =>
                      onSetAllVisible(checked)
                    }
                    disabled={disabled}
                    className="h-4 w-4"
                    aria-label="Toggle all visible"
                  />
                )}
              </div>
            </th>
            <th className="px-4 py-3 text-center font-medium text-muted-foreground">
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-1">
                  <Edit3 className="h-4 w-4" />
                  <span>Editable</span>
                </div>
                {onSetAllEditable && (
                  <Checkbox
                    checked={allEditable}
                    ref={el => {
                      if (el) {
                        const checkbox = el as unknown as HTMLInputElement
                        checkbox.indeterminate = someEditable && !allEditable
                      }
                    }}
                    onCheckedChange={(checked: boolean) =>
                      onSetAllEditable(checked)
                    }
                    disabled={disabled}
                    className="h-4 w-4"
                    aria-label="Toggle all editable"
                  />
                )}
              </div>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {fields.map(field => {
            const perm = permissionMap.get(field.fieldId)
            const isVisible = perm?.isVisible ?? true
            const isEditable = perm?.isEditable ?? true

            return (
              <tr
                key={field.fieldId}
                className={cn(
                  'hover:bg-muted/30',
                  field.isSensitive && 'bg-amber-50/50 dark:bg-amber-950/20'
                )}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">
                      {field.label}
                    </span>
                    <div className="flex items-center gap-1">
                      {field.isStandard && (
                        <Badge variant="secondary" className="text-xs">
                          <Shield className="mr-1 h-3 w-3" />
                          Standard
                        </Badge>
                      )}
                      {field.isSensitive && (
                        <Badge
                          variant="outline"
                          className="border-amber-300 bg-amber-100 text-amber-700 text-xs dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                        >
                          <AlertTriangle className="mr-1 h-3 w-3" />
                          Sensitive
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">
                    {field.apiName}
                  </p>
                </td>
                <td className="px-4 py-3 text-center">
                  <Checkbox
                    checked={isVisible}
                    onCheckedChange={(checked: boolean) =>
                      onPermissionChange(field.fieldId, 'visible', checked)
                    }
                    disabled={disabled}
                    className="h-5 w-5"
                    aria-label={`${field.label} visible`}
                  />
                </td>
                <td className="px-4 py-3 text-center">
                  <Checkbox
                    checked={isEditable}
                    onCheckedChange={(checked: boolean) =>
                      onPermissionChange(field.fieldId, 'editable', checked)
                    }
                    disabled={disabled || !isVisible}
                    className={cn('h-5 w-5', !isVisible && 'opacity-50')}
                    aria-label={`${field.label} editable`}
                  />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* Legend */}
      <div className="border-t bg-muted/30 px-4 py-3">
        <div className="flex flex-wrap items-center gap-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Checkbox checked disabled className="h-4 w-4" />
            <span>Has permission</span>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox disabled className="h-4 w-4" />
            <span>No permission</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="border-amber-300 bg-amber-100 text-amber-700 text-xs dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
            >
              <AlertTriangle className="mr-1 h-3 w-3" />
              Sensitive
            </Badge>
            <span>Contains PII or sensitive data</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Summary view for read-only display
export function FieldPermissionsSummary({
  totalFields,
  visibleCount,
  editableCount,
}: {
  totalFields: number
  visibleCount: number
  editableCount: number
}) {
  return (
    <div className="flex items-center gap-4 text-sm text-muted-foreground">
      <div className="flex items-center gap-1">
        <Eye className="h-4 w-4" />
        <span>
          {visibleCount}/{totalFields} visible
        </span>
      </div>
      <div className="flex items-center gap-1">
        <Edit3 className="h-4 w-4" />
        <span>
          {editableCount}/{totalFields} editable
        </span>
      </div>
    </div>
  )
}
