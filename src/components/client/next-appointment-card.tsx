'use client'

import { Calendar, MapPin, Video, Clock, User } from 'lucide-react'
import { format, formatDistanceToNow, isToday, isTomorrow } from 'date-fns'
import type { Meeting } from '@/lib/supabase/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface NextAppointmentCardProps {
  meeting: Meeting | null
  providerName?: string
  className?: string
}

const MEETING_TYPE_LABELS: Record<string, string> = {
  consultation: 'Consultation',
  prenatal: 'Prenatal Visit',
  birth: 'Birth Support',
  postpartum: 'Postpartum Visit',
  follow_up: 'Follow Up',
  other: 'Meeting',
}

export function NextAppointmentCard({
  meeting,
  providerName,
  className,
}: NextAppointmentCardProps) {
  if (!meeting) {
    return (
      <Card className={cn('', className)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Next Appointment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-6 text-center text-muted-foreground">
            <Calendar className="mx-auto h-10 w-10 opacity-40" />
            <p className="mt-3 text-sm">No upcoming appointments</p>
            <Button variant="outline" size="sm" className="mt-4">
              Schedule a Meeting
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const meetingDate = new Date(meeting.scheduled_at)
  const isVirtual = !!meeting.meeting_link
  const typeLabel = MEETING_TYPE_LABELS[meeting.meeting_type] || 'Meeting'

  // Format the date display
  let dateDisplay: string
  if (isToday(meetingDate)) {
    dateDisplay = 'Today'
  } else if (isTomorrow(meetingDate)) {
    dateDisplay = 'Tomorrow'
  } else {
    dateDisplay = format(meetingDate, 'EEEE, MMMM d')
  }

  const timeDisplay = format(meetingDate, 'h:mm a')
  const relativeTime = formatDistanceToNow(meetingDate, { addSuffix: true })

  // Generate calendar URL (Google Calendar)
  const generateCalendarUrl = () => {
    const title = encodeURIComponent(meeting.title || typeLabel)
    const details = encodeURIComponent(meeting.description || '')
    const location = encodeURIComponent(
      isVirtual ? meeting.meeting_link || 'Virtual' : meeting.location || ''
    )
    const startDate = meetingDate.toISOString().replace(/-|:|\.\d\d\d/g, '')
    const endDate = new Date(
      meetingDate.getTime() + (meeting.duration_minutes || 60) * 60000
    )
      .toISOString()
      .replace(/-|:|\.\d\d\d/g, '')

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${startDate}/${endDate}`
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-2 bg-primary/5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Next Appointment</CardTitle>
          <Badge variant="secondary">{relativeTime}</Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {/* Meeting Type */}
        <div className="mb-4">
          <Badge className="text-sm">{typeLabel}</Badge>
          {meeting.title && meeting.title !== typeLabel && (
            <p className="mt-1 text-lg font-medium">{meeting.title}</p>
          )}
        </div>

        {/* Date and Time */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">{dateDisplay}</p>
              <p className="text-sm text-muted-foreground">{timeDisplay}</p>
            </div>
          </div>

          {/* Duration */}
          {meeting.duration_minutes && (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <Clock className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm">{meeting.duration_minutes} minutes</p>
            </div>
          )}

          {/* Location */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              {isVirtual ? (
                <Video className="h-5 w-5 text-muted-foreground" />
              ) : (
                <MapPin className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div>
              <p className="text-sm">
                {isVirtual ? 'Virtual Meeting' : meeting.location || 'TBD'}
              </p>
              {isVirtual && meeting.meeting_link && (
                <a
                  href={meeting.meeting_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  Join meeting link
                </a>
              )}
            </div>
          </div>

          {/* Provider */}
          {providerName && (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <User className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm">With {providerName}</p>
            </div>
          )}
        </div>

        {/* Preparation notes */}
        {meeting.preparation_notes && (
          <div className="mt-4 rounded-lg bg-muted/50 p-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              How to prepare
            </p>
            <p className="mt-1 text-sm">{meeting.preparation_notes}</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-4 flex gap-2">
          <a
            href={generateCalendarUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1"
          >
            <Button variant="outline" className="w-full" size="sm">
              <Calendar className="mr-2 h-4 w-4" />
              Add to Calendar
            </Button>
          </a>
          {isVirtual && meeting.meeting_link && (
            <a
              href={meeting.meeting_link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1"
            >
              <Button className="w-full" size="sm">
                <Video className="mr-2 h-4 w-4" />
                Join Meeting
              </Button>
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
