'use client'

/**
 * AdminNavigation
 *
 * Main navigation wrapper component for the admin portal.
 * Renders the desktop header, mobile nav, and breadcrumbs.
 */

import { AdminNavHeader } from './admin-nav-header'
import { AdminMobileNav } from './admin-mobile-nav'
import { Breadcrumbs } from './breadcrumbs'
import type { NavigationConfig } from '@/lib/admin-navigation'

interface AdminNavigationProps {
  config: NavigationConfig
  userRole: string | null
}

export function AdminNavigation({ config, userRole }: AdminNavigationProps) {
  return (
    <>
      {/* Main Navigation Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-sm supports-[backdrop-filter]:bg-card/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Mobile Menu (shown on lg and below) */}
            <div className="lg:hidden">
              <AdminMobileNav config={config} />
            </div>

            {/* Desktop Header (hidden on mobile) */}
            <AdminNavHeader config={config} userRole={userRole} />
          </div>
        </div>

        {/* Breadcrumbs */}
        <div className="border-t border-border/50 bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 py-2 sm:px-6 lg:px-8">
            <Breadcrumbs />
          </div>
        </div>
      </header>
    </>
  )
}
