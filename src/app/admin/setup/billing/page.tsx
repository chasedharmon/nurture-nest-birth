import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  ChevronLeft,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Ban,
  Sparkles,
  Users,
  FileText,
  HardDrive,
  Zap,
  Calendar,
  Download,
  ExternalLink,
  Receipt,
  Clock,
  Plus,
  Trash2,
  MessageSquare,
} from 'lucide-react'
import {
  getOrganizationUsage,
  getOrganizationFeatures,
} from '@/lib/features/flags'
import { getUsageSummary } from '@/lib/sms/tracking'
import { listInvoices, type StripeInvoice } from '@/lib/stripe/client'
import {
  UpgradeButton,
  ManageSubscriptionButton,
  PlanUpgradeButton,
  StripeConfigStatus,
} from './billing-actions'

async function getOrganizationData(
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // Use admin client to bypass RLS for membership/org queries
  // This is safe because we've verified the user is authenticated
  const adminClient = createAdminClient()

  // Get organization membership
  const { data: membership } = await adminClient
    .from('organization_memberships')
    .select(
      `
      *,
      organization:organizations(*)
    `
    )
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  if (!membership?.organization) {
    // Fallback to users table
    const { data: userData } = await adminClient
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (userData?.organization_id) {
      const { data: org } = await adminClient
        .from('organizations')
        .select('*')
        .eq('id', userData.organization_id)
        .single()

      return org
    }
    return null
  }

  return membership.organization
}

async function getSubscriptionPlans(
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  const { data: plans } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  return plans || []
}

const tierBadgeVariants: Record<string, 'default' | 'secondary' | 'outline'> = {
  starter: 'secondary',
  professional: 'default',
  enterprise: 'outline',
}

