'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Palette, RotateCcw, Check, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  updateBrandingColors,
  updateBrandingTypography,
  updateBrandingCustomCss,
  updatePortalBranding,
  updateWhiteLabelSettings,
  resetBrandingToDefaults,
  type TenantBranding,
} from '@/app/actions/tenant-branding'

interface BrandingSettingsProps {
  branding: TenantBranding | null
  organizationName: string
  organizationLogoUrl: string | null
  isAdmin: boolean
  subscriptionTier: string
}

export function BrandingSettings({
  branding,
  organizationName: _organizationName,
  organizationLogoUrl: _organizationLogoUrl,
  isAdmin,
  subscriptionTier,
}: BrandingSettingsProps) {
  // Reserved for future use - logo upload and organization display
  void _organizationName
  void _organizationLogoUrl
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Form state
  const [colors, setColors] = useState({
    primary: branding?.primary_color || '#7C3AED',
    secondary: branding?.secondary_color || '#F59E0B',
    accent: branding?.accent_color || '#10B981',
  })

  const [typography, setTypography] = useState({
    fontFamily: branding?.font_family || 'Inter, system-ui, sans-serif',
    headingFontFamily: branding?.heading_font_family || '',
  })

  const [customCss, setCustomCss] = useState(branding?.custom_css || '')

  const [portal, setPortal] = useState({
    welcomeMessage: branding?.portal_welcome_message || '',
  })

  const [whiteLabel, setWhiteLabel] = useState({
    hidePoweredBy: branding?.hide_powered_by || false,
    customDomain: branding?.custom_domain || '',
  })

  const canHidePoweredBy = ['professional', 'business', 'enterprise'].includes(
    subscriptionTier
  )

  const showMessage = (type: 'success' | 'error', message: string) => {
    if (type === 'success') {
      setSuccessMessage(message)
      setErrorMessage(null)
    } else {
      setErrorMessage(message)
      setSuccessMessage(null)
    }
    setTimeout(() => {
      setSuccessMessage(null)
      setErrorMessage(null)
    }, 3000)
  }

  const handleSaveColors = () => {
    startTransition(async () => {
      const result = await updateBrandingColors({
        primary_color: colors.primary,
        secondary_color: colors.secondary,
        accent_color: colors.accent,
      })

      if (result.error) {
        showMessage('error', result.error)
      } else {
        showMessage('success', 'Colors saved successfully')
        router.refresh()
      }
    })
  }

  const handleSaveTypography = () => {
    startTransition(async () => {
      const result = await updateBrandingTypography({
        font_family: typography.fontFamily,
        heading_font_family: typography.headingFontFamily || null,
      })

      if (result.error) {
        showMessage('error', result.error)
      } else {
        showMessage('success', 'Typography saved successfully')
        router.refresh()
      }
    })
  }

  const handleSaveCustomCss = () => {
    startTransition(async () => {
      const result = await updateBrandingCustomCss(customCss || null)

      if (result.error) {
        showMessage('error', result.error)
      } else {
        showMessage('success', 'Custom CSS saved successfully')
        router.refresh()
      }
    })
  }

  const handleSavePortal = () => {
    startTransition(async () => {
      const result = await updatePortalBranding({
        portal_welcome_message: portal.welcomeMessage || null,
      })

      if (result.error) {
        showMessage('error', result.error)
      } else {
        showMessage('success', 'Portal settings saved successfully')
        router.refresh()
      }
    })
  }

  const handleSaveWhiteLabel = () => {
    startTransition(async () => {
      const result = await updateWhiteLabelSettings({
        hide_powered_by: whiteLabel.hidePoweredBy,
        custom_domain: whiteLabel.customDomain || null,
      })

      if (result.error) {
        showMessage('error', result.error)
      } else {
        showMessage('success', 'White-label settings saved successfully')
        router.refresh()
      }
    })
  }

  const handleResetToDefaults = () => {
    if (
      !confirm(
        'Reset all branding to platform defaults? This cannot be undone.'
      )
    ) {
      return
    }

    startTransition(async () => {
      const result = await resetBrandingToDefaults()

      if (result.error) {
        showMessage('error', result.error)
      } else {
        // Reset local state
        setColors({
          primary: '#7C3AED',
          secondary: '#F59E0B',
          accent: '#10B981',
        })
        setTypography({
          fontFamily: 'Inter, system-ui, sans-serif',
          headingFontFamily: '',
        })
        setCustomCss('')
        setPortal({ welcomeMessage: '' })
        setWhiteLabel({ hidePoweredBy: false, customDomain: '' })
        showMessage('success', 'Branding reset to defaults')
        router.refresh()
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Palette className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Branding</CardTitle>
              <CardDescription>
                Customize your organization&apos;s appearance
              </CardDescription>
            </div>
          </div>
          {(successMessage || errorMessage) && (
            <Badge variant={successMessage ? 'default' : 'destructive'}>
              {successMessage ? <Check className="mr-1 h-3 w-3" /> : null}
              {successMessage || errorMessage}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="colors" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="colors">Colors</TabsTrigger>
            <TabsTrigger value="typography">Typography</TabsTrigger>
            <TabsTrigger value="portal">Portal</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          {/* Colors Tab */}
          <TabsContent value="colors" className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="primary-color">Primary Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    id="primary-color-picker"
                    value={colors.primary}
                    onChange={e =>
                      setColors({ ...colors, primary: e.target.value })
                    }
                    disabled={!isAdmin}
                    className="h-10 w-10 cursor-pointer rounded border p-0"
                  />
                  <Input
                    id="primary-color"
                    value={colors.primary}
                    onChange={e =>
                      setColors({ ...colors, primary: e.target.value })
                    }
                    disabled={!isAdmin}
                    className="flex-1 font-mono uppercase"
                    maxLength={7}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Used for buttons, links, and accents
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secondary-color">Secondary Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    id="secondary-color-picker"
                    value={colors.secondary}
                    onChange={e =>
                      setColors({ ...colors, secondary: e.target.value })
                    }
                    disabled={!isAdmin}
                    className="h-10 w-10 cursor-pointer rounded border p-0"
                  />
                  <Input
                    id="secondary-color"
                    value={colors.secondary}
                    onChange={e =>
                      setColors({ ...colors, secondary: e.target.value })
                    }
                    disabled={!isAdmin}
                    className="flex-1 font-mono uppercase"
                    maxLength={7}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Used for highlights and secondary actions
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accent-color">Accent Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    id="accent-color-picker"
                    value={colors.accent}
                    onChange={e =>
                      setColors({ ...colors, accent: e.target.value })
                    }
                    disabled={!isAdmin}
                    className="h-10 w-10 cursor-pointer rounded border p-0"
                  />
                  <Input
                    id="accent-color"
                    value={colors.accent}
                    onChange={e =>
                      setColors({ ...colors, accent: e.target.value })
                    }
                    disabled={!isAdmin}
                    className="flex-1 font-mono uppercase"
                    maxLength={7}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Used for success states and indicators
                </p>
              </div>
            </div>

            {/* Color Preview */}
            <div className="rounded-lg border p-4">
              <p className="mb-2 text-sm font-medium">Preview</p>
              <div className="flex items-center gap-4">
                <div
                  className="h-12 w-24 rounded"
                  style={{ backgroundColor: colors.primary }}
                />
                <div
                  className="h-12 w-24 rounded"
                  style={{ backgroundColor: colors.secondary }}
                />
                <div
                  className="h-12 w-24 rounded"
                  style={{ backgroundColor: colors.accent }}
                />
                <Button
                  size="sm"
                  style={{ backgroundColor: colors.primary }}
                  className="text-white"
                >
                  Sample Button
                </Button>
              </div>
            </div>

            {isAdmin && (
              <div className="flex justify-end">
                <Button onClick={handleSaveColors} disabled={isPending}>
                  {isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save Colors
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Typography Tab */}
          <TabsContent value="typography" className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="font-family">Body Font</Label>
                <Input
                  id="font-family"
                  value={typography.fontFamily}
                  onChange={e =>
                    setTypography({ ...typography, fontFamily: e.target.value })
                  }
                  disabled={!isAdmin}
                  placeholder="Inter, system-ui, sans-serif"
                />
                <p className="text-xs text-muted-foreground">
                  CSS font-family for body text
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="heading-font">Heading Font (Optional)</Label>
                <Input
                  id="heading-font"
                  value={typography.headingFontFamily}
                  onChange={e =>
                    setTypography({
                      ...typography,
                      headingFontFamily: e.target.value,
                    })
                  }
                  disabled={!isAdmin}
                  placeholder="Leave blank to use body font"
                />
                <p className="text-xs text-muted-foreground">
                  CSS font-family for headings
                </p>
              </div>
            </div>

            {isAdmin && (
              <div className="flex justify-end">
                <Button onClick={handleSaveTypography} disabled={isPending}>
                  {isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save Typography
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Portal Tab */}
          <TabsContent value="portal" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="welcome-message">Portal Welcome Message</Label>
              <Textarea
                id="welcome-message"
                value={portal.welcomeMessage}
                onChange={e =>
                  setPortal({ ...portal, welcomeMessage: e.target.value })
                }
                disabled={!isAdmin}
                placeholder="Welcome to our client portal! Here you can view your documents, schedule appointments, and message us directly."
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Displayed to clients when they log into their portal
              </p>
            </div>

            {isAdmin && (
              <div className="flex justify-end">
                <Button onClick={handleSavePortal} disabled={isPending}>
                  {isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save Portal Settings
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Advanced Tab */}
          <TabsContent value="advanced" className="space-y-6">
            {/* White Label */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">White Label</h4>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label>Hide &quot;Powered by&quot; badge</Label>
                  <p className="text-xs text-muted-foreground">
                    Remove the platform branding from your portal
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!canHidePoweredBy && (
                    <Badge variant="secondary">Professional+</Badge>
                  )}
                  <Switch
                    checked={whiteLabel.hidePoweredBy}
                    onCheckedChange={checked =>
                      setWhiteLabel({ ...whiteLabel, hidePoweredBy: checked })
                    }
                    disabled={!isAdmin || !canHidePoweredBy}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="custom-domain">Custom Subdomain</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="custom-domain"
                    value={whiteLabel.customDomain}
                    onChange={e =>
                      setWhiteLabel({
                        ...whiteLabel,
                        customDomain: e.target.value,
                      })
                    }
                    disabled={!isAdmin}
                    placeholder="your-business"
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground">
                    .birthcrm.com
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Custom subdomain for your client portal (coming soon)
                </p>
              </div>

              {isAdmin && (
                <div className="flex justify-end">
                  <Button onClick={handleSaveWhiteLabel} disabled={isPending}>
                    {isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Save White Label Settings
                  </Button>
                </div>
              )}
            </div>

            <Separator />

            {/* Custom CSS */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Custom CSS</h4>
                <Badge variant="outline">Advanced</Badge>
              </div>

              <Textarea
                value={customCss}
                onChange={e => setCustomCss(e.target.value)}
                disabled={!isAdmin}
                placeholder={`.my-custom-class {
  /* Your custom styles */
}`}
                rows={8}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Add custom CSS to further customize your portal appearance.
                Dangerous patterns like javascript: or @import are not allowed.
              </p>

              {isAdmin && (
                <div className="flex justify-end">
                  <Button onClick={handleSaveCustomCss} disabled={isPending}>
                    {isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Save Custom CSS
                  </Button>
                </div>
              )}
            </div>

            <Separator />

            {/* Reset */}
            {isAdmin && (
              <div className="flex items-center justify-between rounded-lg border border-orange-200 bg-orange-50 p-4">
                <div>
                  <p className="font-medium text-orange-800">
                    Reset to Platform Defaults
                  </p>
                  <p className="text-sm text-orange-700">
                    Remove all custom branding and use platform defaults
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={handleResetToDefaults}
                  disabled={isPending}
                  className="border-orange-300 text-orange-700 hover:bg-orange-100"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
