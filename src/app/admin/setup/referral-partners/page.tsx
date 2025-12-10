import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  getReferralPartners,
  getReferralPartnerStats,
} from '@/app/actions/referral-partners'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ChevronLeft,
  Users,
  Plus,
  UserCheck,
  TrendingUp,
  Link2,
  Building2,
  User,
  Stethoscope,
} from 'lucide-react'
import { ReferralPartnerDialog } from '@/components/admin/setup/referral-partner-dialog'
import { ReferralPartnerActions } from '@/components/admin/setup/referral-partner-actions'
import type { ReferralPartner } from '@/lib/supabase/types'

const PARTNER_TYPE_ICONS: Record<string, typeof Users> = {
  healthcare: Stethoscope,
  business: Building2,
  individual: User,
  organization: Users,
  other: Users,
}

const PARTNER_TYPE_LABELS: Record<string, string> = {
  healthcare: 'Healthcare Provider',
  business: 'Business',
  individual: 'Individual',
  organization: 'Organization',
  other: 'Other',
}

export default async function ReferralPartnersPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const [partnersResult, statsResult] = await Promise.all([
    getReferralPartners(),
    getReferralPartnerStats(),
  ])

  const partners = partnersResult.success
    ? (partnersResult.partners as ReferralPartner[]) || []
    : []
  const stats = statsResult.success ? statsResult.stats : null

  const activeCount = partners.filter(p => p.is_active).length
  const conversionRate =
    stats && stats.totalLeads > 0
      ? ((stats.totalConversions / stats.totalLeads) * 100).toFixed(1)
      : '0'

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/setup">
                <Button variant="ghost" size="sm">
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Setup
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="font-serif text-xl font-bold text-foreground">
                    Referral Partners
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {partners.length} partner
                    {partners.length !== 1 ? 's' : ''} ({activeCount} active)
                  </p>
                </div>
              </div>
            </div>
            <ReferralPartnerDialog mode="create">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Partner
              </Button>
            </ReferralPartnerDialog>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{partners.length}</div>
              <p className="text-sm text-muted-foreground">Total Partners</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats?.totalLeads || 0}</div>
              <p className="text-sm text-muted-foreground">Referred Leads</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {stats?.totalConversions || 0}
              </div>
              <p className="text-sm text-muted-foreground">Conversions</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{conversionRate}%</span>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </div>
              <p className="text-sm text-muted-foreground">Conversion Rate</p>
            </CardContent>
          </Card>
        </div>

        {/* Info Card */}
        <Card className="mb-8 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20">
          <CardContent className="flex items-start gap-3 pt-6">
            <Link2 className="h-5 w-5 shrink-0 mt-0.5 text-blue-500" />
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <p className="font-medium mb-1">
                Track Referrals from Healthcare Providers & Partners
              </p>
              <p className="text-blue-600 dark:text-blue-400">
                Add referral partners to track which OBs, midwives, and other
                sources are sending you clients. Each partner gets a unique
                referral code that can be used in marketing links to
                automatically attribute leads.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Partners List */}
        {partners.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <h3 className="mb-2 text-lg font-semibold">
                No referral partners yet
              </h3>
              <p className="mb-4 text-center text-muted-foreground">
                Add your first referral partner to start tracking where your
                clients come from.
              </p>
              <ReferralPartnerDialog mode="create">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Partner
                </Button>
              </ReferralPartnerDialog>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {partners.map(partner => {
              const Icon = PARTNER_TYPE_ICONS[partner.partner_type] || Users
              return (
                <Card
                  key={partner.id}
                  className={!partner.is_active ? 'opacity-60' : ''}
                >
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="rounded-lg bg-muted p-2">
                          <Icon className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{partner.name}</h3>
                            {!partner.is_active && (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {PARTNER_TYPE_LABELS[partner.partner_type]}
                            {partner.business_name &&
                              ` • ${partner.business_name}`}
                            {partner.specialization &&
                              ` • ${partner.specialization}`}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            {partner.email && <span>{partner.email}</span>}
                            {partner.phone && <span>{partner.phone}</span>}
                            {partner.referral_code && (
                              <span className="flex items-center gap-1 font-mono">
                                <Link2 className="h-3 w-3" />
                                {partner.referral_code}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {/* Stats */}
                        <div className="flex gap-6 text-sm">
                          <div className="text-center">
                            <div className="font-semibold">
                              {partner.lead_count}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Leads
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center gap-1 font-semibold">
                              {partner.converted_count}
                              <UserCheck className="h-3 w-3 text-green-500" />
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Clients
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold">
                              {partner.lead_count > 0
                                ? (
                                    (partner.converted_count /
                                      partner.lead_count) *
                                    100
                                  ).toFixed(0)
                                : 0}
                              %
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Rate
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <ReferralPartnerActions partner={partner} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
