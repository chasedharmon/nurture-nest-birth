'use client'

/**
 * AdminMessageNotifications
 *
 * Client component that handles message notifications for admin users.
 * Should be placed in admin pages to show toast notifications.
 */

import { useMessageNotifications } from '@/lib/hooks/use-message-notifications'
import { MessageToastContainer } from '@/components/ui/message-toast'

interface AdminMessageNotificationsProps {
  userId: string
}

export function AdminMessageNotifications({
  userId,
}: AdminMessageNotificationsProps) {
  const { notifications, dismissNotification } = useMessageNotifications({
    userId,
  })

  return (
    <MessageToastContainer
      notifications={notifications}
      onDismiss={dismissNotification}
      basePath="/admin/messages"
    />
  )
}
