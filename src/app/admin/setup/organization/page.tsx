import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
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
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  ChevronLeft,
  Building,
  Upload,
  Copy,
  Eye,
  RefreshCw,
  Trash2,
  AlertTriangle,
  Key,
  Download,
} from 'lucide-react'

async function getOrganizationData(
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // Get organization membership
  const { data: membership } = await supabase
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
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (userData?.organization_id) {
      const { data: org } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', userData.organization_id)
        .single()

      return { organization: org, membership: null, role: 'admin' }
    }
    return null
  }

  return {
    organization: membership.organization,
    membership,
    role: membership.role,
  }
}

export default async function OrganizationPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const data = await getOrganizationData(supabase)

  if (!data?.organization) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>No Organization Found</CardTitle>
            <CardDescription>
              You need to be part of an organization to access these settings.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const { organization, role } = data
  const isAdmin = role === 'owner' || role === 'admin'

  // Generate a masked API key for display
  const maskedApiKey = 'nnb_live_••••••••••••••••••••••••'

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
                <Building className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="font-serif text-2xl font-bold text-foreground">
                  Organization Settings
                </h1>
                <p className="text-sm text-muted-foreground">
                  Manage your organization profile and settings
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Organization Profile */}
          <Card>
            <CardHeader>
              <CardTitle>Organization Profile</CardTitle>
              <CardDescription>
                Basic information about your organization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo */}
              <div className="flex items-center gap-6">
                <div className="flex h-20 w-20 items-center justify-center rounded-lg border-2 border-dashed bg-muted">
                  {organization.logo_url ? (
                    <img
                      src={organization.logo_url}
                      alt="Organization logo"
                      className="h-full w-full rounded-lg object-cover"
                    />
                  ) : (
                    <Building className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <Button variant="outline" size="sm" disabled={!isAdmin}>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Logo
                  </Button>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Recommended: 200x200px PNG or JPG
                  </p>
                </div>
              </div>

              <Separator />

              {/* Name & Slug */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Organization Name</Label>
                  <Input
                    id="name"
                    defaultValue={organization.name}
                    disabled={!isAdmin}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">URL Slug</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      nurturenest.app/
                    </span>
                    <Input
                      id="slug"
                      defaultValue={organization.slug}
                      disabled
                      className="flex-1"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    URL slug cannot be changed after creation
                  </p>
                </div>
              </div>

              {/* Branding Colors */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="primary-color">Primary Color</Label>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-10 w-10 rounded-md border"
                      style={{ backgroundColor: organization.primary_color }}
                    />
                    <Input
                      id="primary-color"
                      defaultValue={organization.primary_color}
                      disabled={!isAdmin}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondary-color">Secondary Color</Label>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-10 w-10 rounded-md border"
                      style={{ backgroundColor: organization.secondary_color }}
                    />
                    <Input
                      id="secondary-color"
                      defaultValue={organization.secondary_color}
                      disabled={!isAdmin}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              {isAdmin && (
                <div className="flex justify-end">
                  <Button>Save Changes</Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* API Keys */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    API Keys
                  </CardTitle>
                  <CardDescription>
                    Manage API keys for external integrations
                  </CardDescription>
                </div>
                <Badge variant="secondary">Professional+</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-background">
                      <Key className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">Live API Key</p>
                      <p className="font-mono text-sm text-muted-foreground">
                        {maskedApiKey}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" title="Show key">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" title="Copy key">
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" title="Regenerate key">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">
                  Your API key provides access to the Nurture Nest API. Keep it
                  secure and never share it publicly.
                </p>

                {isAdmin && (
                  <Button variant="outline">
                    <Key className="mr-2 h-4 w-4" />
                    Generate New Key
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>
                Export your data or manage your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Export Data */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">Export Data</p>
                  <p className="text-sm text-muted-foreground">
                    Download all your organization data as a ZIP file
                  </p>
                </div>
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Request Export
                </Button>
              </div>

              {/* Danger Zone */}
              {isAdmin && (
                <>
                  <Separator />
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                    <div className="flex items-center gap-2 text-red-800">
                      <AlertTriangle className="h-5 w-5" />
                      <h3 className="font-medium">Danger Zone</h3>
                    </div>
                    <p className="mt-2 text-sm text-red-700">
                      These actions are irreversible. Please proceed with
                      caution.
                    </p>
                    <div className="mt-4 flex gap-3">
                      <Button
                        variant="outline"
                        className="border-red-300 text-red-700 hover:bg-red-100"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Organization
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Organization Members Preview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Organization Members</CardTitle>
                  <CardDescription>
                    People who have access to this organization
                  </CardDescription>
                </div>
                <Link href="/admin/setup/users">
                  <Button variant="outline" size="sm">
                    Manage Members
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Visit the Users page to manage organization members, send
                invitations, and configure roles.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
