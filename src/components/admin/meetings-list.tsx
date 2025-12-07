'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import type { Meeting } from '@/lib/supabase/types'
import {
  deleteMeeting,
  updateMeetingStatus,
  completeMeeting,
} from '@/app/actions/meetings'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select-native'
import { AddMeetingForm } from './add-meeting-form'

interface MeetingsListProps {
  meetings: Meeting[]
  clientId: string
}

const meetingTypeLabels: Record<string, string> = {
  consultation: 'Consultation',
  prenatal: 'Prenatal Visit',
  birth: 'Birth Support',
  postpartum: 'Postpartum Visit',
  follow_up: 'Follow-up',
  other: 'Meeting',
}

const meetingStatusColors: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
  completed:
    'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
  cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300',
  no_show: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
}

const meetingStatuses = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'no_show', label: 'No Show' },
]

export function MeetingsList({ meetings, clientId }: MeetingsListProps) {
  const now = new Date()
  const upcomingMeetings = meetings.filter(
    m => m.status === 'scheduled' && new Date(m.scheduled_at) > now
  )
  const pastMeetings = meetings.filter(
    m => m.status !== 'scheduled' || new Date(m.scheduled_at) <= now
  )

  return (
    <div className="space-y-6">
      <AddMeetingForm clientId={clientId} />

      {meetings.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">
          <p>No meetings scheduled yet</p>
          <p className="text-sm mt-1">Schedule a consultation to get started</p>
        </div>
      ) : (
        <>
          {upcomingMeetings.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Upcoming Meetings</h3>
              <div className="space-y-3">
                {upcomingMeetings.map(meeting => (
                  <MeetingCard key={meeting.id} meeting={meeting} isUpcoming />
                ))}
              </div>
            </div>
          )}

          {pastMeetings.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Past Meetings</h3>
              <div className="space-y-3">
                {pastMeetings.map(meeting => (
                  <MeetingCard key={meeting.id} meeting={meeting} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function MeetingCard({
  meeting,
  isUpcoming = false,
}: {
  meeting: Meeting
  isUpcoming?: boolean
}) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  async function handleStatusChange(newStatus: string) {
    setIsUpdating(true)
    if (newStatus === 'completed') {
      await completeMeeting(meeting.id)
    } else {
      await updateMeetingStatus(
        meeting.id,
        newStatus as 'scheduled' | 'completed' | 'cancelled' | 'no_show'
      )
    }
    setIsUpdating(false)
  }

  async function handleDelete() {
    setIsDeleting(true)
    await deleteMeeting(meeting.id)
    setIsDeleting(false)
    setShowDeleteConfirm(false)
  }

  return (
    <div
      className={`border border-border rounded-lg p-4 ${isUpcoming ? 'bg-blue-50 dark:bg-blue-950/20' : 'hover:bg-muted/50'} transition-colors`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold">
              {meetingTypeLabels[meeting.meeting_type] || meeting.meeting_type}
            </span>
            <span
              className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${meetingStatusColors[meeting.status] || meetingStatusColors.scheduled}`}
            >
              {meeting.status}
            </span>
          </div>

          {meeting.title && (
            <p className="text-sm text-muted-foreground mt-1">
              {meeting.title}
            </p>
          )}

          <div className="mt-2 space-y-1 text-sm">
            <div>
              <span className="font-medium text-muted-foreground">When: </span>
              <span className="text-foreground">
                {format(new Date(meeting.scheduled_at), 'EEEE, MMMM d, yyyy')}
              </span>
              <span className="text-muted-foreground"> at </span>
              <span className="text-foreground">
                {format(new Date(meeting.scheduled_at), 'h:mm a')}
              </span>
            </div>

            <div>
              <span className="font-medium text-muted-foreground">
                Duration:{' '}
              </span>
              <span className="text-foreground">
                {meeting.duration_minutes} minutes
              </span>
            </div>

            {meeting.location && (
              <div>
                <span className="font-medium text-muted-foreground">
                  Location:{' '}
                </span>
                <span className="text-foreground">{meeting.location}</span>
              </div>
            )}

            {meeting.meeting_link && (
              <div>
                <span className="font-medium text-muted-foreground">
                  Link:{' '}
                </span>
                <a
                  href={meeting.meeting_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Join Meeting
                </a>
              </div>
            )}
          </div>

          {meeting.notes && (
            <div className="mt-3 p-2 bg-muted rounded text-sm">
              <p className="font-medium text-muted-foreground mb-1">Notes:</p>
              <p className="text-foreground">{meeting.notes}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 ml-4">
          <Select
            value={meeting.status}
            onChange={e => handleStatusChange(e.target.value)}
            disabled={isUpdating}
            className="text-xs h-8"
          >
            {meetingStatuses.map(status => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </Select>

          {showDeleteConfirm ? (
            <div className="flex gap-1">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-xs"
              >
                {isDeleting ? '...' : 'Yes'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
                className="text-xs"
              >
                No
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-xs text-red-600 hover:text-red-700 hover:bg-red-100"
            >
              Delete
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
