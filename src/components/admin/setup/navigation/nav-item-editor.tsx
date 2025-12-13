'use client'

import { useState, useTransition, createElement } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { getIconComponent } from '@/lib/admin-navigation'
import {
  updateNavItemDisplay,
  type AdminNavItem,
} from '@/app/actions/navigation-admin'
import { IconPicker } from './icon-picker'

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

interface NavItemEditorProps {
  item: AdminNavItem
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (updatedItem: AdminNavItem) => void
}

export function NavItemEditor({
  item,
  open,
  onOpenChange,
  onSave,
}: NavItemEditorProps) {
  const [isPending, startTransition] = useTransition()
  const [displayName, setDisplayName] = useState(item.displayName)
  const [iconName, setIconName] = useState(item.iconName)
  const [isRequired, setIsRequired] = useState(item.isRequired)
  const [canBeRemoved, setCanBeRemoved] = useState(item.canBeRemoved)

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateNavItemDisplay(item.id, {
        displayName: displayName !== item.displayName ? displayName : undefined,
        iconName: iconName !== item.iconName ? iconName : undefined,
        isRequired: isRequired !== item.isRequired ? isRequired : undefined,
        canBeRemoved:
          canBeRemoved !== item.canBeRemoved ? canBeRemoved : undefined,
      })

      if (result.success) {
        toast.success('Navigation item updated')
        onSave({
          ...item,
          displayName,
          iconName,
          isRequired,
          canBeRemoved,
        })
      } else {
        toast.error(result.error || 'Failed to update item')
      }
    })
  }

  const hasChanges =
    displayName !== item.displayName ||
    iconName !== item.iconName ||
    isRequired !== item.isRequired ||
    canBeRemoved !== item.canBeRemoved

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Navigation Item</DialogTitle>
          <DialogDescription>
            Customize how this item appears in the navigation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Preview */}
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-background">
              <DynamicIcon iconName={iconName} className="h-5 w-5" />
            </div>
            <div>
              <div className="font-medium">{displayName}</div>
              <div className="text-xs text-muted-foreground">
                {item.objectApiName || item.itemKey}
              </div>
            </div>
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Enter display name"
            />
          </div>

          {/* Icon */}
          <div className="space-y-2">
            <Label>Icon</Label>
            <IconPicker value={iconName} onChange={setIconName} />
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="required">Required</Label>
                <p className="text-xs text-muted-foreground">
                  Users cannot remove this item from their navigation
                </p>
              </div>
              <Switch
                id="required"
                checked={isRequired}
                onCheckedChange={setIsRequired}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="removable">Allow Removal</Label>
                <p className="text-xs text-muted-foreground">
                  Users can hide this item from their view
                </p>
              </div>
              <Switch
                id="removable"
                checked={canBeRemoved}
                onCheckedChange={setCanBeRemoved}
                disabled={isRequired}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isPending || !hasChanges}>
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
