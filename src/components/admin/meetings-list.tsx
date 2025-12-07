'use client'

import { format } from 'date-fns'
import type { Meeting } from '@/lib/supabase/types'

interface MeetingsListProps {
  meetings: Meeting[]
  clientId: string
}

const meetingTypeLabels = {
  consultation: '📋 Consultation',
  prenatal: '🤰 Prenatal Visit',
  birth: '👶 Birth Support',
  postpartum: '🍼 Postpartum Visit',
  follow_up: '📞 Follow-up',
  other: '📅 Meeting',
}

const meetingStatusColors = {
  scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
  completed:
    'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
  cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300',
  no_show: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
}

export function MeetingsList({ meetings }: MeetingsListProps) {
  const now = new Date()
  const upcomingMeetings = meetings.filter(
    m => m.status === 'scheduled' && new Date(m.scheduled_at) > now
  )
  const pastMeetings = meetings.filter(
    m => m.status !== 'scheduled' || new Date(m.scheduled_at) <= now
  )

  if (meetings.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        <p>No meetings scheduled yet</p>
        <p className="text-sm mt-1">Schedule a consultation to get started</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
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
  return (
    <div
      className={`border border-border rounded-lg p-4 ${isUpcoming ? 'bg-blue-50 dark:bg-blue-950/20' : 'hover:bg-muted/50'} transition-colors`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-lg">
              {meetingTypeLabels[meeting.meeting_type]}
            </span>
            <span
              className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${meetingStatusColors[meeting.status]}`}
            >
              {meeting.status}
            </span>
          </div>

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
          </div>

          {meeting.preparation_notes && (
            <div className="mt-3 p-2 bg-muted rounded text-sm">
              <p className="font-medium text-muted-foreground mb-1">
                Preparation Notes:
              </p>
              <p className="text-foreground">{meeting.preparation_notes}</p>
            </div>
          )}

          {meeting.meeting_notes && (
            <div className="mt-3 p-2 bg-muted rounded text-sm">
              <p className="font-medium text-muted-foreground mb-1">
                Meeting Notes:
              </p>
              <p className="text-foreground">{meeting.meeting_notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
