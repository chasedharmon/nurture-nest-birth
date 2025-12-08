'use client'

import { format } from 'date-fns'
import type { OnCallSchedule } from '@/lib/supabase/types'
import { Badge } from '@/components/ui/badge'
import { Phone } from 'lucide-react'

interface OnCallBadgeProps {
  schedule: OnCallSchedule
}

export function OnCallBadge({ schedule }: OnCallBadgeProps) {
  const teamMember = schedule.team_member
  const phone = teamMember?.oncall_phone || teamMember?.phone

  return (
    <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 dark:border-green-800 dark:bg-green-900/20">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-300">
        <Phone className="h-5 w-5" />
      </div>
      <div>
        <div className="flex items-center gap-2">
          <span className="font-medium">{teamMember?.display_name}</span>
          <Badge
            variant="secondary"
            className={
              schedule.oncall_type === 'primary'
                ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200'
                : 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200'
            }
          >
            {schedule.oncall_type === 'primary' ? 'Primary' : 'Backup'}
          </Badge>
        </div>
        <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
          {phone && (
            <a
              href={`tel:${phone}`}
              className="text-green-700 hover:underline dark:text-green-400"
            >
              {phone}
            </a>
          )}
          <span>
            {format(new Date(schedule.start_date), 'MMM d')} -{' '}
            {format(new Date(schedule.end_date), 'MMM d')}
          </span>
        </div>
      </div>
    </div>
  )
}
