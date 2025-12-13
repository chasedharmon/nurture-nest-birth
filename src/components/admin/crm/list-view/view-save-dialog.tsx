'use client'

/**
 * ViewSaveDialog - Save current filters and columns as a named view
 *
 * Features:
 * - Name the view
 * - Choose visibility (private, shared, org-wide)
 * - Optional: set as default view
 */

import { useState } from 'react'
import { Save, User, Globe, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

export type ViewVisibility = 'private' | 'shared' | 'org'

interface ViewSaveDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (
    name: string,
    visibility: ViewVisibility,
    isDefault: boolean
  ) => Promise<void>
  filterCount: number
  columnCount: number
  objectLabel: string
}

const VISIBILITY_OPTIONS: {
  value: ViewVisibility
  label: string
  description: string
  icon: typeof User
}[] = [
  {
    value: 'private',
    label: 'Private',
    description: 'Only you can see this view',
    icon: User,
  },
  {
    value: 'shared',
    label: 'Shared',
    description: 'Anyone with the link can use this view',
    icon: Globe,
  },
  {
    value: 'org',
    label: 'Organization',
    description: 'Everyone in your organization can see this view',
    icon: Building2,
  },
]

export function ViewSaveDialog({
  open,
  onOpenChange,
  onSave,
  filterCount,
  columnCount,
  objectLabel,
}: ViewSaveDialogProps) {
  const [name, setName] = useState('')
  const [visibility, setVisibility] = useState<ViewVisibility>('private')
  const [isDefault, setIsDefault] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Please enter a name for your view')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      await onSave(name.trim(), visibility, isDefault)
      // Reset form on success
      setName('')
      setVisibility('private')
      setIsDefault(false)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save view')
    } finally {
      setIsSaving(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Reset form when closing
      setName('')
      setVisibility('private')
      setIsDefault(false)
      setError(null)
    }
    onOpenChange(open)
  }

  const selectedVisibility = VISIBILITY_OPTIONS.find(
    v => v.value === visibility
  )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            Save View
          </DialogTitle>
          <DialogDescription>
            Save your current filters and column configuration as a reusable
            view.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Summary of what's being saved */}
          <div className="rounded-md bg-muted/50 p-3 text-sm">
            <p className="font-medium">This view will include:</p>
            <ul className="mt-1 space-y-1 text-muted-foreground">
              <li>
                • {filterCount} filter{filterCount !== 1 ? 's' : ''} applied
              </li>
              <li>
                • {columnCount} column{columnCount !== 1 ? 's' : ''} configured
              </li>
              <li>• Current sort order</li>
            </ul>
          </div>

          {/* View name */}
          <div className="space-y-2">
            <Label htmlFor="view-name">View Name</Label>
            <Input
              id="view-name"
              placeholder={`e.g., "Active ${objectLabel}" or "Needs Follow-up"`}
              value={name}
              onChange={e => {
                setName(e.target.value)
                setError(null)
              }}
              className={cn(error && 'border-destructive')}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          {/* Visibility */}
          <div className="space-y-2">
            <Label>Visibility</Label>
            <Select
              value={visibility}
              onValueChange={value => setVisibility(value as ViewVisibility)}
            >
              <SelectTrigger>
                <SelectValue>
                  {selectedVisibility && (
                    <div className="flex items-center gap-2">
                      <selectedVisibility.icon className="h-4 w-4" />
                      {selectedVisibility.label}
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {VISIBILITY_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <option.icon className="h-4 w-4" />
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {option.description}
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Set as default */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is-default"
              checked={isDefault}
              onCheckedChange={checked => setIsDefault(checked === true)}
            />
            <Label htmlFor="is-default" className="cursor-pointer">
              Set as my default view for {objectLabel}
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !name.trim()}>
            {isSaving ? 'Saving...' : 'Save View'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
