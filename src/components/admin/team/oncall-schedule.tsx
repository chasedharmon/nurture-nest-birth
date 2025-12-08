'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format, isWithinInterval, parseISO } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import { Phone, Plus, Trash2, Calendar } from 'lucide-react'
import type {
  OnCallSchedule,
  OnCallType,
  TeamMember,
} from '@/lib/supabase/types'
import { createOnCallSchedule, deleteOnCallSchedule } from '@/app/actions/team'

interface OnCallScheduleManagerProps {
  schedules: OnCallSchedule[]
  teamMembers: TeamMember[]
}

export function OnCallScheduleManager({
  schedules,
  teamMembers,
}: OnCallScheduleManagerProps) {
  const router = useRouter()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getToday = () => new Date().toISOString().split('T')[0] as string

  const [formData, setFormData] = useState({
    team_member_id: '',
    start_date: getToday(),
    end_date: '',
    oncall_type: 'primary' as OnCallType,
    notes: '',
  })

  const availableMembers = teamMembers.filter(
    m => m.is_active && m.is_available_oncall
  )

  const today = new Date()
  const currentOnCall = schedules.filter(s => {
    const start = parseISO(s.start_date)
    const end = parseISO(s.end_date)
    return isWithinInterval(today, { start, end })
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    const startDate = formData.start_date || getToday()
    if (!formData.end_date || formData.end_date < startDate) {
      setError('End date must be after start date')
      setIsLoading(false)
      return
    }

    const result = await createOnCallSchedule({
      team_member_id: formData.team_member_id,
      start_date: startDate,
      end_date: formData.end_date,
      oncall_type: formData.oncall_type,
      notes: formData.notes || null,
    })

    setIsLoading(false)

    if (result.success) {
      setIsAddDialogOpen(false)
      setFormData({
        team_member_id: '',
        start_date: getToday(),
        end_date: '',
        oncall_type: 'primary',
        notes: '',
      })
      router.refresh()
    } else {
      setError(result.error || 'Failed to create schedule')
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setIsLoading(true)
    await deleteOnCallSchedule(deleteId)
    setIsLoading(false)
    setDeleteId(null)
    router.refresh()
  }

  const getMemberName = (memberId: string) => {
    return teamMembers.find(m => m.id === memberId)?.display_name || 'Unknown'
  }

  const getMemberPhone = (memberId: string) => {
    const member = teamMembers.find(m => m.id === memberId)
    return member?.oncall_phone || member?.phone || null
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5" />
          On-Call Schedule
        </CardTitle>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" disabled={availableMembers.length === 0}>
              <Plus className="mr-2 h-4 w-4" />
              Add Schedule
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Add On-Call Schedule</DialogTitle>
                <DialogDescription>
                  Schedule a team member for on-call coverage.
                </DialogDescription>
              </DialogHeader>

              {error && (
                <div className="my-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Provider</Label>
                  <Select
                    value={formData.team_member_id}
                    onValueChange={v =>
                      setFormData(prev => ({ ...prev, team_member_id: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableMembers.map(member => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.display_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={formData.start_date}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          start_date: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={formData.end_date}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          end_date: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={formData.oncall_type}
                    onValueChange={(v: OnCallType) =>
                      setFormData(prev => ({ ...prev, oncall_type: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="primary">
                        Primary - First responder
                      </SelectItem>
                      <SelectItem value="backup">
                        Backup - If primary unavailable
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Notes (optional)</Label>
                  <Input
                    placeholder="e.g., Available after 6pm"
                    value={formData.notes}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, notes: e.target.value }))
                    }
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    isLoading || !formData.team_member_id || !formData.end_date
                  }
                >
                  {isLoading ? 'Adding...' : 'Add Schedule'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {/* Current On-Call Display */}
        {currentOnCall.length > 0 && (
          <div className="mb-6 rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
            <h4 className="mb-2 font-medium text-green-800 dark:text-green-300">
              Currently On-Call
            </h4>
            <div className="space-y-2">
              {currentOnCall.map(schedule => (
                <div
                  key={schedule.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        schedule.oncall_type === 'primary'
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {schedule.oncall_type === 'primary'
                        ? 'Primary'
                        : 'Backup'}
                    </Badge>
                    <span className="font-medium">
                      {getMemberName(schedule.team_member_id)}
                    </span>
                  </div>
                  {getMemberPhone(schedule.team_member_id) && (
                    <a
                      href={`tel:${getMemberPhone(schedule.team_member_id)}`}
                      className="flex items-center gap-1 text-sm text-green-700 hover:underline dark:text-green-400"
                    >
                      <Phone className="h-3 w-3" />
                      {getMemberPhone(schedule.team_member_id)}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {availableMembers.length === 0 && (
          <div className="mb-4 rounded-md bg-yellow-50 p-3 text-sm text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
            No team members are marked as available for on-call. Edit team
            members to enable on-call availability.
          </div>
        )}

        {/* Schedule Table */}
        {schedules.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <Calendar className="mx-auto h-12 w-12 opacity-50" />
            <p className="mt-2">No on-call schedules</p>
            <p className="text-sm">
              Add a schedule to track who is on-call for births.
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>End</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.map(schedule => {
                  const isActive = isWithinInterval(today, {
                    start: parseISO(schedule.start_date),
                    end: parseISO(schedule.end_date),
                  })
                  return (
                    <TableRow
                      key={schedule.id}
                      className={
                        isActive ? 'bg-green-50/50 dark:bg-green-900/10' : ''
                      }
                    >
                      <TableCell className="font-medium">
                        {getMemberName(schedule.team_member_id)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            schedule.oncall_type === 'primary'
                              ? 'default'
                              : 'secondary'
                          }
                        >
                          {schedule.oncall_type === 'primary'
                            ? 'Primary'
                            : 'Backup'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(parseISO(schedule.start_date), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        {format(parseISO(schedule.end_date), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {schedule.notes || '-'}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteId(schedule.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Schedule</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this on-call schedule?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
