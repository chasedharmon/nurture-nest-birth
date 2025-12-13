'use client'

import { useState, useEffect } from 'react'
import { X, Trash2, CheckCircle, XCircle, UserPlus, Users } from 'lucide-react'
import type { ObjectType } from '@/lib/supabase/types'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { getTeamMembers, bulkAssignTeamMember } from '@/app/actions/list-views'

interface TeamMember {
  id: string
  name: string
  role: string
  is_active: boolean
}

interface BulkActionBarProps {
  selectedCount: number
  selectedIds: string[]
  objectType: ObjectType
  onAction: (action: string) => void
  onClearSelection: () => void
  isPending: boolean
  onAssignmentComplete?: () => void
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

// Object types that support team member assignment
const ASSIGNABLE_TYPES: ObjectType[] = ['leads', 'clients']

export function BulkActionBar({
  selectedCount,
  selectedIds,
  objectType,
  onAction,
  onClearSelection,
  isPending,
  onAssignmentComplete,
}: BulkActionBarProps) {
  const statusOptions = STATUS_OPTIONS[objectType]
  const canAssign = ASSIGNABLE_TYPES.includes(objectType)

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [isLoadingTeam, setIsLoadingTeam] = useState(false)
  const [assignmentRole, setAssignmentRole] = useState<
    'primary' | 'backup' | 'support'
  >('primary')
  const [isAssigning, setIsAssigning] = useState(false)

  // Load team members when component mounts and assignment is possible
  useEffect(() => {
    if (canAssign && teamMembers.length === 0) {
      setIsLoadingTeam(true)
      getTeamMembers()
        .then(result => {
          if (result.success && result.data) {
            setTeamMembers(result.data as TeamMember[])
          }
        })
        .finally(() => setIsLoadingTeam(false))
    }
  }, [canAssign, teamMembers.length])

  const handleAssignTeamMember = async (teamMemberId: string) => {
    setIsAssigning(true)
    try {
      const result = await bulkAssignTeamMember(
        objectType,
        selectedIds,
        teamMemberId,
        assignmentRole
      )
      if (result.success) {
        onClearSelection()
        onAssignmentComplete?.()
      }
    } finally {
      setIsAssigning(false)
    }
  }

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

        {/* Assign Team Member Dropdown */}
        {canAssign && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                disabled={isPending || isAssigning || isLoadingTeam}
              >
                <UserPlus className="mr-1 h-4 w-4" />
                Assign
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Assign Team Member
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              {/* Assignment Role Selector */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  Role:{' '}
                  {assignmentRole.charAt(0).toUpperCase() +
                    assignmentRole.slice(1)}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuRadioGroup
                    value={assignmentRole}
                    onValueChange={value =>
                      setAssignmentRole(
                        value as 'primary' | 'backup' | 'support'
                      )
                    }
                  >
                    <DropdownMenuRadioItem value="primary">
                      Primary Provider
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="backup">
                      Backup Provider
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="support">
                      Support Provider
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              <DropdownMenuSeparator />

              {/* Team Members List */}
              {isLoadingTeam ? (
                <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                  Loading team members...
                </div>
              ) : teamMembers.length === 0 ? (
                <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                  No team members found
                </div>
              ) : (
                teamMembers.map(member => (
                  <DropdownMenuItem
                    key={member.id}
                    onClick={() => handleAssignTeamMember(member.id)}
                    className="flex items-center justify-between"
                  >
                    <span>{member.name}</span>
                    <span className="text-xs text-muted-foreground capitalize">
                      {member.role}
                    </span>
                  </DropdownMenuItem>
                ))
              )}
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
