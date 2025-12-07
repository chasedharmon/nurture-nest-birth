import { formatDistanceToNow } from 'date-fns'
import type { LeadActivity } from '@/lib/supabase/types'

interface ActivityTimelineProps {
  activities: LeadActivity[]
}

const activityIcons: Record<string, string> = {
  note: '📝',
  email_sent: '📧',
  call: '📞',
  meeting: '🤝',
  status_change: '🔄',
  system: '⚙️',
}

const activityLabels: Record<string, string> = {
  note: 'Note',
  email_sent: 'Email Sent',
  call: 'Call',
  meeting: 'Meeting',
  status_change: 'Status Change',
  system: 'System',
}

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No activities yet</p>
        <p className="text-sm mt-1">
          Add notes or update the status to create activity history
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {activities.map(activity => (
        <div key={activity.id} className="flex gap-4">
          <div className="flex-shrink-0 text-2xl">
            {activityIcons[activity.activity_type]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">
                {activityLabels[activity.activity_type]}
              </p>
              <p className="text-xs text-muted-foreground whitespace-nowrap">
                {formatDistanceToNow(new Date(activity.created_at), {
                  addSuffix: true,
                })}
              </p>
            </div>
            <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
              {activity.content}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
