'use client'

/**
 * MessageNotificationProvider
 *
 * Provides global message notifications across the app.
 * Wraps the application to show toast notifications for new messages.
 */

import { useMessageNotifications } from '@/lib/hooks/use-message-notifications'
import { MessageToastContainer } from '@/components/ui/message-toast'

interface MessageNotificationProviderProps {
  children: React.ReactNode
  userId?: string
  clientId?: string
  /** Base path for navigation (e.g., '/admin/messages' or '/client/messages') */
  basePath?: string
}

export function MessageNotificationProvider({
  children,
  userId,
  clientId,
  basePath = '/admin/messages',
}: MessageNotificationProviderProps) {
  const { notifications, dismissNotification } = useMessageNotifications({
    userId,
    clientId,
  })

  return (
    <>
      {children}
      <MessageToastContainer
        notifications={notifications}
        onDismiss={dismissNotification}
        basePath={basePath}
      />
    </>
  )
}
