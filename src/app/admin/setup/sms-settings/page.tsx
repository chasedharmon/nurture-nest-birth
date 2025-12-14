'use client'

import { useState, useEffect } from 'react'
import { useOrganization } from '@/lib/hooks/use-organization'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  MessageSquare,
  Shield,
  Zap,
  AlertCircle,
  CheckCircle,
  Info,
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react'
import {
  getSmsConfig,
  saveSmsConfig,
  saveBYOTCredentials,
  verifyBYOTCredentials,
  deleteBYOTCredentials,
} from '@/app/actions/sms-settings'

type ProviderMode = 'platform' | 'byot'

interface SmsConfig {
  providerMode: ProviderMode
  platformSmsEnabled: boolean
  requireOptIn: boolean
  autoHandleOptOut: boolean
  rateLimitPerMinute: number
}

interface BYOTCredentials {
  accountSid: string
  authToken: string
  phoneNumber: string
  messagingServiceSid?: string
  isVerified?: boolean
  verifiedAt?: string
}

export default function SmsSettingsPage() {
  const { organization } = useOrganization()
  const [config, setConfig] = useState<SmsConfig>({
    providerMode: 'platform',
    platformSmsEnabled: true,
    requireOptIn: true,
    autoHandleOptOut: true,
    rateLimitPerMinute: 60,
  })
  const [credentials, setCredentials] = useState<BYOTCredentials | null>(null)
  const [newCredentials, setNewCredentials] = useState({
    accountSid: '',
    authToken: '',
    phoneNumber: '',
    messagingServiceSid: '',
  })
  const [showAuthToken, setShowAuthToken] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function loadConfig() {
    if (!organization?.id) return

    setLoading(true)
    try {
      const result = await getSmsConfig(organization.id)
      if (result.success && result.data) {
        setConfig(result.data.config)
        setCredentials(result.data.credentials)
      }
    } catch {
      setError('Failed to load SMS settings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (organization?.id) {
      loadConfig()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organization?.id])

  async function handleSaveConfig() {
    if (!organization?.id) return

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await saveSmsConfig(organization.id, config)
      if (result.success) {
        setSuccess('SMS settings saved successfully')
      } else {
        setError(result.error || 'Failed to save settings')
      }
    } catch {
      setError('Failed to save SMS settings')
    } finally {
      setSaving(false)
    }
  }

  async function handleVerifyCredentials() {
    if (!organization?.id) return

    setVerifying(true)
    setError(null)

    try {
      const result = await verifyBYOTCredentials(organization.id, {
        accountSid: newCredentials.accountSid,
        authToken: newCredentials.authToken,
        phoneNumber: newCredentials.phoneNumber,
      })

      if (result.success) {
        setSuccess('Credentials verified successfully!')
        // Save the credentials after verification
        await handleSaveCredentials()
      } else {
        setError(result.error || 'Invalid credentials')
      }
    } catch {
      setError('Failed to verify credentials')
    } finally {
      setVerifying(false)
    }
  }

  async function handleSaveCredentials() {
    if (!organization?.id) return

    setSaving(true)
    setError(null)

    try {
      const result = await saveBYOTCredentials(organization.id, {
        accountSid: newCredentials.accountSid,
        authToken: newCredentials.authToken,
        phoneNumber: newCredentials.phoneNumber,
        messagingServiceSid: newCredentials.messagingServiceSid || undefined,
      })

      if (result.success) {
        setSuccess('Credentials saved successfully')
        await loadConfig() // Reload to get updated credentials
        setNewCredentials({
          accountSid: '',
          authToken: '',
          phoneNumber: '',
          messagingServiceSid: '',
        })
      } else {
        setError(result.error || 'Failed to save credentials')
      }
    } catch {
      setError('Failed to save credentials')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteCredentials() {
    if (
      !organization?.id ||
      !confirm('Are you sure you want to delete your Twilio credentials?')
    )
      return

    setSaving(true)
    setError(null)

    try {
      const result = await deleteBYOTCredentials(organization.id)
      if (result.success) {
        setCredentials(null)
        setConfig({ ...config, providerMode: 'platform' })
        setSuccess('Credentials deleted successfully')
      } else {
        setError(result.error || 'Failed to delete credentials')
      }
    } catch {
      setError('Failed to delete credentials')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">SMS Settings</h1>
        <p className="text-muted-foreground">
          Configure SMS messaging for your organization
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="provider" className="space-y-4">
        <TabsList>
          <TabsTrigger value="provider">Provider</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="provider" className="space-y-4">
          {/* Provider Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                SMS Provider
              </CardTitle>
              <CardDescription>
                Choose how SMS messages are sent from your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Platform Provider Option */}
              <div
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  config.providerMode === 'platform'
                    ? 'border-primary bg-primary/5'
                    : 'hover:border-muted-foreground/50'
                }`}
                onClick={() =>
                  setConfig({ ...config, providerMode: 'platform' })
                }
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" />
                      <span className="font-medium">Platform SMS</span>
                      <Badge variant="secondary">Recommended</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Use our integrated SMS service. Usage is tracked against
                      your subscription limits.
                    </p>
                    <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                      <li>- No setup required</li>
                      <li>- Included in Professional and Enterprise plans</li>
                      <li>- Usage-based billing for overages</li>
                    </ul>
                  </div>
                  <div
                    className={`h-4 w-4 rounded-full border-2 ${
                      config.providerMode === 'platform'
                        ? 'border-primary bg-primary'
                        : 'border-muted-foreground/50'
                    }`}
                  />
                </div>
              </div>

              {/* BYOT Option */}
              <div
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  config.providerMode === 'byot'
                    ? 'border-primary bg-primary/5'
                    : 'hover:border-muted-foreground/50'
                }`}
                onClick={() => setConfig({ ...config, providerMode: 'byot' })}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">Bring Your Own Twilio</span>
                      <Badge variant="outline">Advanced</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Connect your own Twilio account for complete control over
                      messaging and billing.
                    </p>
                    <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                      <li>- Use your existing Twilio account</li>
                      <li>- Direct billing from Twilio</li>
                      <li>- Full control over sender IDs</li>
                    </ul>
                  </div>
                  <div
                    className={`h-4 w-4 rounded-full border-2 ${
                      config.providerMode === 'byot'
                        ? 'border-primary bg-primary'
                        : 'border-muted-foreground/50'
                    }`}
                  />
                </div>
              </div>

              <Button onClick={handleSaveConfig} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Save Provider Selection
              </Button>
            </CardContent>
          </Card>

          {/* BYOT Credentials */}
          {config.providerMode === 'byot' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Twilio Credentials
                </CardTitle>
                <CardDescription>
                  Enter your Twilio account credentials.{' '}
                  <a
                    href="https://console.twilio.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Find them in Twilio Console{' '}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {credentials?.isVerified && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>Credentials Verified</AlertTitle>
                    <AlertDescription>
                      Your Twilio account is connected and verified.
                      {credentials.verifiedAt && (
                        <span className="block text-xs mt-1">
                          Verified on{' '}
                          {new Date(
                            credentials.verifiedAt
                          ).toLocaleDateString()}
                        </span>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="accountSid">Account SID</Label>
                    <Input
                      id="accountSid"
                      placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      value={
                        credentials?.accountSid || newCredentials.accountSid
                      }
                      onChange={e =>
                        setNewCredentials({
                          ...newCredentials,
                          accountSid: e.target.value,
                        })
                      }
                      disabled={!!credentials}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="authToken">Auth Token</Label>
                    <div className="relative">
                      <Input
                        id="authToken"
                        type={showAuthToken ? 'text' : 'password'}
                        placeholder={
                          credentials ? '********' : 'Your auth token'
                        }
                        value={newCredentials.authToken}
                        onChange={e =>
                          setNewCredentials({
                            ...newCredentials,
                            authToken: e.target.value,
                          })
                        }
                        disabled={!!credentials}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowAuthToken(!showAuthToken)}
                      >
                        {showAuthToken ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input
                      id="phoneNumber"
                      placeholder="+1234567890"
                      value={
                        credentials?.phoneNumber || newCredentials.phoneNumber
                      }
                      onChange={e =>
                        setNewCredentials({
                          ...newCredentials,
                          phoneNumber: e.target.value,
                        })
                      }
                      disabled={!!credentials}
                    />
                    <p className="text-xs text-muted-foreground">
                      Your Twilio phone number in E.164 format
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="messagingServiceSid">
                      Messaging Service SID (Optional)
                    </Label>
                    <Input
                      id="messagingServiceSid"
                      placeholder="MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      value={
                        credentials?.messagingServiceSid ||
                        newCredentials.messagingServiceSid
                      }
                      onChange={e =>
                        setNewCredentials({
                          ...newCredentials,
                          messagingServiceSid: e.target.value,
                        })
                      }
                      disabled={!!credentials}
                    />
                    <p className="text-xs text-muted-foreground">
                      If you use Twilio Messaging Services for sender pool
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  {!credentials ? (
                    <>
                      <Button
                        onClick={handleVerifyCredentials}
                        disabled={
                          verifying ||
                          !newCredentials.accountSid ||
                          !newCredentials.authToken ||
                          !newCredentials.phoneNumber
                        }
                      >
                        {verifying ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : null}
                        Verify & Save Credentials
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="destructive"
                      onClick={handleDeleteCredentials}
                      disabled={saving}
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      Remove Credentials
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Compliance Settings
              </CardTitle>
              <CardDescription>
                Configure SMS opt-in/opt-out handling for regulatory compliance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>SMS Compliance</AlertTitle>
                <AlertDescription>
                  SMS messaging is regulated by TCPA (US), GDPR (EU), and
                  carrier policies. Recipients must opt-in before receiving
                  marketing messages.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Require Opt-In</Label>
                    <p className="text-sm text-muted-foreground">
                      Only send SMS to recipients who have explicitly opted in
                    </p>
                  </div>
                  <Switch
                    checked={config.requireOptIn}
                    onCheckedChange={checked =>
                      setConfig({ ...config, requireOptIn: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-Handle Opt-Out</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically process STOP, UNSUBSCRIBE, and other opt-out
                      keywords
                    </p>
                  </div>
                  <Switch
                    checked={config.autoHandleOptOut}
                    onCheckedChange={checked =>
                      setConfig({ ...config, autoHandleOptOut: checked })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Rate Limit (messages per minute)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={600}
                    value={config.rateLimitPerMinute}
                    onChange={e =>
                      setConfig({
                        ...config,
                        rateLimitPerMinute: parseInt(e.target.value) || 60,
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum messages per minute to prevent abuse (recommended:
                    60)
                  </p>
                </div>
              </div>

              <Button onClick={handleSaveConfig} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Save Compliance Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
