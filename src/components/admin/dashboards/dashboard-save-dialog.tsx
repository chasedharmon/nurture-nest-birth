'use client'

import { useState } from 'react'
import { Loader2, Save, Globe, Lock, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'
import type { ViewVisibility } from '@/lib/supabase/types'

interface DashboardSaveDialogProps {
  onSave: (data: {
    name: string
    description: string
    visibility: ViewVisibility
  }) => Promise<void>
  trigger?: React.ReactNode
  initialName?: string
  initialDescription?: string
  initialVisibility?: ViewVisibility
  isEdit?: boolean
}

const VISIBILITY_OPTIONS: {
  value: ViewVisibility
  label: string
  description: string
  icon: React.ElementType
}[] = [
  {
    value: 'private',
    label: 'Private',
    description: 'Only you can see this dashboard',
    icon: Lock,
  },
  {
    value: 'shared',
    label: 'Shared',
    description: 'Share with specific team members',
    icon: Users,
  },
  {
    value: 'org',
    label: 'Organization',
    description: 'Everyone in your organization can see this',
    icon: Globe,
  },
]

export function DashboardSaveDialog({
  onSave,
  trigger,
  initialName = '',
  initialDescription = '',
  initialVisibility = 'private',
  isEdit = false,
}: DashboardSaveDialogProps) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState(initialName)
  const [description, setDescription] = useState(initialDescription)
  const [visibility, setVisibility] =
    useState<ViewVisibility>(initialVisibility)
  const [error, setError] = useState<string | null>(null)

  // Reset form when dialog opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setName(initialName)
      setDescription(initialDescription)
      setVisibility(initialVisibility)
      setError(null)
    }
    setOpen(isOpen)
  }

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Dashboard name is required')
      return
    }

    setSaving(true)
    setError(null)

    try {
      await onSave({
        name: name.trim(),
        description: description.trim(),
        visibility,
      })
      setOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save dashboard')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Save className="mr-2 h-4 w-4" />
            {isEdit ? 'Update Dashboard' : 'Save Dashboard'}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Update Dashboard' : 'Save Dashboard'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update your dashboard settings'
              : 'Give your dashboard a name and choose who can see it'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Dashboard Name */}
          <div className="space-y-2">
            <Label htmlFor="dashboard-name">
              Dashboard Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="dashboard-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g., Sales Overview, Team Performance"
              className={cn(error && !name.trim() && 'border-destructive')}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="dashboard-description">Description</Label>
            <Textarea
              id="dashboard-description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe what this dashboard shows..."
              rows={3}
            />
          </div>

          {/* Visibility */}
          <div className="space-y-3">
            <Label>Visibility</Label>
            <RadioGroup
              value={visibility}
              onValueChange={(val: ViewVisibility) => setVisibility(val)}
              className="space-y-2"
            >
              {VISIBILITY_OPTIONS.map(option => {
                const Icon = option.icon
                return (
                  <div
                    key={option.value}
                    className={cn(
                      'flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors',
                      visibility === option.value &&
                        'border-primary bg-primary/5'
                    )}
                    onClick={() => setVisibility(option.value)}
                  >
                    <RadioGroupItem
                      value={option.value}
                      id={`vis-${option.value}`}
                    />
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <Label
                        htmlFor={`vis-${option.value}`}
                        className="cursor-pointer font-medium"
                      >
                        {option.label}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {option.description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </RadioGroup>
          </div>

          {/* Error message */}
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {isEdit ? 'Update' : 'Save Dashboard'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
