import type { LeadStatus } from '@/lib/supabase/types'

interface StatusBadgeProps {
  status: LeadStatus
  className?: string
}

const statusConfig = {
  new: {
    label: 'New',
    className:
      'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
  },
  contacted: {
    label: 'Contacted',
    className:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
  },
  scheduled: {
    label: 'Scheduled',
    className:
      'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300',
  },
  client: {
    label: 'Client',
    className:
      'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
  },
  lost: {
    label: 'Lost',
    className:
      'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300',
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