interface BillingPageProps {
  searchParams: Promise<{
    expired?: string
    grace?: string
    suspended?: string
  }>
}

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const params = await searchParams
  const isExpiredRedirect = params.expired === 'true'
  const isGraceRedirect = params.grace === 'true'
  const isSuspendedRedirect = params.suspended === 'true'
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const organization = await getOrganizationData(supabase)
  const plans = await getSubscriptionPlans(supabase)

  // Fetch invoices (stubbed - uses mock data until Stripe is connected)
  let invoices: StripeInvoice[] = []
  if (organization?.stripe_customer_id) {
    invoices = await listInvoices(organization.stripe_customer_id, 5)
  } else if (organization) {
    // Show mock invoices for demo purposes
    invoices = await listInvoices('demo', 5)
  }

  if (!organization) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>No Organization Found</CardTitle>
            <CardDescription>
              You need to be part of an organization to access billing settings.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const usage = await getOrganizationUsage(organization.id)
  const features = await getOrganizationFeatures(organization.id)
  const smsUsage = await getUsageSummary(organization.id)

  const currentPlan =
    plans.find(p => p.id === organization.subscription_tier) || plans[0]

  // Calculate usage percentages
  const usageItems = [
    {
      label: 'Team Members',
      current: usage.team_members,
      limit: features.max_team_members,
      icon: Users,
    },
    {
      label: 'Clients',
      current: usage.clients,
      limit: features.max_clients,
      icon: FileText,
    },
    {
      label: 'Workflows',
      current: usage.workflows,
      limit: features.max_workflows,
      icon: Zap,
    },
    {
      label: 'Storage',
      current: usage.storage_mb,
      limit: features.max_storage_mb,
      icon: HardDrive,
      unit: 'MB',
    },
  ]

  // Add SMS usage if SMS is enabled for this tier
  const smsUsageItem = smsUsage.smsEnabled
    ? {
        label: 'SMS Messages',
        current: smsUsage.currentPeriod?.segmentsSent || 0,
        limit: features.max_sms_per_month,
        icon: MessageSquare,
        unit: 'segments',
        isOverage: (smsUsage.currentPeriod?.segmentsOverage || 0) > 0,
        overageCost: smsUsage.currentPeriod?.overageCostCents
          ? `$${(smsUsage.currentPeriod.overageCostCents / 100).toFixed(2)} overage`
          : undefined,
      }
    : null

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatInvoiceDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100)
  }

  const getInvoiceStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Paid
          </Badge>
        )
      case 'open':
        return (
          <Badge variant="outline" className="border-amber-200 text-amber-800">
            Open
          </Badge>
        )
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>
      case 'void':
        return (
          <Badge variant="secondary" className="text-muted-foreground">
            Void
          </Badge>
        )
      case 'uncollectible':
        return <Badge variant="destructive">Uncollectible</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const isTrialing = organization.subscription_status === 'trialing'
  const isPastDue = organization.subscription_status === 'past_due'

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/admin/setup">
              <Button variant="ghost" size="sm">
                <ChevronLeft className="mr-1 h-4 w-4" />
                Setup
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="font-serif text-2xl font-bold text-foreground">
                  Billing & Subscription
                </h1>
                <p className="text-sm text-muted-foreground">
                  Manage your plan, usage, and payment methods
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Urgent Redirect Alerts - shown when redirected from middleware */}
        {isExpiredRedirect && (
          <Alert variant="destructive" className="mb-6">
            <Ban className="h-5 w-5" />
            <AlertTitle>Trial Expired</AlertTitle>
            <AlertDescription>
              Your free trial has ended. Please upgrade to a paid plan to
              continue using the platform. Your data is safe and will be
              restored once you upgrade.
            </AlertDescription>
          </Alert>
        )}

        {isGraceRedirect && (
          <Alert className="mb-6 border-orange-200 bg-orange-50 text-orange-800">
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle>Read-Only Mode</AlertTitle>
            <AlertDescription>
              Your trial has ended. You&apos;re currently in a 3-day grace
              period with read-only access. Upgrade now to continue making
              changes to your account.
            </AlertDescription>
          </Alert>
        )}

        {isSuspendedRedirect && (
          <Alert variant="destructive" className="mb-6">
            <Ban className="h-5 w-5" />
            <AlertTitle>Account Suspended</AlertTitle>
            <AlertDescription>
              Your account has been suspended. Please contact support or upgrade
              your subscription to restore access.
            </AlertDescription>
          </Alert>
        )}

        {/* Stripe Configuration Status (dev/setup mode) */}
        <StripeConfigStatus className="mb-6" />

        {/* Status Alerts */}
        {isTrialing && !isExpiredRedirect && !isGraceRedirect && (
          <div className="mb-6 flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <div className="flex-1">
              <p className="font-medium text-amber-800">Trial Period</p>
              <p className="text-sm text-amber-700">
                Your trial ends on {formatDate(organization.trial_ends_at)}.
                Upgrade to keep all your data and features.
              </p>
            </div>
            <UpgradeButton tier="professional" className="shrink-0">
              Upgrade Now
            </UpgradeButton>
          </div>
        )}

        {isPastDue && (
          <div className="mb-6 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div className="flex-1">
              <p className="font-medium text-red-800">Payment Past Due</p>
              <p className="text-sm text-red-700">
                Please update your payment method to continue using all
                features.
              </p>
            </div>
            <ManageSubscriptionButton
              variant="default"
              size="sm"
              className="shrink-0 bg-red-600 hover:bg-red-700"
            >
              Update Payment
            </ManageSubscriptionButton>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Current Plan */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Current Plan</CardTitle>
                    <CardDescription>
                      Your subscription and billing details
                    </CardDescription>
                  </div>
                  <Badge
                    variant={
                      tierBadgeVariants[organization.subscription_tier] ||
                      'secondary'
                    }
                  >
                    {currentPlan?.name || organization.subscription_tier}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Plan Info */}
                <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-4">
                  <div>
                    <p className="font-medium">{currentPlan?.name} Plan</p>
                    <p className="text-sm text-muted-foreground">
                      {currentPlan?.tagline || currentPlan?.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">
                      ${(currentPlan?.price_monthly || 0) / 100}
                      <span className="text-sm font-normal text-muted-foreground">
                        /month
                      </span>
                    </p>
                  </div>
                </div>

                {/* Billing Cycle */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Status</p>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="font-medium capitalize">
                        {organization.subscription_status}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      {isTrialing ? 'Trial Ends' : 'Next Billing Date'}
                    </p>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {formatDate(
                          isTrialing
                            ? organization.trial_ends_at
                            : organization.subscription_ends_at
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Usage */}
                <div>
                  <h3 className="mb-4 font-medium">Current Usage</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {usageItems.map(item => {
                      const Icon = item.icon
                      const isUnlimited = item.limit === -1
                      const percentage = isUnlimited
                        ? 0
                        : Math.min((item.current / item.limit) * 100, 100)
                      const isNearLimit = percentage >= 80

                      return (
                        <div key={item.label} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4 text-muted-foreground" />
                              <span>{item.label}</span>
                            </div>
                            <span className="text-muted-foreground">
                              {item.current}
                              {item.unit ? ` ${item.unit}` : ''} /{' '}
                              {isUnlimited ? '∞' : item.limit}
                              {item.unit ? ` ${item.unit}` : ''}
                            </span>
                          </div>
                          <Progress
                            value={isUnlimited ? 0 : percentage}
                            className={
                              isNearLimit ? '[&>div]:bg-amber-500' : ''
                            }
                          />
                        </div>
                      )
                    })}

                    {/* SMS Usage - shown separately with overage info */}
                    {smsUsageItem && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                            <span>{smsUsageItem.label}</span>
                            {smsUsageItem.isOverage && (
                              <Badge
                                variant="outline"
                                className="text-xs text-amber-600 border-amber-200"
                              >
                                Overage
                              </Badge>
                            )}
                          </div>
                          <span className="text-muted-foreground">
                            {smsUsageItem.current} /{' '}
                            {smsUsageItem.limit === -1
                              ? '∞'
                              : smsUsageItem.limit}{' '}
                            segments
                          </span>
                        </div>
                        <Progress
                          value={
                            smsUsageItem.limit === -1
                              ? 0
                              : Math.min(
                                  (smsUsageItem.current / smsUsageItem.limit) *
                                    100,
                                  100
                                )
                          }
                          className={
                            smsUsageItem.isOverage
                              ? '[&>div]:bg-amber-500'
                              : smsUsageItem.current / smsUsageItem.limit >= 0.8
                                ? '[&>div]:bg-amber-500'
                                : ''
                          }
                        />
                        {smsUsageItem.overageCost && (
                          <p className="text-xs text-amber-600">
                            {smsUsageItem.overageCost} this billing period
                          </p>
                        )}
                      </div>
                    )}

                    {/* SMS not available message for Starter tier */}
                    {!smsUsage.smsEnabled &&
                      organization.subscription_tier === 'starter' && (
                        <div className="space-y-2 opacity-60">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <MessageSquare className="h-4 w-4 text-muted-foreground" />
                              <span>SMS Messages</span>
                              <Badge variant="secondary" className="text-xs">
                                Professional+
                              </Badge>
                            </div>
                          </div>
                          <Progress value={0} />
                          <p className="text-xs text-muted-foreground">
                            Upgrade to Professional to enable SMS messaging
                          </p>
                        </div>
                      )}
                  </div>
                </div>

                <Separator />

                {/* Actions */}
                <div className="flex flex-wrap gap-3">
                  <ManageSubscriptionButton>
                    Manage Subscription
                  </ManageSubscriptionButton>
                  {organization.subscription_tier !== 'enterprise' && (
                    <UpgradeButton
                      tier={
                        organization.subscription_tier === 'starter'
                          ? 'professional'
                          : 'enterprise'
                      }
                      variant="outline"
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      Upgrade Plan
                    </UpgradeButton>
                  )}
                  <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Download Invoices
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Upgrade */}
            {organization.subscription_tier !== 'enterprise' && (
              <Card className="border-primary/50 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Upgrade Your Plan
                  </CardTitle>
                  <CardDescription>
                    Unlock more features and grow your practice
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="mb-4 space-y-2 text-sm">
                    {organization.subscription_tier === 'starter' && (
                      <>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          Up to 10 team members
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          SMS messaging
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          Custom branding
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          Advanced reports
                        </li>
                      </>
                    )}
                    {organization.subscription_tier === 'professional' && (
                      <>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          Unlimited team members
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          White-label branding
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          Custom domain
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          Dedicated support
                        </li>
                      </>
                    )}
                  </ul>
                  <UpgradeButton
                    tier={
                      organization.subscription_tier === 'starter'
                        ? 'professional'
                        : 'enterprise'
                    }
                    className="w-full"
                  >
                    Upgrade to{' '}
                    {organization.subscription_tier === 'starter'
                      ? 'Professional'
                      : 'Enterprise'}
                  </UpgradeButton>
                </CardContent>
              </Card>
            )}

            {/* Billing Contact */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Billing Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">
                    {organization.billing_name || 'Not set'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">
                    {organization.billing_email || 'Not set'}
                  </p>
                </div>
                <Button variant="outline" size="sm" className="w-full">
                  Update Billing Contact
                </Button>
              </CardContent>
            </Card>

            {/* Help */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Need Help?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Compare Plans
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Billing FAQ
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Contact Support
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Available Plans */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Available Plans</CardTitle>
            <CardDescription>
              Compare features and choose the right plan for your practice
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              {plans.map(plan => {
                const isCurrentPlan = plan.id === organization.subscription_tier
                const features = plan.features as {
                  max_team_members?: number
                  max_clients?: number
                  max_workflows?: number
                  sms_enabled?: boolean
                  custom_branding?: boolean
                  api_access?: boolean
                }

                return (
                  <div
                    key={plan.id}
                    className={`relative rounded-lg border p-6 ${
                      plan.is_featured
                        ? 'border-primary shadow-md'
                        : 'border-border'
                    } ${isCurrentPlan ? 'bg-muted/50' : ''}`}
                  >
                    {plan.is_featured && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge>Most Popular</Badge>
                      </div>
                    )}

                    <div className="mb-4">
                      <h3 className="text-lg font-semibold">{plan.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {plan.tagline}
                      </p>
                    </div>

                    <div className="mb-6">
                      <span className="text-3xl font-bold">
                        ${plan.price_monthly / 100}
                      </span>
                      <span className="text-muted-foreground">/month</span>
                      {plan.price_yearly > 0 && (
                        <p className="text-sm text-green-600">
                          ${plan.price_yearly / 100}/year (save 2 months)
                        </p>
                      )}
                    </div>

                    <ul className="mb-6 space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        {(features.max_team_members as number) === -1
                          ? 'Unlimited'
                          : features.max_team_members}{' '}
                        team members
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        {(features.max_clients as number) === -1
                          ? 'Unlimited'
                          : features.max_clients}{' '}
                        clients
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        {(features.max_workflows as number) === -1
                          ? 'Unlimited'
                          : features.max_workflows}{' '}
                        workflows
                      </li>
                      {features.sms_enabled && (
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          SMS messaging
                        </li>
                      )}
                      {features.custom_branding && (
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          Custom branding
                        </li>
                      )}
                      {features.api_access && (
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          API access
                        </li>
                      )}
                    </ul>

                    <PlanUpgradeButton
                      currentTier={
                        organization.subscription_tier as
                          | 'starter'
                          | 'professional'
                          | 'enterprise'
                      }
                      targetTier={
                        plan.id as 'starter' | 'professional' | 'enterprise'
                      }
                      priceMonthly={plan.price_monthly}
                      isFeatured={plan.is_featured}
                      className="w-full"
                    />
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Invoice History & Payment Methods Row */}
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {/* Invoice History */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    Invoice History
                  </CardTitle>
                  <CardDescription>
                    Your recent invoices and payment history
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Receipt className="mb-3 h-12 w-12 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">
                    No invoices yet
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Invoices will appear here after your first payment
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {invoices.map(invoice => (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{invoice.number}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatInvoiceDate(invoice.created)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="font-medium">
                            {formatCurrency(
                              invoice.amountPaid || invoice.amountDue,
                              invoice.currency
                            )}
                          </p>
                          {getInvoiceStatusBadge(invoice.status)}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Download invoice"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {invoices.length >= 5 && (
                    <Button variant="outline" className="w-full">
                      View All Invoices
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Methods
                  </CardTitle>
                  <CardDescription>Manage your payment methods</CardDescription>
                </div>
                <ManageSubscriptionButton variant="outline" size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Card
                </ManageSubscriptionButton>
              </div>
            </CardHeader>
            <CardContent>
              {/* Stubbed payment methods - in production, fetch from Stripe */}
              <div className="space-y-3">
                {/* Primary Card */}
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gradient-to-br from-blue-600 to-blue-800">
                      <CreditCard className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">Visa ending in 4242</p>
                        <Badge variant="secondary" className="text-xs">
                          Default
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Expires 12/2026
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                  </div>
                </div>

                {/* Secondary Card */}
                <div className="flex items-center justify-between rounded-lg border border-dashed p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                      <CreditCard className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">Mastercard ending in 8888</p>
                      <p className="text-sm text-muted-foreground">
                        Expires 03/2025
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      Set Default
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="rounded-lg bg-muted/50 p-3">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">
                      Secure payments powered by Stripe
                    </p>
                    <p>
                      Your payment information is encrypted and never stored on
                      our servers.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
