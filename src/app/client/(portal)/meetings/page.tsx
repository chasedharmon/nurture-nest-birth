import {
  getClientSession,
  getClientAccessLevel,
} from '@/app/actions/client-auth'
import { getPortalMeetings } from '@/app/actions/portal-crm-data'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { format, isPast, isToday, isTomorrow } from 'date-fns'
import Link from 'next/link'
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  Phone,
  CheckCircle2,
  XCircle,
  ExternalLink,
} from 'lucide-react'

const activityTypeIcons: Record<string, React.ReactNode> = {
  event: <Calendar className="h-5 w-5" />,
  call: <Phone className="h-5 w-5" />,
}

const statusColors: Record<string, string> = {
  open: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  completed:
    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
}

function getDateLabel(dateString: string): string | null {
  const date = new Date(dateString)
  if (isToday(date)) return 'Today'
  if (isTomorrow(date)) return 'Tomorrow'
  return null
}

export default async function ClientMeetingsPage() {
  const session = await getClientSession()

  if (!session) {
    return null
  }

  const accessLevel = await getClientAccessLevel()

  // Leads don't have access to meetings
  if (accessLevel === 'limited') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Your Meetings</h1>
          <p className="text-muted-foreground mt-2">
            View and manage your scheduled appointments
          </p>
        </div>

        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-8 text-center">
            <Calendar className="h-12 w-12 mx-auto text-primary/50 mb-4" />
            <h2 className="text-lg font-semibold mb-2">Meetings Coming Soon</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Once you become a client, you&apos;ll be able to see your
              scheduled meetings and appointments here.
            </p>
            <Link href="/client/dashboard" className="mt-4 inline-block">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Fetch all meetings (not just upcoming)
  const allMeetingsResult = await getPortalMeetings()
  const allMeetings = allMeetingsResult.data || []

  const upcomingMeetings = allMeetings
    .filter(m => {
      const meetingDate = m.dueDateTime || m.dueDate
      return (
        m.status === 'open' && meetingDate && !isPast(new Date(meetingDate))
      )
    })
    .sort((a, b) => {
      const dateA = a.dueDateTime || a.dueDate || ''
      const dateB = b.dueDateTime || b.dueDate || ''
      return new Date(dateA).getTime() - new Date(dateB).getTime()
    })

  const pastMeetings = allMeetings
    .filter(m => {
      const meetingDate = m.dueDateTime || m.dueDate
      return (
        m.status !== 'open' || (meetingDate && isPast(new Date(meetingDate)))
      )
    })
    .sort((a, b) => {
      const dateA = a.dueDateTime || a.dueDate || ''
      const dateB = b.dueDateTime || b.dueDate || ''
      return new Date(dateB).getTime() - new Date(dateA).getTime()
    })

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
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-600" />
          Upcoming Meetings
        </h2>
        {upcomingMeetings.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Calendar className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">
                You don&apos;t have any upcoming meetings scheduled.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {upcomingMeetings.map(meeting => {
              const meetingDate = meeting.dueDateTime || meeting.dueDate
              const dateLabel = meetingDate ? getDateLabel(meetingDate) : null

              return (
                <Card
                  key={meeting.id}
                  className="bg-blue-50/50 border-blue-200/50 dark:bg-blue-900/10 dark:border-blue-900/30"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-700 dark:text-blue-400">
                          {activityTypeIcons[meeting.activityType] ||
                            activityTypeIcons.event}
                        </div>
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {meeting.subject}
                            {dateLabel && (
                              <Badge
                                variant="secondary"
                                className="bg-blue-600 text-white"
                              >
                                {dateLabel}
                              </Badge>
                            )}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {meetingDate
                              ? meeting.isAllDay
                                ? format(
                                    new Date(meetingDate),
                                    'EEEE, MMMM d, yyyy'
                                  )
                                : format(
                                    new Date(meetingDate),
                                    'EEEE, MMMM d, yyyy • h:mm a'
                                  )
                              : 'Date TBD'}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge className={statusColors.open}>Scheduled</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {meeting.location && (
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">
                              Location
                            </p>
                            <p className="text-foreground">
                              {meeting.location}
                            </p>
                          </div>
                        </div>
                      )}

                      {meeting.meetingLink && (
                        <div className="flex items-start gap-2">
                          <Video className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">
                              Virtual Meeting
                            </p>
                            <a
                              href={meeting.meetingLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline inline-flex items-center gap-1"
                            >
                              Join Meeting
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        </div>
                      )}
                    </div>

                    {meeting.description && (
                      <div className="pt-3 border-t">
                        <p className="text-sm font-medium text-muted-foreground mb-2">
                          Details
                        </p>
                        <p className="text-sm text-foreground whitespace-pre-wrap">
                          {meeting.description}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Past Meetings */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
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
            {pastMeetings.map(meeting => {
              const meetingDate = meeting.dueDateTime || meeting.dueDate

              return (
                <Card key={meeting.id} className="opacity-80">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-muted rounded-lg text-muted-foreground">
                          {activityTypeIcons[meeting.activityType] ||
                            activityTypeIcons.event}
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            {meeting.subject}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {meetingDate
                              ? meeting.isAllDay
                                ? format(new Date(meetingDate), 'MMMM d, yyyy')
                                : format(
                                    new Date(meetingDate),
                                    'MMMM d, yyyy • h:mm a'
                                  )
                              : 'Date not set'}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge
                        className={
                          statusColors[meeting.status] || statusColors.completed
                        }
                      >
                        {meeting.status === 'completed' && (
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                        )}
                        {meeting.status === 'cancelled' && (
                          <XCircle className="h-3 w-3 mr-1" />
                        )}
                        {meeting.status.charAt(0).toUpperCase() +
                          meeting.status.slice(1)}
                      </Badge>
                    </div>
                  </CardHeader>
                  {(meeting.description || meeting.location) && (
                    <CardContent>
                      {meeting.location && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <MapPin className="h-4 w-4" />
                          {meeting.location}
                        </div>
                      )}
                      {meeting.description && (
                        <div className="pt-3 border-t">
                          <p className="text-sm font-medium text-muted-foreground mb-2">
                            Meeting Summary
                          </p>
                          <p className="text-sm text-foreground whitespace-pre-wrap">
                            {meeting.description}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
