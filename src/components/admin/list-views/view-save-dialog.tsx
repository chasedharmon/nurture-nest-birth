'use client'

import { useState } from 'react'
import type { ViewVisibility } from '@/lib/supabase/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

interface ViewSaveDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (name: string, visibility: ViewVisibility) => void
}

export function ViewSaveDialog({
  open,
  onOpenChange,
  onSave,
}: ViewSaveDialogProps) {
  const [name, setName] = useState('')
  const [visibility, setVisibility] = useState<ViewVisibility>('private')

  const handleSave = () => {
    if (!name.trim()) return
    onSave(name.trim(), visibility)
    setName('')
    setVisibility('private')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Save List View</DialogTitle>
          <DialogDescription>
            Save your current filters and column settings as a reusable view.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="view-name">View Name</Label>
            <Input
              id="view-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g., My Active Leads"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="view-visibility">Visibility</Label>
            <Select
              value={visibility}
              onValueChange={value => setVisibility(value as ViewVisibility)}
            >
              <SelectTrigger id="view-visibility">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">
                  <div>
                    <div className="font-medium">Private</div>
                    <div className="text-xs text-muted-foreground">
                      Only you can see this view
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="shared">
                  <div>
                    <div className="font-medium">Shared</div>
                    <div className="text-xs text-muted-foreground">
                      Share with your team
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="org">
                  <div>
                    <div className="font-medium">Organization</div>
                    <div className="text-xs text-muted-foreground">
                      Available to everyone
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            Save View
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
