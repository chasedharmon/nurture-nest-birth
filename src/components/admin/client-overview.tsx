'use client'

import { format } from 'date-fns'
import { StatusBadge } from '@/components/admin/status-badge'
import type { Lead } from '@/lib/supabase/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface ClientOverviewProps {
  lead: Lead
}

const sourceLabels = {
  contact_form: 'Contact Form',
  newsletter: 'Newsletter',
  manual: 'Manual Entry',
}

export function ClientOverview({ lead }: ClientOverviewProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
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
