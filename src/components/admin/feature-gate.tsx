'use client'

import { ReactNode } from 'react'
import { Lock, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useOrganization } from '@/lib/hooks/use-organization'
import { FeatureFlags, SubscriptionTier } from '@/lib/supabase/types'

// =====================================================
// Feature Gate Component
// Wraps content that requires a specific feature
// =====================================================

interface FeatureGateProps {
  feature: keyof FeatureFlags
  children: ReactNode
  fallback?: ReactNode
  showUpgradePrompt?: boolean
}

export function FeatureGate({
  feature,
  children,
  fallback,
  showUpgradePrompt = true,
}: FeatureGateProps) {
  const { canUseFeature, organization } = useOrganization()

  const hasAccess = canUseFeature(feature)

  if (hasAccess) {
    return <>{children}</>
  }

  if (fallback) {
    return <>{fallback}</>
  }

  if (showUpgradePrompt) {
    return (
      <UpgradePrompt
        feature={feature}
        currentTier={organization?.subscription_tier || 'starter'}
      />
    )
  }

  return null
}

// =====================================================
// Limit Gate Component
// Checks if within a usage limit before rendering
// =====================================================

interface LimitGateProps {
  limitType: 'team_members' | 'clients' | 'workflows'
  currentCount: number
  children: ReactNode
  fallback?: ReactNode
  showUpgradePrompt?: boolean
}

export function LimitGate({
  limitType,
  currentCount,
  children,
  fallback,
  showUpgradePrompt = true,
}: LimitGateProps) {
  const { isWithinLimit, organization } = useOrganization()

  const { allowed, limit } = isWithinLimit(limitType, currentCount)

  if (allowed) {
    return <>{children}</>
  }

  if (fallback) {
    return <>{fallback}</>
  }

  if (showUpgradePrompt) {
    const friendlyNames: Record<typeof limitType, string> = {
      team_members: 'team members',
      clients: 'clients',
      workflows: 'workflows',
    }

    return (
      <LimitReachedPrompt
        resourceName={friendlyNames[limitType]}
        limit={limit}
        currentTier={organization?.subscription_tier || 'starter'}
      />
    )
  }

  return null
}

// =====================================================
// Upgrade Prompt Component
// =====================================================

interface UpgradePromptProps {
  feature: keyof FeatureFlags
  currentTier: SubscriptionTier
}

const featureNames: Partial<Record<keyof FeatureFlags, string>> = {
  sms_enabled: 'SMS Messaging',
  custom_branding: 'Custom Branding',
  advanced_reports: 'Advanced Reports',
  custom_dashboards: 'Custom Dashboards',
  api_access: 'API Access',
  webhook_access: 'Webhook Integration',
  calendar_sync: 'Calendar Sync',
  white_label: 'White Label',
  custom_domain: 'Custom Domain',
  advanced_conditions: 'Advanced Workflow Conditions',
  priority_support: 'Priority Support',
  custom_roles: 'Custom Roles',
}

const tierUpgrades: Record<SubscriptionTier, SubscriptionTier | null> = {
  starter: 'professional',
  professional: 'enterprise',
  enterprise: null,
  custom: null,
}

function UpgradePrompt({ feature, currentTier }: UpgradePromptProps) {
  const featureName = featureNames[feature] || feature
  const upgradeTier = tierUpgrades[currentTier]

  return (
    <Card className="border-dashed">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Lock className="h-6 w-6 text-muted-foreground" />
        </div>
        <CardTitle className="text-lg">{featureName}</CardTitle>
        <CardDescription>
          {upgradeTier
            ? `Upgrade to ${upgradeTier} to unlock this feature`
            : 'Contact us for enterprise access'}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        {upgradeTier && (
          <UpgradeButton targetTier={upgradeTier} variant="default" />
        )}
      </CardContent>
    </Card>
  )
}

// =====================================================
// Limit Reached Prompt Component
// =====================================================

interface LimitReachedPromptProps {
  resourceName: string
  limit: number
  currentTier: SubscriptionTier
}

