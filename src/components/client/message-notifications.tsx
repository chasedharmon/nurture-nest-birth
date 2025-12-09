'use client'

/**
 * ClientMessageNotifications
 *
 * Client component that handles message notifications for client portal users.
 * Should be placed in client portal pages to show toast notifications.
 */

import { useMessageNotifications } from '@/lib/hooks/use-message-notifications'
import { MessageToastContainer } from '@/components/ui/message-toast'

interface ClientMessageNotificationsProps {
  clientId: string
}

export function ClientMessageNotifications({
  clientId,
}: ClientMessageNotificationsProps) {
  const { notifications, dismissNotification } = useMessageNotifications({
    clientId,
  })

  return (
    <MessageToastContainer
      notifications={notifications}
      onDismiss={dismissNotification}
      basePath="/client/messages"
    />
  )
}
