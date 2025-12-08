'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import type { TeamMember, TeamMemberRole } from '@/lib/supabase/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, UserCheck, UserX, Pencil } from 'lucide-react'
import { deactivateTeamMember, reactivateTeamMember } from '@/app/actions/team'
import { EditTeamMemberDialog } from './edit-team-member-dialog'

interface TeamMembersTableProps {
  members: TeamMember[]
}

const roleColors: Record<TeamMemberRole, string> = {
  owner: 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300',
  admin:
    'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300',
  provider: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
  assistant: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300',
}

const roleLabels: Record<TeamMemberRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  provider: 'Provider',
  assistant: 'Assistant',
}

export function TeamMembersTable({ members }: TeamMembersTableProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)

  const handleToggleActive = async (member: TeamMember) => {
    setIsLoading(member.id)
    try {
      if (member.is_active) {
        await deactivateTeamMember(member.id)
      } else {
        await reactivateTeamMember(member.id)
      }
      router.refresh()
    } finally {
      setIsLoading(null)
    }
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Added</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {members.map(member => (
              <tr
                key={member.id}
                className={`hover:bg-muted/50 transition-colors ${
                  !member.is_active ? 'opacity-60' : ''
                }`}
              >
                <td className="px-4 py-4">
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
                      <p className="font-medium">{member.display_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {member.email}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <Badge
                    variant="secondary"
                    className={roleColors[member.role]}
                  >
                    {roleLabels[member.role]}
                  </Badge>
                </td>
                <td className="px-4 py-4 text-muted-foreground">
                  {member.title || '—'}
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-col gap-1">
                    <Badge
                      variant={member.is_active ? 'default' : 'secondary'}
                      className={
                        member.is_active
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                          : ''
                      }
                    >
                      {member.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    {member.is_active && member.is_accepting_clients && (
                      <span className="text-xs text-green-600">
                        Accepting clients
                      </span>
                    )}
                    {member.is_active && member.is_available_oncall && (
                      <span className="text-xs text-blue-600">
                        Available on-call
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4 text-sm">
                  {member.phone ? (
                    <a
                      href={`tel:${member.phone}`}
                      className="text-primary hover:underline"
                    >
                      {member.phone}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-4 text-muted-foreground">
                  {formatDistanceToNow(new Date(member.created_at), {
                    addSuffix: true,
                  })}
                </td>
                <td className="px-4 py-4 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isLoading === member.id}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => setEditingMember(member)}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleToggleActive(member)}
                      >
                        {member.is_active ? (
                          <>
                            <UserX className="mr-2 h-4 w-4" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <UserCheck className="mr-2 h-4 w-4" />
                            Reactivate
                          </>
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingMember && (
        <EditTeamMemberDialog
          member={editingMember}
          open={!!editingMember}
          onOpenChange={open => !open && setEditingMember(null)}
        />
      )}
    </>
  )
}
