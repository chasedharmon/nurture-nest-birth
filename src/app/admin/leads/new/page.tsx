'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createLead } from '@/app/actions/leads'
import { getReferralPartners } from '@/app/actions/referral-partners'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select-native'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronLeft, ChevronDown, ChevronUp, UserPlus } from 'lucide-react'
import type { ReferralPartner } from '@/lib/supabase/types'

const REFERRAL_SOURCE_OPTIONS = [
  { value: '', label: 'Select source...' },
  { value: 'google_search', label: 'Google Search' },
  { value: 'social_media', label: 'Social Media' },
  { value: 'friend_family', label: 'Friend/Family Referral' },
  { value: 'healthcare_provider', label: 'Healthcare Provider' },
  { value: 'childbirth_class', label: 'Childbirth Class' },
  { value: 'event', label: 'Event/Workshop' },
  { value: 'other', label: 'Other' },
]

const SERVICE_INTEREST_OPTIONS = [
  { value: '', label: 'Select service...' },
  { value: 'birth_doula', label: 'Birth Doula' },
  { value: 'postpartum_doula', label: 'Postpartum Doula' },
  { value: 'full_spectrum', label: 'Full Spectrum (Birth + Postpartum)' },
  { value: 'childbirth_education', label: 'Childbirth Education' },
  { value: 'lactation_support', label: 'Lactation Support' },
  { value: 'consultation', label: 'Consultation Only' },
  { value: 'unsure', label: 'Not Sure Yet' },
]

export default function NewLeadPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [showUTMFields, setShowUTMFields] = useState(false)
  const [referralPartners, setReferralPartners] = useState<ReferralPartner[]>(
    []
  )

  // Form state
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [serviceInterest, setServiceInterest] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [message, setMessage] = useState('')
  const [referralSource, setReferralSource] = useState('')
  const [referralPartnerId, setReferralPartnerId] = useState('')
  const [sourceDetail, setSourceDetail] = useState('')
  // UTM fields (optional, for marketing campaigns)
  const [utmSource, setUtmSource] = useState('')
  const [utmMedium, setUtmMedium] = useState('')
  const [utmCampaign, setUtmCampaign] = useState('')
  const [utmTerm, setUtmTerm] = useState('')
  const [utmContent, setUtmContent] = useState('')

  useEffect(() => {
    async function loadPartners() {
      const result = await getReferralPartners({ activeOnly: true })
      if (result.success && result.partners) {
        setReferralPartners(result.partners)
      }
    }
    loadPartners()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Name is required')
      return
    }
    if (!email.trim()) {
      setError('Email is required')
      return
    }

    startTransition(async () => {
      const result = await createLead({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        service_interest: serviceInterest || undefined,
        due_date: dueDate || undefined,
        message: message.trim() || undefined,
        referral_source: referralSource || undefined,
        referral_partner_id: referralPartnerId || undefined,
        source_detail: sourceDetail.trim() || undefined,
        utm_source: utmSource.trim() || undefined,
        utm_medium: utmMedium.trim() || undefined,
        utm_campaign: utmCampaign.trim() || undefined,
        utm_term: utmTerm.trim() || undefined,
        utm_content: utmContent.trim() || undefined,
      })

      if (result.success && result.lead) {
        router.push(`/admin/leads/${result.lead.id}`)
      } else {
        setError(result.error || 'Failed to create lead')
      }
    })
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-3xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/admin/leads">
              <Button variant="ghost" size="sm">
                <ChevronLeft className="mr-1 h-4 w-4" />
                Leads
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <UserPlus className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="font-serif text-xl font-bold text-foreground">
                  New Lead
                </h1>
                <p className="text-sm text-muted-foreground">
                  Manually add a new lead to your CRM
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Jane Smith"
                    disabled={isPending}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="jane@example.com"
                    disabled={isPending}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Expected Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    disabled={isPending}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Service Interest */}
          <Card>
            <CardHeader>
              <CardTitle>Service Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="serviceInterest">Service Interest</Label>
                <Select
                  id="serviceInterest"
                  value={serviceInterest}
                  onChange={e => setServiceInterest(e.target.value)}
                  disabled={isPending}
                >
                  {SERVICE_INTEREST_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message / Notes</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Any additional information about this lead..."
                  rows={4}
                  disabled={isPending}
                />
              </div>
            </CardContent>
          </Card>

          {/* Attribution */}
          <Card>
            <CardHeader>
              <CardTitle>Lead Source / Attribution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="referralSource">How did they find you?</Label>
                  <Select
                    id="referralSource"
                    value={referralSource}
                    onChange={e => setReferralSource(e.target.value)}
                    disabled={isPending}
                  >
                    {REFERRAL_SOURCE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="referralPartnerId">Referral Partner</Label>
                  <Select
                    id="referralPartnerId"
                    value={referralPartnerId}
                    onChange={e => setReferralPartnerId(e.target.value)}
                    disabled={isPending}
                  >
                    <option value="">None</option>
                    {referralPartners.map(partner => (
                      <option key={partner.id} value={partner.id}>
                        {partner.name}
                        {partner.business_name
                          ? ` (${partner.business_name})`
                          : ''}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sourceDetail">Source Details</Label>
                <Input
                  id="sourceDetail"
                  value={sourceDetail}
                  onChange={e => setSourceDetail(e.target.value)}
                  placeholder="e.g., Met at birth fair, Dr. Johnson's office, etc."
                  disabled={isPending}
                />
                <p className="text-xs text-muted-foreground">
                  Additional details about how this lead found you
                </p>
              </div>

              {/* UTM Fields - Collapsible */}
              <div className="border-t pt-4">
                <button
                  type="button"
                  onClick={() => setShowUTMFields(!showUTMFields)}
                  className="flex w-full items-center justify-between text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  <span>Marketing Campaign Tracking (UTM)</span>
                  {showUTMFields ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
                <p className="mt-1 text-xs text-muted-foreground">
                  Use these fields for leads from specific marketing campaigns
                </p>

                {showUTMFields && (
                  <div className="mt-4 space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="utmSource">UTM Source</Label>
                        <Input
                          id="utmSource"
                          value={utmSource}
                          onChange={e => setUtmSource(e.target.value)}
                          placeholder="e.g., google, facebook, newsletter"
                          disabled={isPending}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="utmMedium">UTM Medium</Label>
                        <Input
                          id="utmMedium"
                          value={utmMedium}
                          onChange={e => setUtmMedium(e.target.value)}
                          placeholder="e.g., cpc, email, social"
                          disabled={isPending}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="utmCampaign">UTM Campaign</Label>
                      <Input
                        id="utmCampaign"
                        value={utmCampaign}
                        onChange={e => setUtmCampaign(e.target.value)}
                        placeholder="e.g., spring_2024, birth_fair_promo"
                        disabled={isPending}
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="utmTerm">UTM Term</Label>
                        <Input
                          id="utmTerm"
                          value={utmTerm}
                          onChange={e => setUtmTerm(e.target.value)}
                          placeholder="e.g., doula_services"
                          disabled={isPending}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="utmContent">UTM Content</Label>
                        <Input
                          id="utmContent"
                          value={utmContent}
                          onChange={e => setUtmContent(e.target.value)}
                          placeholder="e.g., banner_ad_1"
                          disabled={isPending}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Link href="/admin/leads">
              <Button type="button" variant="outline" disabled={isPending}>
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Creating...' : 'Create Lead'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}
