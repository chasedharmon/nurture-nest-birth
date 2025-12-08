'use client'

import { X, Trash2, CheckCircle, XCircle } from 'lucide-react'
import type { ObjectType } from '@/lib/supabase/types'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface BulkActionBarProps {
  selectedCount: number
  objectType: ObjectType
  onAction: (action: string) => void
  onClearSelection: () => void
  isPending: boolean
}

const STATUS_OPTIONS: Record<
  ObjectType,
  { value: string; label: string; icon?: React.ReactNode }[]
> = {
  leads: [
    { value: 'new', label: 'New' },
    { value: 'contacted', label: 'Contacted' },
    { value: 'scheduled', label: 'Scheduled' },
    {
      value: 'client',
      label: 'Client',
      icon: <CheckCircle className="h-4 w-4 text-green-500" />,
    },
    {
      value: 'lost',
      label: 'Lost',
      icon: <XCircle className="h-4 w-4 text-red-500" />,
    },
  ],
  clients: [{ value: 'client', label: 'Active Client' }],
  invoices: [
    { value: 'draft', label: 'Draft' },
    { value: 'sent', label: 'Sent' },
    { value: 'paid', label: 'Paid' },
    { value: 'cancelled', label: 'Cancelled' },
  ],
  meetings: [
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'no_show', label: 'No Show' },
  ],
  team_members: [],
  payments: [
    { value: 'pending', label: 'Pending' },
    { value: 'completed', label: 'Completed' },
    { value: 'failed', label: 'Failed' },
    { value: 'refunded', label: 'Refunded' },
  ],
  services: [
    { value: 'pending', label: 'Pending' },
    { value: 'active', label: 'Active' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ],
}

export function BulkActionBar({
  selectedCount,
  objectType,
  onAction,
  onClearSelection,
  isPending,
}: BulkActionBarProps) {
  const statusOptions = STATUS_OPTIONS[objectType]

  return (
    <div className="flex items-center justify-between border-b border-primary/20 bg-primary/5 px-4 py-2">
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium">{selectedCount} selected</span>

        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          className="h-7 text-xs"
        >
          <X className="mr-1 h-3 w-3" />
          Clear
        </Button>
      </div>

      <div className="flex items-center gap-2">
        {/* Update Status Dropdown */}
        {statusOptions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                disabled={isPending}
              >
                Update Status
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {statusOptions.map(option => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => onAction(option.value)}
                  className="flex items-center gap-2"
                >
                  {option.icon}
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Delete Button */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-destructive hover:bg-destructive/10"
              disabled={isPending}
            >
              <Trash2 className="mr-1 h-4 w-4" />
              Delete
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <div className="p-2 text-sm">
              Are you sure you want to delete {selectedCount} record(s)?
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onAction('delete')}
              className="text-destructive focus:bg-destructive/10 focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Yes, delete {selectedCount} record(s)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
