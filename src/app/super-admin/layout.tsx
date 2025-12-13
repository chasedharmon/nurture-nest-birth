import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Building2,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
} from 'lucide-react'

import { platformConfig } from '@/config/platform'
import { createClient } from '@/lib/supabase/server'
import { requirePlatformAdmin } from '@/lib/platform/super-admin'
import { Button } from '@/components/ui/button'

/**
 * Super-Admin Portal Layout
 *
 * Protected layout that requires `is_platform_admin = true` on the user.
 * Provides a distinct navigation from the tenant /admin portal.
 *
 * This is internal tooling for platform operators to:
 * - View all tenants
 * - Provision new tenants
 * - Suspend/reactivate tenants
 * - Impersonate users for support
 */
export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Require platform admin access - throws if not authorized
  let admin
  try {
    admin = await requirePlatformAdmin()
  } catch {
    // Not a platform admin - redirect to home
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-violet-600 text-white">
              <Building2 className="size-5" />
            </div>
            <div>
              <span className="font-semibold text-slate-900 dark:text-white">
                {platformConfig.name}
              </span>
              <span className="ml-2 rounded bg-violet-100 px-1.5 py-0.5 text-xs font-medium text-violet-700 dark:bg-violet-900/50 dark:text-violet-300">
                Platform Admin
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-1">
            <Link href="/super-admin">
              <Button variant="ghost" size="sm" className="gap-2">
                <LayoutDashboard className="size-4" />
                Dashboard
              </Button>
            </Link>
            <Link href="/super-admin/tenants">
              <Button variant="ghost" size="sm" className="gap-2">
                <Users className="size-4" />
                Tenants
              </Button>
            </Link>
            <Link href="/super-admin/settings">
              <Button variant="ghost" size="sm" className="gap-2">
                <Settings className="size-4" />
                Settings
              </Button>
            </Link>
          </nav>

          {/* User Menu */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {admin.email}
            </span>
            <form
              action={async () => {
                'use server'
                const supabase = await createClient()
                await supabase.auth.signOut()
                redirect('/login')
              }}
            >
              <Button variant="ghost" size="icon-sm" type="submit">
                <LogOut className="size-4" />
                <span className="sr-only">Sign out</span>
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-slate-500">
            {platformConfig.name} Platform Admin •{' '}
            {platformConfig.legal.copyrightYear}
          </p>
        </div>
      </footer>
    </div>
  )
}
