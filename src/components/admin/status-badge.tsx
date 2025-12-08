import type { LeadStatus } from '@/lib/supabase/types'

interface StatusBadgeProps {
  status: LeadStatus
  className?: string
}

const statusConfig = {
  new: {
    label: 'New',
    className: 'bg-secondary/10 text-secondary',
  },
  contacted: {
    label: 'Contacted',
    className: 'bg-secondary/10 text-secondary',
  },
  scheduled: {
    label: 'Scheduled',
    className: 'bg-primary/10 text-primary',
  },
  client: {
    label: 'Client',
    className: 'bg-primary/10 text-primary',
  },
  lost: {
    label: 'Lost',
    className: 'bg-muted text-muted-foreground',
  },
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className} ${className}`}
    >
      {config.label}
    </span>
  )
}
