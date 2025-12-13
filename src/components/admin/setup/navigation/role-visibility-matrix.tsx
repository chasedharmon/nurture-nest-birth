'use client'

import { useState, useTransition, memo, createElement } from 'react'
import { Eye, EyeOff, Lock, Loader2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { getIconComponent } from '@/lib/admin-navigation'
import {
  updateRoleVisibility,
  bulkUpdateRoleVisibility,
  type AdminNavItem,
  type VisibilityState,
} from '@/app/actions/navigation-admin'

/**
 * Renders a dynamic icon by name using createElement to avoid
 * triggering React Compiler's component-creation-during-render detection
 */
function DynamicIcon({
  iconName,
  className,
}: {
  iconName: string
  className?: string
}) {
  const iconComponent = getIconComponent(iconName)
  return createElement(iconComponent, { className })
}

interface RoleVisibilityMatrixProps {
  items: AdminNavItem[]
  roles: Array<{ name: string; label: string }>
  onItemsChange: (items: AdminNavItem[]) => void
}

interface MatrixRowProps {
  item: AdminNavItem
  roles: Array<{ name: string; label: string }>
  rolesLength: number
  getVisibilityState: (item: AdminNavItem, roleName: string) => VisibilityState
  handleVisibilityChange: (
    item: AdminNavItem,
    roleName: string,
    newState: VisibilityState
  ) => void
  updatingCell: string | null
}

// Separate component to avoid creating icon component during parent render
const MatrixRow = memo(function MatrixRow({
  item,
  roles,
  rolesLength,
  getVisibilityState,
  handleVisibilityChange,
  updatingCell,
}: MatrixRowProps) {
  return (
    <div
      className="grid items-center gap-2 py-2 px-2 rounded-lg hover:bg-muted/50"
      style={{
        gridTemplateColumns: `200px repeat(${rolesLength}, 1fr)`,
      }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <div className="flex h-6 w-6 items-center justify-center rounded bg-muted flex-shrink-0">
          <DynamicIcon iconName={item.iconName} className="h-3 w-3" />
        </div>
        <span className="text-sm font-medium truncate">{item.displayName}</span>
        {item.isCustomObject && (
          <Badge variant="secondary" className="text-[10px] px-1">
            Custom
          </Badge>
        )}
      </div>
      {roles.map(role => (
        <VisibilityCell
          key={role.name}
          item={item}
          roleName={role.name}
          currentState={getVisibilityState(item, role.name)}
          onStateChange={state =>
            handleVisibilityChange(item, role.name, state)
          }
          isUpdating={updatingCell === `${item.id}-${role.name}`}
        />
      ))}
    </div>
  )
})

const VISIBILITY_OPTIONS: Array<{
  value: VisibilityState
  label: string
  description: string
  icon: typeof Eye
}> = [
  {
    value: 'visible',
    label: 'Visible',
    description: 'Always shown in navigation',
    icon: Eye,
  },
  {
    value: 'available',
    label: 'Available',
    description: 'User can add to their navigation',
    icon: EyeOff,
  },
  {
    value: 'hidden',
    label: 'Hidden',
    description: 'Not accessible to this role',
    icon: Lock,
  },
]

interface VisibilityCellProps {
  item: AdminNavItem
  roleName: string
  currentState: VisibilityState
  onStateChange: (state: VisibilityState) => void
  isUpdating: boolean
}

function VisibilityCell({
  item: _item,
  roleName: _roleName,
  currentState,
  onStateChange,
  isUpdating,
}: VisibilityCellProps) {
  const option = VISIBILITY_OPTIONS.find(o => o.value === currentState)
  const Icon = option?.icon || Eye

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'h-8 w-full justify-center gap-1 text-xs',
            currentState === 'visible' && 'text-green-600 hover:text-green-700',
            currentState === 'available' &&
              'text-amber-600 hover:text-amber-700',
            currentState === 'hidden' && 'text-muted-foreground'
          )}
          disabled={isUpdating}
        >
          {isUpdating ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Icon className="h-3 w-3" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center">
        {VISIBILITY_OPTIONS.map(opt => (
          <DropdownMenuItem
            key={opt.value}
            onClick={() => onStateChange(opt.value)}
            className="flex items-center gap-2"
          >
            <opt.icon className="h-4 w-4" />
            <div>
              <div className="font-medium">{opt.label}</div>
              <div className="text-xs text-muted-foreground">
                {opt.description}
              </div>
            </div>
            {currentState === opt.value && (
              <Check className="h-4 w-4 ml-auto" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function RoleVisibilityMatrix({
  items,
  roles,
  onItemsChange,
}: RoleVisibilityMatrixProps) {
  const [isPending, startTransition] = useTransition()
  const [updatingCell, setUpdatingCell] = useState<string | null>(null)

  // Group items by nav type for display
  const groupedItems = {
    primary_tab: items.filter(i => i.navType === 'primary_tab'),
    tools_menu: items.filter(i => i.navType === 'tools_menu'),
    admin_menu: items.filter(i => i.navType === 'admin_menu'),
  }

  const handleVisibilityChange = (
    item: AdminNavItem,
    roleName: string,
    newState: VisibilityState
  ) => {
    const cellKey = `${item.id}-${roleName}`
    setUpdatingCell(cellKey)

    startTransition(async () => {
      const result = await updateRoleVisibility(item.id, roleName, newState)

      if (result.success) {
        // Update local state
        const updatedItems = items.map(i => {
          if (i.id === item.id) {
            return {
              ...i,
              roleVisibility: {
                ...i.roleVisibility,
                [roleName]: newState,
              },
            }
          }
          return i
        })
        onItemsChange(updatedItems)
        toast.success('Visibility updated')
      } else {
        toast.error(result.error || 'Failed to update visibility')
      }

      setUpdatingCell(null)
    })
  }

  const handleBulkUpdate = (roleName: string, newState: VisibilityState) => {
    startTransition(async () => {
      const updates = items.map(item => ({
        navConfigId: item.id,
        roleName,
        visibilityState: newState,
      }))

      const result = await bulkUpdateRoleVisibility(updates)

      if (result.success) {
        // Update local state
        const updatedItems = items.map(item => ({
          ...item,
          roleVisibility: {
            ...item.roleVisibility,
            [roleName]: newState,
          },
        }))
        onItemsChange(updatedItems)
        toast.success(`Updated ${result.updated} items`)
      } else {
        toast.error(result.error || 'Failed to update visibility')
      }
    })
  }

  const getVisibilityState = (
    item: AdminNavItem,
    roleName: string
  ): VisibilityState => {
    return (
      (item.roleVisibility[
        roleName as keyof typeof item.roleVisibility
      ] as VisibilityState) ||
      item.defaultVisibility ||
      'visible'
    )
  }

  const renderSection = (title: string, sectionItems: AdminNavItem[]) => {
    if (sectionItems.length === 0) return null

    return (
      <div key={title}>
        <h3 className="text-sm font-medium text-muted-foreground mb-2 px-2">
          {title}
        </h3>
        {sectionItems.map(item => (
          <MatrixRow
            key={item.id}
            item={item}
            roles={roles}
            rolesLength={roles.length}
            getVisibilityState={getVisibilityState}
            handleVisibilityChange={handleVisibilityChange}
            updatingCell={updatingCell}
          />
        ))}
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Legend */}
        <div className="flex items-center gap-6 p-4 bg-muted/50 rounded-lg">
          <span className="text-sm font-medium">Visibility States:</span>
          {VISIBILITY_OPTIONS.map(opt => (
            <div key={opt.value} className="flex items-center gap-2">
              <opt.icon
                className={cn(
                  'h-4 w-4',
                  opt.value === 'visible' && 'text-green-600',
                  opt.value === 'available' && 'text-amber-600',
                  opt.value === 'hidden' && 'text-muted-foreground'
                )}
              />
              <span className="text-sm">{opt.label}</span>
            </div>
          ))}
        </div>

        {/* Matrix */}
        <div className="border rounded-lg overflow-hidden">
          {/* Header */}
          <div
            className="grid items-center gap-2 p-3 bg-muted/50 border-b font-medium"
            style={{
              gridTemplateColumns: `200px repeat(${roles.length}, 1fr)`,
            }}
          >
            <div className="text-sm">Navigation Item</div>
            {roles.map(role => (
              <Tooltip key={role.name}>
                <TooltipTrigger asChild>
                  <div className="text-sm text-center cursor-help">
                    {role.label}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="space-y-2">
                    <p className="font-medium">{role.label} Role</p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() => handleBulkUpdate(role.name, 'visible')}
                        disabled={isPending}
                      >
                        All Visible
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() => handleBulkUpdate(role.name, 'hidden')}
                        disabled={isPending}
                      >
                        All Hidden
                      </Button>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>

          {/* Body */}
          <div className="p-2 space-y-4">
            {renderSection('Primary Navigation', groupedItems.primary_tab)}
            {renderSection('Tools Menu', groupedItems.tools_menu)}
            {renderSection('Admin Menu', groupedItems.admin_menu)}
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
