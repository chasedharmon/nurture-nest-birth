'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { MoreHorizontal, Clock, Trash2 } from 'lucide-react'
import type { TimeEntry, TimeEntryType } from '@/lib/supabase/types'
import { deleteTimeEntry } from '@/app/actions/team'

interface TimeEntriesListProps {
  entries: TimeEntry[]
  showMember?: boolean
  showClient?: boolean
}

const entryTypeLabels: Record<TimeEntryType, string> = {
  client_work: 'Client Work',
  travel: 'Travel',
  on_call: 'On-Call',
  birth_support: 'Birth Support',
  admin: 'Admin',
  training: 'Training',
  other: 'Other',
}

const entryTypeColors: Record<TimeEntryType, string> = {
  client_work:
    'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
  travel: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
  on_call:
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
  birth_support:
    'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-300',
  admin: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300',
  training:
    'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300',
  other: 'bg-slate-100 text-slate-800 dark:bg-slate-900/20 dark:text-slate-300',
}

export function TimeEntriesList({
  entries,
  showMember = true,
  showClient = true,
}: TimeEntriesListProps) {
  const router = useRouter()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!deleteId) return
    setIsDeleting(true)
    await deleteTimeEntry(deleteId)
    setIsDeleting(false)
    setDeleteId(null)
    router.refresh()
  }

  const totalHours = entries.reduce((sum, e) => sum + Number(e.hours), 0)
  const billableHours = entries
    .filter(e => e.billable)
    .reduce((sum, e) => sum + Number(e.hours), 0)

  if (entries.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        <Clock className="mx-auto h-12 w-12 opacity-50" />
        <p className="mt-2">No time entries</p>
        <p className="text-sm">Time logged will appear here.</p>
      </div>
    )
  }

  return (
    <>
      <div className="mb-4 flex gap-4 text-sm">
        <div className="rounded-md bg-muted px-3 py-2">
          <span className="text-muted-foreground">Total:</span>{' '}
          <span className="font-medium">{totalHours.toFixed(1)} hrs</span>
        </div>
        <div className="rounded-md bg-muted px-3 py-2">
          <span className="text-muted-foreground">Billable:</span>{' '}
          <span className="font-medium">{billableHours.toFixed(1)} hrs</span>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              {showMember && <TableHead>Provider</TableHead>}
              {showClient && <TableHead>Client</TableHead>}
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Hours</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map(entry => (
              <TableRow key={entry.id}>
                <TableCell className="whitespace-nowrap">
                  {format(new Date(entry.entry_date), 'MMM d, yyyy')}
                </TableCell>
                {showMember && (
                  <TableCell>
                    {(
                      entry as TimeEntry & {
                        team_member?: { display_name: string }
                      }
                    ).team_member?.display_name || '-'}
                  </TableCell>
                )}
                {showClient && (
                  <TableCell>
                    {(entry as TimeEntry & { client?: { name: string } }).client
                      ?.name || '-'}
                  </TableCell>
                )}
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={entryTypeColors[entry.entry_type]}
                  >
                    {entryTypeLabels[entry.entry_type]}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {Number(entry.hours).toFixed(1)}
                  {!entry.billable && (
                    <span className="ml-1 text-xs text-muted-foreground">
                      (NB)
                    </span>
                  )}
                </TableCell>
                <TableCell className="max-w-[200px] truncate text-muted-foreground">
                  {entry.description || '-'}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => setDeleteId(entry.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Time Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this time entry? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
