'use client'

import { format } from 'date-fns'
import { StatusBadge } from '@/components/admin/status-badge'
import type { Lead, ClientAssignment } from '@/lib/supabase/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { UserPlus, Users, AlertCircle, Megaphone } from 'lucide-react'

interface ClientOverviewProps {
  lead: Lead
  assignments?: ClientAssignment[]
  onAssignClick?: () => void
}

const sourceLabels = {
  contact_form: 'Contact Form',
  newsletter: 'Newsletter',
  manual: 'Manual Entry',
}

const roleColors = {
  primary:
    'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
  backup: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
  support:
    'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300',
}

const roleLabels = {
  primary: 'Primary',
  backup: 'Backup',
  support: 'Support',
}

export function ClientOverview({
  lead,
  assignments = [],
  onAssignClick,
}: ClientOverviewProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Care Team - Prominent at top */}
      <Card
        className={`lg:col-span-2 ${assignments.length === 0 ? 'border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20' : ''}`}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Care Team
            {assignments.length === 0 && (
              <Badge
                variant="outline"
                className="ml-2 border-amber-500 text-amber-600 dark:border-amber-400 dark:text-amber-400"
              >
                <AlertCircle className="h-3 w-3 mr-1" />
                Unassigned
              </Badge>
            )}
          </CardTitle>
          {onAssignClick && (
            <Button size="sm" onClick={onAssignClick}>
              <UserPlus className="mr-2 h-4 w-4" />
              {assignments.length === 0 ? 'Assign Provider' : 'Manage Team'}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <div className="flex items-center gap-3 text-amber-700 dark:text-amber-300">
              <p className="text-sm">
                No providers assigned yet. Assign a doula to start managing this
                client&apos;s care.
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {assignments.map(assignment => {
                const member = assignment.team_member
                if (!member) return null

                return (
                  <div
                    key={assignment.id}
                    className="flex items-center gap-2 rounded-lg border bg-card p-2 pr-3"
                  >
                    {member.avatar_url ? (
                      <img
                        src={member.avatar_url}
                        alt={member.display_name}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
                        {member.display_name
                          .split(' ')
                          .map(n => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium">
                        {member.display_name}
                      </p>
                      <Badge
                        variant="secondary"
                        className={`text-xs ${roleColors[assignment.assignment_role as keyof typeof roleColors]}`}
                      >
                        {
                          roleLabels[
                            assignment.assignment_role as keyof typeof roleLabels
                          ]
                        }
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Email</p>
            <a
              href={`mailto:${lead.email}`}
              className="text-sm text-primary hover:underline"
            >
              {lead.email}
            </a>
          </div>

          {lead.phone && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Phone</p>
              <a
                href={`tel:${lead.phone}`}
                className="text-sm text-primary hover:underline"
              >
                {lead.phone}
              </a>
            </div>
          )}

          {lead.partner_name && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Partner Name
              </p>
              <p className="text-sm">{lead.partner_name}</p>
            </div>
          )}

          {lead.address && Object.keys(lead.address).length > 0 && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Address
              </p>
              <p className="text-sm">
                {lead.address.street}
                <br />
                {lead.address.city}, {lead.address.state} {lead.address.zip}
              </p>
            </div>
          )}

          <div>
            <p className="text-sm font-medium text-muted-foreground">Status</p>
            <div className="mt-1">
              <StatusBadge status={lead.status} />
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">Source</p>
            <p className="text-sm">{sourceLabels[lead.source]}</p>
          </div>

          {lead.email_domain && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Email Domain
              </p>
              <p className="text-sm">{lead.email_domain}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Birth & Medical Information */}
      <Card>
        <CardHeader>
          <CardTitle>Birth & Medical Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {(lead.expected_due_date || lead.due_date) && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Expected Due Date
              </p>
              <p className="text-sm">
                {format(
                  new Date(lead.expected_due_date || lead.due_date!),
                  'MMMM d, yyyy'
                )}
              </p>
            </div>
          )}

          {lead.actual_birth_date && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Actual Birth Date
              </p>
              <p className="text-sm">
                {format(new Date(lead.actual_birth_date), 'MMMM d, yyyy')}
              </p>
            </div>
          )}

          {lead.service_interest && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Service Interest
              </p>
              <p className="text-sm">{lead.service_interest}</p>
            </div>
          )}

          {lead.medical_info && Object.keys(lead.medical_info).length > 0 && (
            <>
              {lead.medical_info.obgyn && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    OB/GYN
                  </p>
                  <p className="text-sm">{lead.medical_info.obgyn}</p>
                </div>
              )}

              {lead.medical_info.hospital && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Hospital
                  </p>
                  <p className="text-sm">{lead.medical_info.hospital}</p>
                </div>
              )}

              {lead.medical_info.insurance && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Insurance
                  </p>
                  <p className="text-sm">{lead.medical_info.insurance}</p>
                </div>
              )}
            </>
          )}

          {lead.client_type && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Client Type
              </p>
              <p className="text-sm capitalize">
                {lead.client_type.replace('_', ' ')}
              </p>
            </div>
          )}

          {lead.lifecycle_stage && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Lifecycle Stage
              </p>
              <p className="text-sm capitalize">
                {lead.lifecycle_stage.replace('_', ' ')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lead Source & Attribution */}
      {(lead.referral_source ||
        lead.source_detail ||
        lead.referral_partner_id ||
        lead.utm_source ||
        lead.utm_campaign) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5" />
              Lead Source & Attribution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {lead.referral_source && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Referral Source
                </p>
                <p className="text-sm capitalize">
                  {lead.referral_source.replace(/_/g, ' ')}
                </p>
              </div>
            )}

            {lead.source_detail && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Source Details
                </p>
                <p className="text-sm">{lead.source_detail}</p>
              </div>
            )}

            {/* UTM Parameters */}
            {(lead.utm_source ||
              lead.utm_medium ||
              lead.utm_campaign ||
              lead.utm_term ||
              lead.utm_content) && (
              <div className="border-t pt-4">
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Campaign Tracking (UTM)
                </p>
                <div className="grid gap-2 text-sm">
                  {lead.utm_source && (
                    <div className="flex">
                      <span className="w-24 text-muted-foreground">
                        Source:
                      </span>
                      <span>{lead.utm_source}</span>
                    </div>
                  )}
                  {lead.utm_medium && (
                    <div className="flex">
                      <span className="w-24 text-muted-foreground">
                        Medium:
                      </span>
                      <span>{lead.utm_medium}</span>
                    </div>
                  )}
                  {lead.utm_campaign && (
                    <div className="flex">
                      <span className="w-24 text-muted-foreground">
                        Campaign:
                      </span>
                      <span>{lead.utm_campaign}</span>
                    </div>
                  )}
                  {lead.utm_term && (
                    <div className="flex">
                      <span className="w-24 text-muted-foreground">Term:</span>
                      <span>{lead.utm_term}</span>
                    </div>
                  )}
                  {lead.utm_content && (
                    <div className="flex">
                      <span className="w-24 text-muted-foreground">
                        Content:
                      </span>
                      <span>{lead.utm_content}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Birth Preferences */}
      {lead.birth_preferences &&
        Object.keys(lead.birth_preferences).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Birth Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {lead.birth_preferences.location && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Preferred Birth Location
                  </p>
                  <p className="text-sm">{lead.birth_preferences.location}</p>
                </div>
              )}

              {lead.birth_preferences.birth_plan_notes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Birth Plan Notes
                  </p>
                  <p className="text-sm whitespace-pre-wrap">
                    {lead.birth_preferences.birth_plan_notes}
                  </p>
                </div>
              )}

              {lead.birth_preferences.special_requests && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Special Requests
                  </p>
                  <p className="text-sm whitespace-pre-wrap">
                    {lead.birth_preferences.special_requests}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

      {/* Emergency Contact */}
      {lead.emergency_contact &&
        Object.keys(lead.emergency_contact).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Emergency Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {lead.emergency_contact.name && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Name
                  </p>
                  <p className="text-sm">{lead.emergency_contact.name}</p>
                </div>
              )}

              {lead.emergency_contact.phone && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Phone
                  </p>
                  <a
                    href={`tel:${lead.emergency_contact.phone}`}
                    className="text-sm text-primary hover:underline"
                  >
                    {lead.emergency_contact.phone}
                  </a>
                </div>
              )}

              {lead.emergency_contact.relationship && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Relationship
                  </p>
                  <p className="text-sm">
                    {lead.emergency_contact.relationship}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

      {/* Original Message */}
      {lead.message && (
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Original Message</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{lead.message}</p>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <a href={`mailto:${lead.email}`}>📧 Send Email</a>
          </Button>
          {lead.phone && (
            <Button variant="outline" asChild>
              <a href={`tel:${lead.phone}`}>📞 Call</a>
            </Button>
          )}
          {lead.address && lead.address.street && (
            <Button variant="outline" asChild>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lead.address.street}, ${lead.address.city}, ${lead.address.state} ${lead.address.zip}`)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                🗺️ View on Map
              </a>
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Tags */}
      {lead.tags && lead.tags.length > 0 && (
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {lead.tags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
                >
                  {tag}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
