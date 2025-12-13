'use client'

import { useState } from 'react'
import Link from 'next/link'
import { X, Clock, AlertTriangle, Ban } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { type TrialStatus } from '@/lib/trial/utils'
import { cn } from '@/lib/utils'

interface TrialBannerProps {
  trialStatus: TrialStatus
  className?: string
  dismissible?: boolean
}

export function TrialBanner({
  trialStatus,
  className,
  dismissible = true,
}: TrialBannerProps) {
  const [dismissed, setDismissed] = useState(false)

  // Don't show banner if not trialing or dismissed
  if (!trialStatus.isTrialing || dismissed) {
    return null
  }

  // Determine banner variant based on urgency
  const isUrgent = trialStatus.daysRemaining <= 3 || trialStatus.isExpired
  const isBlocked = trialStatus.isFullyExpired

  // Choose icon
  const Icon = isBlocked ? Ban : trialStatus.isExpired ? AlertTriangle : Clock

  // Determine styling
  const bannerStyles = cn(
    'flex items-center justify-between gap-4 rounded-lg px-4 py-3',
    {
      'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200':
        !isUrgent && !trialStatus.isExpired,
      'bg-orange-50 border-orange-200 text-orange-800 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-200':
        isUrgent && !trialStatus.isExpired,
      'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200':
        trialStatus.isExpired,
    },
    className
  )

  return (
    <Alert className={bannerStyles}>
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 flex-shrink-0" />
        <AlertDescription className="text-sm font-medium">
          {trialStatus.message}
        </AlertDescription>
      </div>

      <div className="flex items-center gap-2">
        <Button asChild size="sm" variant={isUrgent ? 'default' : 'outline'}>
          <Link href="/admin/setup/billing">
            {isBlocked ? 'Upgrade Now' : 'View Plans'}
          </Link>
        </Button>

        {dismissible && !trialStatus.isFullyExpired && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDismissed(true)}
            className="h-8 w-8 p-0"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </Alert>
  )
}
