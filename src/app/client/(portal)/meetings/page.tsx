import { getClientSession } from '@/app/actions/client-auth'
import { getClientMeetings } from '@/app/actions/meetings'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { format } from 'date-fns'

const meetingTypeIcons = {
  consultation: '📋',
  prenatal: '📞',
  birth: '👶',
  postpartum: '🍼',
  follow_up: '💬',
  other: '📅',
}

const meetingTypeLabels = {
  consultation: 'Initial Consultation',
  prenatal: 'Prenatal Visit',
  birth: 'Birth Support',
  postpartum: 'Postpartum Visit',
  follow_up: 'Follow-up Meeting',
  other: 'Meeting',
}

const meetingStatusColors = {
  scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
  completed:
    'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
  no_show: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300',
}

export default async function ClientMeetingsPage() {
  const session = await getClientSession()

  if (!session) {
    return null
  }

  const allMeetingsResult = await getClientMeetings(session.clientId)
  const allMeetings = Array.isArray(allMeetingsResult) ? allMeetingsResult : []

  const now = new Date()
  const upcomingMeetings = allMeetings
    .filter(m => m.status === 'scheduled' && new Date(m.scheduled_at) > now)
    .sort(
      (a, b) =>
        new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
    )

  const pastMeetings = allMeetings
    .filter(m => m.status !== 'scheduled' || new Date(m.scheduled_at) <= now)
    .sort(
      (a, b) =>
        new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime()
    )

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Your Meetings</h1>
        <p className="text-muted-foreground mt-2">
          View and manage your scheduled appointments
        </p>
      </div>

      {/* Upcoming Meetings */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">
          Upcoming Meetings
        </h2>
        {upcomingMeetings.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                You don&apos;t have any upcoming meetings scheduled.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {upcomingMeetings.map(meeting => (
              <Card
                key={meeting.id}
                className="bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">
                        {meetingTypeIcons[
                          meeting.meeting_type as keyof typeof meetingTypeIcons
                        ] || meetingTypeIcons.other}
                      </span>
                      <div>
                        <CardTitle>
                          {meetingTypeLabels[
                            meeting.meeting_type as keyof typeof meetingTypeLabels
                          ] || meetingTypeLabels.other}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {format(
                            new Date(meeting.scheduled_at),
                            'EEEE, MMMM d, yyyy • h:mm a'
                          )}
                        </CardDescription>
                      </div>
                    </div>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${meetingStatusColors[meeting.status as keyof typeof meetingStatusColors] || meetingStatusColors.no_show}`}
                    >
                      {meeting.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {meeting.duration_minutes && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Duration
                      </p>
                      <p className="text-foreground">
                        {meeting.duration_minutes} minutes
                      </p>
                    </div>
                  )}

                  {meeting.location && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Location
                      </p>
                      <p className="text-foreground">{meeting.location}</p>
                    </div>
                  )}

                  {meeting.preparation_notes && (
                    <div className="pt-3 border-t">
                      <p className="text-sm font-medium text-muted-foreground mb-2">
                        Preparation Notes
                      </p>
                      <p className="text-sm text-foreground whitespace-pre-wrap">
                        {meeting.preparation_notes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Past Meetings */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">
          Past Meetings
        </h2>
        {pastMeetings.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                No past meetings to display.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {pastMeetings.map(meeting => (
              <Card key={meeting.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl opacity-70">
                        {meetingTypeIcons[
                          meeting.meeting_type as keyof typeof meetingTypeIcons
                        ] || meetingTypeIcons.other}
                      </span>
                      <div>
                        <CardTitle className="text-lg">
                          {meetingTypeLabels[
                            meeting.meeting_type as keyof typeof meetingTypeLabels
                          ] || meetingTypeLabels.other}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {format(
                            new Date(meeting.scheduled_at),
                            'MMMM d, yyyy • h:mm a'
                          )}
                        </CardDescription>
                      </div>
                    </div>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${meetingStatusColors[meeting.status as keyof typeof meetingStatusColors] || meetingStatusColors.no_show}`}
                    >
                      {meeting.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </CardHeader>
                {meeting.meeting_notes && (
                  <CardContent>
                    <div className="pt-3 border-t">
                      <p className="text-sm font-medium text-muted-foreground mb-2">
                        Meeting Summary
                      </p>
                      <p className="text-sm text-foreground whitespace-pre-wrap">
                        {meeting.meeting_notes}
                      </p>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
