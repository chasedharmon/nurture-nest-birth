import { getClientSession } from '@/app/actions/client-auth'
import { createClient } from '@/lib/supabase/server'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { format } from 'date-fns'

export default async function ClientProfilePage() {
  const session = await getClientSession()

  if (!session) {
    return null
  }

  // Fetch full client details
  const supabase = await createClient()
  const { data: client } = await supabase
    .from('leads')
    .select('*')
    .eq('id', session.clientId)
    .single()

  if (!client) {
    return <div>Client not found</div>
  }

  // Parse JSONB fields
  const address = client.address || {}
  const birthPreferences = client.birth_preferences || {}
  const medicalInfo = client.medical_info || {}
  const emergencyContact = client.emergency_contact || {}

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Your Profile</h1>
        <p className="text-muted-foreground mt-2">
          View and manage your personal information
        </p>
      </div>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
          <CardDescription>Your basic contact details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Name</p>
              <p className="text-foreground">{client.name || 'Not provided'}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="text-foreground">
                {client.email || 'Not provided'}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Phone</p>
              <p className="text-foreground">
                {client.phone || 'Not provided'}
              </p>
            </div>

            {client.partner_name && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Partner&apos;s Name
                </p>
                <p className="text-foreground">{client.partner_name}</p>
              </div>
            )}
          </div>

          {(address.street || address.city || address.state || address.zip) && (
            <div className="pt-4 border-t">
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Address
              </p>
              <div className="text-foreground space-y-1">
                {address.street && <p>{address.street}</p>}
                {(address.city || address.state || address.zip) && (
                  <p>
                    {address.city && `${address.city}, `}
                    {address.state && `${address.state} `}
                    {address.zip}
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Birth & Medical Information */}
      <Card>
        <CardHeader>
          <CardTitle>Birth & Medical Information</CardTitle>
          <CardDescription>Important dates and medical details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {client.expected_due_date && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Expected Due Date
                </p>
                <p className="text-foreground">
                  {format(new Date(client.expected_due_date), 'MMMM d, yyyy')}
                </p>
              </div>
            )}

            {client.actual_birth_date && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Birth Date
                </p>
                <p className="text-foreground">
                  {format(new Date(client.actual_birth_date), 'MMMM d, yyyy')}
                </p>
              </div>
            )}

            {medicalInfo.obgyn && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  OB/GYN
                </p>
                <p className="text-foreground">{medicalInfo.obgyn}</p>
              </div>
            )}

            {medicalInfo.hospital && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Hospital/Birth Center
                </p>
                <p className="text-foreground">{medicalInfo.hospital}</p>
              </div>
            )}

            {medicalInfo.insurance && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Insurance Provider
                </p>
                <p className="text-foreground">{medicalInfo.insurance}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Birth Preferences */}
      {(birthPreferences.location ||
        birthPreferences.birth_plan ||
        birthPreferences.special_requests) && (
        <Card>
          <CardHeader>
            <CardTitle>Birth Preferences</CardTitle>
            <CardDescription>Your birth plan and preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {birthPreferences.location && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Preferred Birth Location
                </p>
                <p className="text-foreground">{birthPreferences.location}</p>
              </div>
            )}

            {birthPreferences.birth_plan && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Birth Plan Notes
                </p>
                <p className="text-foreground whitespace-pre-wrap">
                  {birthPreferences.birth_plan}
                </p>
              </div>
            )}

            {birthPreferences.special_requests && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Special Requests
                </p>
                <p className="text-foreground whitespace-pre-wrap">
                  {birthPreferences.special_requests}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Emergency Contact */}
      {(emergencyContact.name ||
        emergencyContact.phone ||
        emergencyContact.relationship) && (
        <Card>
          <CardHeader>
            <CardTitle>Emergency Contact</CardTitle>
            <CardDescription>
              Person to contact in case of emergency
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {emergencyContact.name && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Name
                  </p>
                  <p className="text-foreground">{emergencyContact.name}</p>
                </div>
              )}

              {emergencyContact.phone && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Phone
                  </p>
                  <p className="text-foreground">{emergencyContact.phone}</p>
                </div>
              )}

              {emergencyContact.relationship && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Relationship
                  </p>
                  <p className="text-foreground">
                    {emergencyContact.relationship}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Account Status */}
      <Card>
        <CardHeader>
          <CardTitle>Account Status</CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Client Type
              </p>
              <p className="text-foreground">
                {client.client_type
                  ?.replace('_', ' ')
                  .replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Lead'}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Stage</p>
              <p className="text-foreground">
                {client.lifecycle_stage
                  ?.replace('_', ' ')
                  .replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Lead'}
              </p>
            </div>

            {client.last_login_at && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Last Login
                </p>
                <p className="text-foreground">
                  {format(
                    new Date(client.last_login_at),
                    'MMMM d, yyyy • h:mm a'
                  )}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Update Notice */}
      <Card className="bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
        <CardContent className="py-4">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            To update any of your information, please contact your doula
            directly.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
