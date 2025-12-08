'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, X, User, UserPlus } from 'lucide-react'
import type {
  ClientAssignment,
  TeamMember,
  AssignmentRole,
} from '@/lib/supabase/types'
import {
  assignClientToTeamMember,
  updateClientAssignment,
  removeClientAssignment,
} from '@/app/actions/team'

interface ClientTeamAssignmentsProps {
  clientId: string
  assignments: ClientAssignment[]
  availableMembers: TeamMember[]
}

const roleColors: Record<AssignmentRole, string> = {
  primary:
    'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
  backup: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
  support:
    'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300',
}

const roleLabels: Record<AssignmentRole, string> = {
  primary: 'Primary',
  backup: 'Backup',
  support: 'Support',
}

export function ClientTeamAssignments({
  clientId,
  assignments,
  availableMembers,
}: ClientTeamAssignmentsProps) {
  const router = useRouter()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedMemberId, setSelectedMemberId] = useState('')
  const [selectedRole, setSelectedRole] = useState<AssignmentRole>('primary')
  const [notes, setNotes] = useState('')

  // Filter out already assigned members
  const assignedMemberIds = assignments.map(a => a.team_member_id)
  const unassignedMembers = availableMembers.filter(
    m => !assignedMemberIds.includes(m.id) && m.is_active
  )

  const handleAssign = async () => {
    if (!selectedMemberId) return

    setIsLoading(true)
    const result = await assignClientToTeamMember({
      client_id: clientId,
      team_member_id: selectedMemberId,
      assignment_role: selectedRole,
      notes: notes || null,
    })

    setIsLoading(false)

    if (result.success) {
      setIsAddDialogOpen(false)
      setSelectedMemberId('')
      setSelectedRole('primary')
      setNotes('')
      router.refresh()
    }
  }

  const handleRemove = async (assignmentId: string) => {
    setIsLoading(true)
    await removeClientAssignment(assignmentId)
    setIsLoading(false)
    router.refresh()
  }

  const handleChangeRole = async (
    assignmentId: string,
    newRole: AssignmentRole
  ) => {
    setIsLoading(true)
    await updateClientAssignment(assignmentId, { assignment_role: newRole })
    setIsLoading(false)
    router.refresh()
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Care Team
        </CardTitle>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" disabled={unassignedMembers.length === 0}>
              <UserPlus className="mr-2 h-4 w-4" />
              Assign Provider
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Provider</DialogTitle>
              <DialogDescription>
                Add a team member to this client&apos;s care team.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Team Member</Label>
                <Select
                  value={selectedMemberId}
                  onValueChange={setSelectedMemberId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {unassignedMembers.map(member => (
                      <SelectItem key={member.id} value={member.id}>
                        <div className="flex items-center gap-2">
                          <span>{member.display_name}</span>
                          {member.title && (
                            <span className="text-muted-foreground">
                              ({member.title})
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={selectedRole}
                  onValueChange={(v: AssignmentRole) => setSelectedRole(v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="primary">
                      Primary - Main provider for this client
                    </SelectItem>
                    <SelectItem value="backup">
                      Backup - On-call backup (for births)
                    </SelectItem>
                    <SelectItem value="support">
                      Support - Additional support provider
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Textarea
                  placeholder="e.g., Backup for birth only, Lactation support"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAssign}
                disabled={!selectedMemberId || isLoading}
              >
                {isLoading ? 'Assigning...' : 'Assign Provider'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {assignments.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <User className="mx-auto h-12 w-12 opacity-50" />
            <p className="mt-2">No providers assigned</p>
            <p className="text-sm">
              Assign a team member to start managing this client&apos;s care.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {assignments.map(assignment => {
              const member = assignment.team_member
              if (!member) return null

              return (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
                      {member.display_name
                        .split(' ')
                        .map(n => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {member.display_name}
                        </span>
                        <Badge
                          variant="secondary"
                          className={roleColors[assignment.assignment_role]}
                        >
                          {roleLabels[assignment.assignment_role]}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {member.title || member.email}
                      </p>
                      {assignment.notes && (
                        <p className="text-xs text-muted-foreground italic">
                          {assignment.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" disabled={isLoading}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {assignment.assignment_role !== 'primary' && (
                        <DropdownMenuItem
                          onClick={() =>
                            handleChangeRole(assignment.id, 'primary')
                          }
                        >
                          Make Primary
                        </DropdownMenuItem>
                      )}
                      {assignment.assignment_role !== 'backup' && (
                        <DropdownMenuItem
                          onClick={() =>
                            handleChangeRole(assignment.id, 'backup')
                          }
                        >
                          Make Backup
                        </DropdownMenuItem>
                      )}
                      {assignment.assignment_role !== 'support' && (
                        <DropdownMenuItem
                          onClick={() =>
                            handleChangeRole(assignment.id, 'support')
                          }
                        >
                          Make Support
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleRemove(assignment.id)}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
