'use client'

/**
 * Billing Actions Component
 *
 * Client-side component for handling Stripe checkout and portal redirects.
 * Shows appropriate error states when Stripe is not configured.
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Sparkles,
  CreditCard,
  Loader2,
  AlertCircle,
  Settings,
} from 'lucide-react'
import {
  createCheckoutSessionAction,
  createCustomerPortalSessionAction,
  checkStripeConfigAction,
} from '@/app/actions/billing'
import type { SubscriptionTier, BillingPeriod } from '@/config/pricing'

interface UpgradeButtonProps {
  tier: SubscriptionTier
  billingPeriod?: BillingPeriod
  variant?: 'default' | 'outline' | 'secondary'
  className?: string
  children?: React.ReactNode
}

export function UpgradeButton({
  tier,
  billingPeriod = 'monthly',
  variant = 'default',
  className,
  children,
}: UpgradeButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showConfigDialog, setShowConfigDialog] = useState(false)

  const handleUpgrade = async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await createCheckoutSessionAction(tier, billingPeriod)

      if (!result.success) {
        if (result.stripeNotConfigured) {
          setShowConfigDialog(true)
        } else {
          setError(result.error || 'Failed to create checkout session')
        }
        return
      }

      if (result.data?.checkoutUrl) {
        window.location.href = result.data.checkoutUrl
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        variant={variant}
        className={className}
        onClick={handleUpgrade}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="mr-2 h-4 w-4" />
        )}
        {children ||
          `Upgrade to ${tier.charAt(0).toUpperCase() + tier.slice(1)}`}
      </Button>

      {error && (
        <Alert variant="destructive" className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <StripeNotConfiguredDialog
        open={showConfigDialog}
        onClose={() => setShowConfigDialog(false)}
      />
    </>
  )
}

interface ManageSubscriptionButtonProps {
  variant?: 'default' | 'outline' | 'secondary' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  children?: React.ReactNode
}

export function ManageSubscriptionButton({
  variant = 'outline',
  size = 'default',
  className,
  children,
}: ManageSubscriptionButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showConfigDialog, setShowConfigDialog] = useState(false)

  const handleManage = async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await createCustomerPortalSessionAction()

      if (!result.success) {
        if (result.stripeNotConfigured) {
          setShowConfigDialog(true)
        } else {
          setError(result.error || 'Failed to create portal session')
        }
        return
      }

      if (result.data?.portalUrl) {
        window.location.href = result.data.portalUrl
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={handleManage}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <CreditCard className="mr-2 h-4 w-4" />
        )}
        {children || 'Manage Subscription'}
      </Button>

      {error && (
        <Alert variant="destructive" className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <StripeNotConfiguredDialog
        open={showConfigDialog}
        onClose={() => setShowConfigDialog(false)}
      />
    </>
  )
}

interface PlanUpgradeButtonProps {
  currentTier: SubscriptionTier
  targetTier: SubscriptionTier
  priceMonthly: number
  isFeatured?: boolean
  className?: string
}

export function PlanUpgradeButton({
  currentTier,
  targetTier,
  priceMonthly: _priceMonthly,
  isFeatured = false,
  className,
}: PlanUpgradeButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showConfigDialog, setShowConfigDialog] = useState(false)

  const isCurrentPlan = currentTier === targetTier
  const isUpgrade = getIsUpgrade(currentTier, targetTier)

  const handleClick = async () => {
    if (isCurrentPlan) return

    setLoading(true)
    setError(null)

    try {
      const result = await createCheckoutSessionAction(targetTier, 'monthly')

      if (!result.success) {
        if (result.stripeNotConfigured) {
          setShowConfigDialog(true)
        } else {
          setError(result.error || 'Failed to create checkout session')
        }
        return
      }

      if (result.data?.checkoutUrl) {
        window.location.href = result.data.checkoutUrl
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (isCurrentPlan) {
    return (
      <Button variant="outline" className={className} disabled>
        Current Plan
      </Button>
    )
  }

  return (
    <>
      <Button
        variant={isFeatured ? 'default' : 'outline'}
        className={className}
        onClick={handleClick}
        disabled={loading}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isUpgrade ? 'Upgrade' : 'Downgrade'}
      </Button>

      {error && (
        <Alert variant="destructive" className="mt-2 text-left">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      )}

      <StripeNotConfiguredDialog
        open={showConfigDialog}
        onClose={() => setShowConfigDialog(false)}
      />
    </>
  )
}

function getIsUpgrade(
  current: SubscriptionTier,
  target: SubscriptionTier
): boolean {
  const order: Record<SubscriptionTier, number> = {
    starter: 1,
    professional: 2,
    enterprise: 3,
  }
  return order[target] > order[current]
}

interface StripeNotConfiguredDialogProps {
  open: boolean
  onClose: () => void
}

function StripeNotConfiguredDialog({
  open,
  onClose,
}: StripeNotConfiguredDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Stripe Not Configured
          </DialogTitle>
          <DialogDescription>
            Billing features are not available yet.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            The payment system needs to be configured before you can manage
            subscriptions. This typically means:
          </p>
          <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
            <li>Stripe API keys need to be added to the environment</li>
            <li>Products and prices need to be created in Stripe</li>
            <li>Price IDs need to be configured in the app</li>
          </ul>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              If you&apos;re seeing this in production, please contact support.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface StripeConfigStatusProps {
  className?: string
}

export function StripeConfigStatus({ className }: StripeConfigStatusProps) {
  const [status, setStatus] = useState<{
    isConfigured: boolean
    hasPriceIds: boolean
    isReady: boolean
    missingKeys: string[]
  } | null>(null)
  const [loading, setLoading] = useState(true)

  // Check config on mount
  useState(() => {
    checkStripeConfigAction().then(result => {
      if (result.success && result.data) {
        setStatus(result.data)
      }
      setLoading(false)
    })
  })

  if (loading || !status) {
    return null
  }

  // Only show in development or if not configured
  if (status.isReady && process.env.NODE_ENV !== 'development') {
    return null
  }

  if (!status.isConfigured) {
    return (
      <Alert className={className}>
        <Settings className="h-4 w-4" />
        <AlertDescription>
          <span className="font-medium">Development Mode:</span> Stripe is not
          configured. Billing features will show demo data.
          {status.missingKeys.length > 0 && (
            <span className="block text-xs mt-1">
              Missing: {status.missingKeys.join(', ')}
            </span>
          )}
        </AlertDescription>
      </Alert>
    )
  }

  if (!status.hasPriceIds) {
    return (
      <Alert className={className}>
        <Settings className="h-4 w-4" />
        <AlertDescription>
          <span className="font-medium">Setup Required:</span> Stripe is
          connected but price IDs are not configured. Create products in Stripe
          Dashboard and update src/config/pricing.ts.
        </AlertDescription>
      </Alert>
    )
  }

  return null
}