function LimitReachedPrompt({
  resourceName,
  limit,
  currentTier,
}: LimitReachedPromptProps) {
  const upgradeTier = tierUpgrades[currentTier]

  return (
    <Card className="border-dashed border-amber-200 bg-amber-50">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
          <Sparkles className="h-6 w-6 text-amber-600" />
        </div>
        <CardTitle className="text-lg">Limit Reached</CardTitle>
        <CardDescription>
          You&apos;ve reached your limit of {limit} {resourceName}.
          {upgradeTier
            ? ` Upgrade to ${upgradeTier} for more.`
            : ' Contact us for custom limits.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        {upgradeTier && (
          <UpgradeButton targetTier={upgradeTier} variant="default" />
        )}
      </CardContent>
    </Card>
  )
}

// =====================================================
// Upgrade Button Component
// =====================================================

interface UpgradeButtonProps {
  targetTier: SubscriptionTier
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
  className?: string
}

export function UpgradeButton({
  targetTier,
  variant = 'default',
  size = 'default',
  className,
}: UpgradeButtonProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <Sparkles className="mr-2 h-4 w-4" />
          Upgrade to {targetTier}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upgrade to {targetTier}</DialogTitle>
          <DialogDescription>
            Unlock more features and grow your doula practice.
          </DialogDescription>
        </DialogHeader>
        <UpgradeDialogContent targetTier={targetTier} />
      </DialogContent>
    </Dialog>
  )
}

// =====================================================
// Upgrade Dialog Content
// =====================================================

interface UpgradeDialogContentProps {
  targetTier: SubscriptionTier
}

const tierBenefits: Record<SubscriptionTier, string[]> = {
  starter: [],
  professional: [
    'Up to 10 team members',
    'Up to 500 clients',
    'SMS messaging',
    'Custom branding',
    'Advanced reports & dashboards',
    'API & webhook access',
    'Calendar sync',
    'Priority support',
  ],
  enterprise: [
    'Unlimited team members',
    'Unlimited clients',
    'White-label branding',
    'Custom domain',
    'Dedicated account manager',
    'Custom integrations',
    'SLA guarantee',
  ],
  custom: [],
}

const tierPricing: Record<
  SubscriptionTier,
  { monthly: number; yearly: number }
> = {
  starter: { monthly: 0, yearly: 0 },
  professional: { monthly: 49, yearly: 470 },
  enterprise: { monthly: 149, yearly: 1430 },
  custom: { monthly: 0, yearly: 0 },
}

function UpgradeDialogContent({ targetTier }: UpgradeDialogContentProps) {
  const benefits = tierBenefits[targetTier]
  const pricing = tierPricing[targetTier]

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-muted/50 p-4">
        <div className="flex items-baseline justify-between">
          <div>
            <span className="text-3xl font-bold">${pricing.monthly}</span>
            <span className="text-muted-foreground">/month</span>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            or ${pricing.yearly}/year
            <br />
            <span className="text-green-600">(Save 2 months)</span>
          </div>
        </div>
      </div>

      <div>
        <h4 className="mb-3 font-medium">What&apos;s included:</h4>
        <ul className="space-y-2">
          {benefits.map((benefit, index) => (
            <li key={index} className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm">{benefit}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex gap-3">
        <Button className="flex-1">Start {targetTier} Plan</Button>
        <Button variant="outline" className="flex-1">
          Compare Plans
        </Button>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        14-day money-back guarantee. Cancel anytime.
      </p>
    </div>
  )
}

// =====================================================
// Usage Bar Component
// Shows current usage vs limit
// =====================================================

interface UsageBarProps {
  label: string
  current: number
  limit: number
  showUpgrade?: boolean
}

export function UsageBar({
  label,
  current,
  limit,
  showUpgrade = true,
}: UsageBarProps) {
  const isUnlimited = limit === -1
  const percentage = isUnlimited ? 0 : Math.min((current / limit) * 100, 100)
  const isNearLimit = percentage >= 80
  const isAtLimit = percentage >= 100

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">
          {current} / {isUnlimited ? '∞' : limit}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full transition-all ${
            isAtLimit
              ? 'bg-red-500'
              : isNearLimit
                ? 'bg-amber-500'
                : 'bg-primary'
          }`}
          style={{ width: isUnlimited ? '0%' : `${percentage}%` }}
        />
      </div>
      {isAtLimit && showUpgrade && (
        <p className="text-xs text-red-600">
          Limit reached. Upgrade to add more.
        </p>
      )}
      {isNearLimit && !isAtLimit && (
        <p className="text-xs text-amber-600">
          Approaching limit ({limit - current} remaining)
        </p>
      )}
    </div>
  )
}
