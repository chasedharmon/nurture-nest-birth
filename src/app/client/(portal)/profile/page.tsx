import { getClientSession } from '@/app/actions/client-auth'
import { getNotificationPreferences } from '@/app/actions/notifications'
import { createAdminClient } from '@/lib/supabase/server'
import { ProfileEditor } from '@/components/client/profile-editor'
import { NotificationPreferences } from '@/components/client/notification-preferences'

export default async function ClientProfilePage() {
  const session = await getClientSession()

  if (!session) {
    return null
  }

  // Fetch full client details - use admin client to bypass RLS
  const supabase = createAdminClient()
  const [clientResult, notificationPrefs] = await Promise.all([
    supabase.from('leads').select('*').eq('id', session.clientId).single(),
    getNotificationPreferences(session.clientId),
  ])

  const client = clientResult.data

  if (!client) {
    return (
      <div className="text-center py-12">
        <p className="text-stone-600">
          Unable to load profile. Please try again.
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fdfbf7] via-[#f8f4ec] to-[#f5f0e8]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <ProfileEditor client={client} />
        <NotificationPreferences
          clientId={session.clientId}
          initialPreferences={{
            meeting_reminders: notificationPrefs.meeting_reminders ?? true,
            document_notifications:
              notificationPrefs.document_notifications ?? true,
            payment_reminders: notificationPrefs.payment_reminders ?? true,
            marketing_emails: notificationPrefs.marketing_emails ?? false,
          }}
        />
      </div>
    </div>
  )
}
