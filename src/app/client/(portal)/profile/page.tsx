import {
  getClientSession,
  getClientAccessLevel,
} from '@/app/actions/client-auth'
import {
  getPortalProfile,
  getPortalAccount,
} from '@/app/actions/portal-crm-data'
import { getNotificationPreferences } from '@/app/actions/notifications'
import { ProfileEditor } from '@/components/client/profile-editor'
import { NotificationPreferences } from '@/components/client/notification-preferences'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { User, Mail, Phone, Calendar, Briefcase } from 'lucide-react'
import { format } from 'date-fns'

export default async function ClientProfilePage() {
  const session = await getClientSession()

  if (!session) {
    return null
  }

  const accessLevel = await getClientAccessLevel()
  const isFullAccess = accessLevel === 'full'

  // Fetch profile from CRM
  const [profileResult, accountResult, notificationPrefs] = await Promise.all([
    getPortalProfile(),
    isFullAccess
      ? getPortalAccount()
      : Promise.resolve({ data: null, error: null }),
    getNotificationPreferences(session.id),
  ])

  const profile = profileResult.data

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-stone-600">
          Unable to load profile. Please try again.
        </p>
        {profileResult.error && (
          <p className="text-sm text-stone-400 mt-2">{profileResult.error}</p>
        )}
      </div>
    )
  }

  // Map CRM profile to ProfileEditor format (for contacts with full access)
  const clientData = isFullAccess
    ? {
        id: profile.id,
        recordType: profile.recordType,
        name: `${profile.firstName} ${profile.lastName}`,
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email || '',
        phone: profile.phone || undefined,
        partner_name: profile.partnerName || undefined,
        address: profile.street
          ? {
              street: profile.street,
              city: profile.city || undefined,
              state: profile.state || undefined,
              zip: profile.postalCode || undefined,
            }
          : undefined,
        expected_due_date: profile.expectedDueDate || undefined,
        actual_birth_date: profile.actualBirthDate || undefined,
        account: accountResult.data
          ? {
              id: accountResult.data.id,
              name: accountResult.data.name,
              billing_street: accountResult.data.billingStreet,
              billing_city: accountResult.data.billingCity,
              billing_state: accountResult.data.billingState,
              billing_postal_code: accountResult.data.billingPostalCode,
            }
          : undefined,
        // CRM contacts may have additional fields
        preferred_contact_method: profile.preferredContactMethod,
        do_not_email: profile.doNotEmail,
        do_not_call: profile.doNotCall,
      }
    : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fdfbf7] via-[#f8f4ec] to-[#f5f0e8]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Profile Editor for Contacts */}
        {isFullAccess && clientData && <ProfileEditor client={clientData} />}

        {/* Read-only profile view for Leads */}
        {!isFullAccess && (
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold text-stone-800">
                Your Profile
              </h1>
              <p className="text-stone-600 mt-2">
                View your information on file
              </p>
            </div>

            {/* Lead Status Banner */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <Briefcase className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Prospective Client</p>
                    <p className="text-sm text-muted-foreground">
                      Your profile information is view-only at this time. Once
                      you become a client, you&apos;ll be able to edit your
                      details.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="bg-white/90 backdrop-blur-sm border-stone-200 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#f5f0e8] rounded-xl text-[#8b7355]">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-stone-800">
                      Contact Information
                    </CardTitle>
                    <CardDescription className="text-stone-500">
                      Your basic details
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start gap-3">
                    <User className="h-4 w-4 text-stone-400 mt-1" />
                    <div>
                      <p className="text-sm font-medium text-stone-500">Name</p>
                      <p className="text-stone-800">
                        {profile.firstName} {profile.lastName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Mail className="h-4 w-4 text-stone-400 mt-1" />
                    <div>
                      <p className="text-sm font-medium text-stone-500">
                        Email
                      </p>
                      <p className="text-stone-800">
                        {profile.email || 'Not provided'}
                      </p>
                    </div>
                  </div>

                  {profile.phone && (
                    <div className="flex items-start gap-3">
                      <Phone className="h-4 w-4 text-stone-400 mt-1" />
                      <div>
                        <p className="text-sm font-medium text-stone-500">
                          Phone
                        </p>
                        <p className="text-stone-800">{profile.phone}</p>
                      </div>
                    </div>
                  )}

                  {profile.expectedDueDate && (
                    <div className="flex items-start gap-3">
                      <Calendar className="h-4 w-4 text-stone-400 mt-1" />
                      <div>
                        <p className="text-sm font-medium text-stone-500">
                          Expected Due Date
                        </p>
                        <p className="text-stone-800">
                          {format(
                            new Date(profile.expectedDueDate),
                            'MMMM d, yyyy'
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Inquiry Details */}
            {(profile.serviceInterest || profile.message) && (
              <Card className="bg-white/90 backdrop-blur-sm border-stone-200 shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#f5f0e8] rounded-xl text-[#8b7355]">
                      <Briefcase className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-stone-800">
                        Inquiry Details
                      </CardTitle>
                      <CardDescription className="text-stone-500">
                        Information from your inquiry
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {profile.serviceInterest && (
                    <div>
                      <p className="text-sm font-medium text-stone-500">
                        Service Interest
                      </p>
                      <Badge variant="secondary" className="mt-1">
                        {profile.serviceInterest
                          .split('_')
                          .map(
                            (word: string) =>
                              word.charAt(0).toUpperCase() + word.slice(1)
                          )
                          .join(' ')}
                      </Badge>
                    </div>
                  )}

                  {profile.message && (
                    <div>
                      <p className="text-sm font-medium text-stone-500">
                        Your Message
                      </p>
                      <p className="text-stone-800 mt-1 whitespace-pre-wrap">
                        {profile.message}
                      </p>
                    </div>
                  )}

                  {profile.leadStatus && (
                    <div>
                      <p className="text-sm font-medium text-stone-500">
                        Status
                      </p>
                      <Badge variant="outline" className="mt-1">
                        {profile.leadStatus
                          .split('_')
                          .map(
                            (word: string) =>
                              word.charAt(0).toUpperCase() + word.slice(1)
                          )
                          .join(' ')}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Member Since */}
            <div className="text-center text-sm text-stone-400 pt-4">
              Inquiry submitted:{' '}
              {format(new Date(profile.createdAt), 'MMMM d, yyyy')}
            </div>
          </div>
        )}

        {/* Notification Preferences (for all users) */}
        <NotificationPreferences
          clientId={session.id}
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
