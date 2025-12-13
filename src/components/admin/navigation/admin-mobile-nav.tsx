'use client'

/**
 * AdminMobileNav
 *
 * Mobile navigation using Sheet drawer.
 * Shows all navigation items organized by section.
 * Icons are looked up client-side using getIconComponent().
 */

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, LogOut, Home } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { createClient } from '@/lib/supabase/client'
import { buildUrlWithPreservedParams } from '@/lib/navigation-utils'
import {
  type SerializableNavigationConfig,
  type SerializableNavItem,
  getIconComponent,
} from '@/lib/admin-navigation'

interface AdminMobileNavProps {
  config: SerializableNavigationConfig
}

function NavSection({
  title,
  items,
  pathname,
  onClose,
}: {
  title: string
  items: SerializableNavItem[]
  pathname: string
  onClose: () => void
}) {
  if (items.length === 0) return null

  return (
    <div className="space-y-1">
      <h3 className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      <ul className="space-y-1">
        {items.map(item => {
          const Icon = getIconComponent(item.icon)
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`)
          const href = buildUrlWithPreservedParams(item.href)

          return (
            <li key={item.id}>
              <Link
                href={href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  'min-h-[44px]', // Minimum touch target
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                {Icon && <Icon className="h-5 w-5 shrink-0" />}
                <span className="flex-1">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <Badge variant="destructive" className="h-5 min-w-5 px-1.5">
                    {item.badge > 99 ? '99+' : item.badge}
                  </Badge>
                )}
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export function AdminMobileNav({ config }: AdminMobileNavProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const handleClose = () => setIsOpen(false)

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    handleClose()
    router.push('/login')
    router.refresh()
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-11 w-11"
          aria-label="Open navigation menu"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 p-0">
        <SheetHeader className="border-b border-border p-4">
          <SheetTitle className="text-left">
            <Link
              href="/admin"
              onClick={handleClose}
              className="flex items-center gap-2 font-serif text-lg font-bold text-foreground"
            >
              {config.brandLogoUrl ? (
                <img
                  src={config.brandLogoUrl}
                  alt={config.brandName}
                  className="h-7 w-auto"
                />
              ) : (
                config.brandName
              )}
            </Link>
          </SheetTitle>
        </SheetHeader>

        <nav className="flex flex-col p-4 space-y-6 overflow-y-auto max-h-[calc(100vh-8rem)]">
          {/* Dashboard Link */}
          <Link
            href="/admin"
            onClick={handleClose}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              'min-h-[44px]',
              pathname === '/admin'
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
            aria-current={pathname === '/admin' ? 'page' : undefined}
          >
            <Home className="h-5 w-5" />
            <span>Dashboard</span>
          </Link>

          {/* CRM Objects Section */}
          <NavSection
            title="CRM"
            items={config.primaryTabs}
            pathname={pathname}
            onClose={handleClose}
          />

          {/* Tools Section */}
          <NavSection
            title="Tools"
            items={config.toolsMenu}
            pathname={pathname}
            onClose={handleClose}
          />

          {/* Admin Section */}
          <NavSection
            title="Admin"
            items={config.adminMenu}
            pathname={pathname}
            onClose={handleClose}
          />
        </nav>

        {/* Sign Out Button - Fixed at bottom */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-border bg-card p-4">
          <Button
            variant="outline"
            onClick={handleSignOut}
            className="w-full justify-start gap-3 text-destructive hover:text-destructive"
          >
            <LogOut className="h-5 w-5" />
            <span>Sign Out</span>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
