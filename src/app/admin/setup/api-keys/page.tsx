import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getApiKeys } from '@/app/actions/api-keys'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, Key, Plus, AlertTriangle } from 'lucide-react'
import { ApiKeysTable } from './api-keys-table'
import { CreateApiKeyDialog } from './create-api-key-dialog'

export default async function ApiKeysPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const keysResult = await getApiKeys()
  const keys = keysResult.success ? (keysResult.keys ?? []) : []

  const activeKeys = keys.filter(k => k.is_active && !k.revoked_at)
  const revokedKeys = keys.filter(k => k.revoked_at)
  const expiredKeys = keys.filter(
    k => k.expires_at && new Date(k.expires_at) < new Date()
  )

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
                  <Key className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="font-serif text-xl font-bold text-foreground">
                    API Keys
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Manage API access for integrations
                  </p>
                </div>
              </div>
            </div>
            <CreateApiKeyDialog />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Security Notice */}
        <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Security Notice
              </h3>
              <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                API keys provide full access to your account data. Never share
                your API keys publicly or commit them to version control. Revoke
                any keys that may have been compromised.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Keys</CardTitle>
              <Key className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeKeys.length}</div>
              <p className="text-xs text-muted-foreground">Currently in use</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Revoked Keys
              </CardTitle>
              <Key className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {revokedKeys.length}
              </div>
              <p className="text-xs text-muted-foreground">No longer valid</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Expired Keys
              </CardTitle>
              <Key className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {expiredKeys.length}
              </div>
              <p className="text-xs text-muted-foreground">
                Past expiration date
              </p>
            </CardContent>
          </Card>
        </div>

        {/* API Keys Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              All API Keys
              {keys.length > 0 && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({keys.length} total)
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {keys.length === 0 ? (
              <div className="p-8 text-center">
                <Key className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                <h3 className="mb-2 text-lg font-medium">No API Keys</h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  Create your first API key to start integrating with external
                  applications.
                </p>
                <CreateApiKeyDialog>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create API Key
                  </Button>
                </CreateApiKeyDialog>
              </div>
            ) : (
              <ApiKeysTable keys={keys} />
            )}
          </CardContent>
        </Card>

        {/* Documentation Link */}
        <div className="mt-8 rounded-lg border bg-muted/50 p-4">
          <h3 className="mb-2 text-sm font-medium">API Documentation</h3>
          <p className="text-sm text-muted-foreground">
            Learn how to use API keys to integrate Nurture Nest Birth CRM with
            your applications. Our API supports REST endpoints for managing
            leads, contacts, invoices, and more.
          </p>
          <Button variant="outline" size="sm" className="mt-3" disabled>
            View API Docs (Coming Soon)
          </Button>
        </div>
      </main>
    </div>
  )
}
